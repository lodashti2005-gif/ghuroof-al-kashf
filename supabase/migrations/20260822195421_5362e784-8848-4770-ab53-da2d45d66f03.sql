-- 1. profiles (app users)
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "profiles_select_own" on public.profiles for select to authenticated using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "profiles_update_own" on public.profiles for update to authenticated using (auth.uid() = id) with check (auth.uid() = id);

-- 2. cases catalog (store)
create table if not exists public.cases (
  id text primary key,
  code text not null,
  title text not null,
  teaser text not null,
  difficulty text not null default 'متوسطة',
  min_players int not null default 3,
  max_players int not null default 6,
  play_minutes int not null default 60,
  price_kwd numeric(6,3),
  is_free boolean not null default false,
  status text not null default 'available',
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
grant select on public.cases to anon, authenticated;
grant all on public.cases to service_role;
alter table public.cases enable row level security;
create policy "cases_public_read" on public.cases for select to anon, authenticated using (true);

insert into public.cases (id, code, title, teaser, difficulty, min_players, max_players, play_minutes, price_kwd, is_free, status, sort_order)
values
  ('chalet-case', 'K-1041', 'قضية الشاليه', 'ليلة عادية بين مجموعة أصدقاء انتهت بجريمة... وكل واحد عنده رواية.', 'متوسطة', 3, 6, 75, null, true, 'available', 1),
  ('coming-soon-1', 'K-????', 'قضية جديدة', 'ملف جديد قيد التحضير... السالفة لِسِه مغلقة.', 'صعبة', 4, 6, 80, null, false, 'soon', 2)
on conflict (id) do nothing;

-- 3. purchases / entitlements
create table if not exists public.case_purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id text not null references public.cases(id) on delete cascade,
  status text not null default 'pending',
  amount_kwd numeric(6,3),
  provider text,
  provider_ref text,
  purchased_at timestamptz,
  created_at timestamptz not null default now(),
  unique (user_id, case_id)
);
grant select on public.case_purchases to authenticated;
grant all on public.case_purchases to service_role;
alter table public.case_purchases enable row level security;
create policy "purchases_select_own" on public.case_purchases for select to authenticated using (auth.uid() = user_id);

-- 4. entitlement helper
create or replace function public.has_case_entitlement(_user_id uuid, _case_id text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.cases c where c.id = _case_id and c.is_free)
      or (_user_id is not null and exists (
            select 1 from public.case_purchases p
            where p.user_id = _user_id and p.case_id = _case_id and p.status = 'paid'
          ));
$$;
revoke all on function public.has_case_entitlement(uuid, text) from public;
grant execute on function public.has_case_entitlement(uuid, text) to authenticated, service_role;

-- 5. room ownership
alter table public.rooms add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

-- 6. room_create now verifies the host owns the case (server-side, uses auth.uid())
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

  insert into public.room_players (room_code, player_id, name, is_host)
  values (_code, _host_player_id, btrim(_host_name), true);

  return 'ok';
end;
$$;