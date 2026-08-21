-- 1. Membership helper
create or replace function public.room_is_member(_code text, _player_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.room_players
    where room_code = _code and player_id = _player_id
  )
$$;

-- 2. Create room
create or replace function public.room_create(
  _code text, _case_id text, _host_player_id text, _host_name text, _state jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if _code !~ '^[0-9]{6}$' then return 'invalid_code'; end if;
  if coalesce(length(btrim(_host_name)), 0) = 0 or length(btrim(_host_name)) > 24 then
    return 'invalid_name';
  end if;
  if coalesce(length(_host_player_id), 0) = 0 or length(_host_player_id) > 64 then
    return 'invalid_player';
  end if;
  if exists (select 1 from public.rooms where code = _code) then return 'code_taken'; end if;

  insert into public.rooms (code, case_id, phase, host_player_id, state)
  values (_code, left(_case_id, 64), 'lobby', _host_player_id, coalesce(_state, '{}'::jsonb));

  insert into public.room_players (room_code, player_id, name, is_host)
  values (_code, _host_player_id, btrim(_host_name), true);

  return 'ok';
end;
$$;

-- 3. Join room
create or replace function public.room_join(_code text, _player_id text, _name text)
returns text
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(length(btrim(_name)), 0) = 0 or length(btrim(_name)) > 24 then
    return 'invalid_name';
  end if;
  if coalesce(length(_player_id), 0) = 0 or length(_player_id) > 64 then
    return 'invalid_player';
  end if;
  if not exists (select 1 from public.rooms where code = _code) then return 'not_found'; end if;
  if exists (
    select 1 from public.room_players
    where room_code = _code and btrim(name) = btrim(_name) and player_id <> _player_id
  ) then
    return 'name_taken';
  end if;

  insert into public.room_players (room_code, player_id, name, is_host)
  values (_code, _player_id, btrim(_name), false)
  on conflict do nothing;

  return 'ok';
end;
$$;

-- 4. Snapshot (membership-scoped, votes stay secret until everyone voted)
create or replace function public.room_snapshot(_code text, _player_id text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  r public.rooms;
  player_count int;
  vote_count int;
  reveal boolean;
begin
  if not public.room_is_member(_code, _player_id) then return null; end if;
  select * into r from public.rooms where code = _code;
  if r.code is null then return null; end if;

  select count(*) into player_count from public.room_players where room_code = _code;
  select count(*) into vote_count from public.room_votes where room_code = _code;
  reveal := r.phase = 'reveal' or (player_count > 0 and vote_count >= player_count);

  return jsonb_build_object(
    'room', jsonb_build_object(
      'code', r.code,
      'case_id', r.case_id,
      'phase', r.phase,
      'host_player_id', r.host_player_id,
      'state', r.state,
      'created_at', r.created_at,
      'updated_at', r.updated_at
    ),
    'players', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id', p.player_id, 'name', p.name,
        'is_host', p.is_host, 'joined_at', p.joined_at
      ) order by p.joined_at)
      from public.room_players p where p.room_code = _code
    ), '[]'::jsonb),
    'votes', coalesce((
      select jsonb_agg(jsonb_build_object(
        'player_id', v.player_id,
        'suspect_id', case when reveal or v.player_id = _player_id then v.suspect_id else 'hidden' end
      ))
      from public.room_votes v where v.room_code = _code
    ), '[]'::jsonb)
  );
end;
$$;

-- 5. Leave (own row only)
create or replace function public.room_leave(_code text, _player_id text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.room_players where room_code = _code and player_id = _player_id
$$;

-- 6. Shared state write (members only, optimistic concurrency)
create or replace function public.room_set_state(
  _code text, _player_id text, _phase text, _state jsonb, _expected_updated_at timestamptz
) returns timestamptz
language plpgsql
security definer
set search_path = public
as $$
declare
  new_ts timestamptz;
begin
  if not public.room_is_member(_code, _player_id) then return null; end if;
  if _phase not in ('lobby', 'roles', 'intro', 'investigation', 'voting', 'reveal') then
    return null;
  end if;

  update public.rooms
     set phase = _phase,
         state = coalesce(_state, '{}'::jsonb),
         updated_at = now()
   where code = _code
     and (_expected_updated_at is null or updated_at = _expected_updated_at)
  returning updated_at into new_ts;

  return new_ts;
end;
$$;

-- 7. Vote (own player id, one vote, immutable)
create or replace function public.room_cast_vote(_code text, _player_id text, _suspect_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.room_is_member(_code, _player_id) then return false; end if;
  if coalesce(length(_suspect_id), 0) = 0 or length(_suspect_id) > 64 then return false; end if;

  insert into public.room_votes (room_code, player_id, suspect_id)
  values (_code, _player_id, _suspect_id)
  on conflict (room_code, player_id) do nothing;

  return true;
end;
$$;

-- 8. Reset votes (host only)
create or replace function public.room_reset_votes(_code text, _player_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1 from public.rooms where code = _code and host_player_id = _player_id
  ) then
    return false;
  end if;
  delete from public.room_votes where room_code = _code;
  return true;
end;
$$;

-- 9. Lock the tables down: no direct client access at all
drop policy if exists rooms_public_read on public.rooms;
drop policy if exists rooms_public_insert on public.rooms;
drop policy if exists rooms_public_update on public.rooms;
drop policy if exists room_players_public_read on public.room_players;
drop policy if exists room_players_public_insert on public.room_players;
drop policy if exists room_players_public_update on public.room_players;
drop policy if exists room_players_public_delete on public.room_players;
drop policy if exists room_votes_public_read on public.room_votes;
drop policy if exists room_votes_public_insert on public.room_votes;
drop policy if exists room_votes_public_update on public.room_votes;

alter table public.rooms enable row level security;
alter table public.room_players enable row level security;
alter table public.room_votes enable row level security;

revoke all on public.rooms from anon, authenticated;
revoke all on public.room_players from anon, authenticated;
revoke all on public.room_votes from anon, authenticated;
grant all on public.rooms to service_role;
grant all on public.room_players to service_role;
grant all on public.room_votes to service_role;

grant execute on function public.room_create(text, text, text, text, jsonb) to anon, authenticated;
grant execute on function public.room_join(text, text, text) to anon, authenticated;
grant execute on function public.room_snapshot(text, text) to anon, authenticated;
grant execute on function public.room_leave(text, text) to anon, authenticated;
grant execute on function public.room_set_state(text, text, text, jsonb, timestamptz) to anon, authenticated;
grant execute on function public.room_cast_vote(text, text, text) to anon, authenticated;
grant execute on function public.room_reset_votes(text, text) to anon, authenticated;
revoke execute on function public.room_is_member(text, text) from anon, authenticated;