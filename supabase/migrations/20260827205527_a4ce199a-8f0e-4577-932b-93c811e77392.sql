create type public.app_role as enum ('admin','user');

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role public.app_role not null,
  created_at timestamptz not null default now(),
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "users read own roles" on public.user_roles for select to authenticated using (user_id = auth.uid());

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

insert into public.user_roles (user_id, role)
values ('c502ef5f-4686-4f64-a3b2-df4b11a75557', 'admin')
on conflict do nothing;

create table public.paddle_webhook_events (
  id uuid primary key default gen_random_uuid(),
  event_id text,
  event_type text not null,
  transaction_id text,
  case_id text,
  user_id uuid,
  outcome text not null,
  detail text,
  amount numeric,
  currency text,
  created_at timestamptz not null default now()
);
create index paddle_webhook_events_created_idx on public.paddle_webhook_events (created_at desc);
create index paddle_webhook_events_txn_idx on public.paddle_webhook_events (transaction_id);
grant select on public.paddle_webhook_events to authenticated;
grant all on public.paddle_webhook_events to service_role;
alter table public.paddle_webhook_events enable row level security;
create policy "admins read webhook events" on public.paddle_webhook_events
  for select to authenticated using (public.has_role(auth.uid(), 'admin'));