create table if not exists public.device_trials (
  device_id text not null,
  case_id text not null,
  started_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  primary key (device_id, case_id)
);

grant all on public.device_trials to service_role;

alter table public.device_trials enable row level security;

create or replace function public.trial_duration_seconds()
returns integer language sql immutable set search_path = public as $$ select 600 $$;

create or replace function public.device_trial_state(_device_id text, _case_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  r public.device_trials;
  total int := public.trial_duration_seconds();
  remaining int;
begin
  if coalesce(length(_device_id), 0) = 0 or length(_device_id) > 64
     or coalesce(length(_case_id), 0) = 0 or length(_case_id) > 64 then
    return jsonb_build_object('status', 'invalid');
  end if;

  select * into r from public.device_trials
   where device_id = _device_id and case_id = _case_id;

  if r.device_id is null then
    return jsonb_build_object('status', 'ok', 'started', false,
      'total_seconds', total, 'remaining_seconds', total, 'expired', false);
  end if;

  remaining := greatest(0, total - floor(extract(epoch from (now() - r.started_at)))::int);

  update public.device_trials set last_seen_at = now()
   where device_id = _device_id and case_id = _case_id;

  return jsonb_build_object('status', 'ok', 'started', true,
    'started_at', r.started_at, 'total_seconds', total,
    'remaining_seconds', remaining, 'expired', remaining <= 0);
end;
$$;

create or replace function public.device_trial_start(_device_id text, _case_id text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  if coalesce(length(_device_id), 0) = 0 or length(_device_id) > 64
     or coalesce(length(_case_id), 0) = 0 or length(_case_id) > 64 then
    return jsonb_build_object('status', 'invalid');
  end if;
  if not exists (select 1 from public.cases where id = _case_id) then
    return jsonb_build_object('status', 'unknown_case');
  end if;

  insert into public.device_trials (device_id, case_id)
  values (_device_id, _case_id)
  on conflict (device_id, case_id) do nothing;

  return public.device_trial_state(_device_id, _case_id);
end;
$$;

create or replace function public.has_active_device_trial(_device_id text, _case_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.device_trials
     where device_id = _device_id and case_id = _case_id
       and now() < started_at + (public.trial_duration_seconds() || ' seconds')::interval
  );
$$;

create or replace function public.room_create_v2(
  _code text, _case_id text, _host_player_id text, _host_name text,
  _state jsonb, _device_id text
)
returns text
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
  if not public.has_case_entitlement(_owner, _case_id_clean)
     and not public.has_active_device_trial(coalesce(_device_id, ''), _case_id_clean) then
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

grant execute on function public.device_trial_state(text, text) to anon, authenticated;
grant execute on function public.device_trial_start(text, text) to anon, authenticated;
grant execute on function public.room_create_v2(text, text, text, text, jsonb, text) to anon, authenticated;