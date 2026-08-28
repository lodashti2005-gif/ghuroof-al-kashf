-- 1) columns
alter table public.room_players add column if not exists user_id uuid references auth.users(id) on delete set null;
alter table public.room_players add column if not exists last_seen_at timestamptz not null default now();

-- 2) dedupe existing rows before unique indexes
delete from public.room_players p
using public.room_players q
where p.room_code = q.room_code
  and p.player_id = q.player_id
  and p.ctid > q.ctid;

delete from public.room_players p
using public.room_players q
where p.user_id is not null
  and p.room_code = q.room_code
  and p.user_id = q.user_id
  and p.ctid > q.ctid;

create unique index if not exists room_players_code_player_uidx
  on public.room_players (room_code, player_id);
create unique index if not exists room_players_code_user_uidx
  on public.room_players (room_code, user_id) where user_id is not null;

-- 3) heartbeat + prune of dead rows (never removes an active player nor the host)
create or replace function public.room_prune(_code text)
returns void
language sql
security definer
set search_path = public
as $$
  delete from public.room_players
  where room_code = _code
    and is_host = false
    and last_seen_at < now() - interval '120 seconds';
$$;

create or replace function public.room_heartbeat(_code text, _player_id text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.room_players
     set last_seen_at = now()
   where room_code = _code and player_id = _player_id;
  if not found then return false; end if;
  perform public.room_prune(_code);
  return true;
end;
$$;

revoke all on function public.room_prune(text) from public;
revoke all on function public.room_heartbeat(text, text) from public;
grant execute on function public.room_prune(text) to anon, authenticated, service_role;
grant execute on function public.room_heartbeat(text, text) to anon, authenticated, service_role;

-- 4) create room: bind host row to the owning account
create or replace function public.room_create(
  _code text, _case_id text, _host_player_id text, _host_name text, _state jsonb
) returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  _owner uuid := auth.uid();
  _case_id_clean text := left(_case_id, 64);
begin
  if _code !~ '^[0-9]{6}$' then return 'invalid_code'; end if;
  if coalesce(length(btrim(_host_name)), 0) = 0 or length(btrim(_host_name)) > 24 then
    return 'invalid_name';
  end if;
  if coalesce(length(_host_player_id), 0) = 0 or length(_host_player_id) > 64 then
    return 'invalid_player';
  end if;
  if not exists (select 1 from public.cases where id = _case_id_clean) then
    return 'unknown_case';
  end if;
  if not public.has_case_entitlement(_owner, _case_id_clean) then
    return 'not_entitled';
  end if;
  if exists (select 1 from public.rooms where code = _code) then return 'code_taken'; end if;

  insert into public.rooms (code, case_id, phase, host_player_id, state, owner_user_id)
  values (_code, _case_id_clean, 'lobby', _host_player_id, coalesce(_state, '{}'::jsonb), _owner);

  insert into public.room_players (room_code, player_id, name, is_host, user_id, last_seen_at)
  values (_code, _host_player_id, btrim(_host_name), true, _owner, now());

  return 'ok';
end;
$$;

-- 5) join: account-stable identity, 6-player cap, no duplicate rows
create or replace function public.room_join_v2(_code text, _player_id text, _name text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  _user uuid := auth.uid();
  _existing text;
  _count int;
begin
  if coalesce(length(btrim(_name)), 0) = 0 or length(btrim(_name)) > 24 then
    return jsonb_build_object('status', 'invalid_name');
  end if;
  if coalesce(length(_player_id), 0) = 0 or length(_player_id) > 64 then
    return jsonb_build_object('status', 'invalid_player');
  end if;
  if not exists (select 1 from public.rooms where code = _code) then
    return jsonb_build_object('status', 'not_found');
  end if;

  -- same account (any device/browser) → keep the very same player identity
  if _user is not null then
    select player_id into _existing
      from public.room_players
     where room_code = _code and user_id = _user
     limit 1;
    if _existing is not null then
      update public.room_players
         set last_seen_at = now()
       where room_code = _code and player_id = _existing;
      return jsonb_build_object('status', 'ok', 'player_id', _existing);
    end if;
  end if;

  -- same tab/session re-joining with its own player id
  if exists (select 1 from public.room_players where room_code = _code and player_id = _player_id) then
    update public.room_players
       set last_seen_at = now(),
           user_id = coalesce(user_id, _user)
     where room_code = _code and player_id = _player_id;
    return jsonb_build_object('status', 'ok', 'player_id', _player_id);
  end if;

  -- drop dead rows first so a real seat is not blocked by a stale one
  perform public.room_prune(_code);

  select count(*) into _count from public.room_players where room_code = _code;
  if _count >= 6 then
    return jsonb_build_object('status', 'room_full');
  end if;

  if exists (
    select 1 from public.room_players
    where room_code = _code and btrim(name) = btrim(_name) and player_id <> _player_id
  ) then
    return jsonb_build_object('status', 'name_taken');
  end if;

  insert into public.room_players (room_code, player_id, name, is_host, user_id, last_seen_at)
  values (_code, _player_id, btrim(_name), false, _user, now())
  on conflict (room_code, player_id) do update set last_seen_at = now();

  return jsonb_build_object('status', 'ok', 'player_id', _player_id);
end;
$$;

revoke all on function public.room_join_v2(text, text, text) from public;
grant execute on function public.room_join_v2(text, text, text) to anon, authenticated, service_role;

-- 6) snapshot exposes last_seen_at so clients stop hiding briefly-offline players
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
        'is_host', p.is_host, 'joined_at', p.joined_at,
        'last_seen_at', p.last_seen_at
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