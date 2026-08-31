alter table public.player_events
  add column if not exists visitor_id text,
  add column if not exists session_id text,
  add column if not exists source text,
  add column if not exists utm_source text,
  add column if not exists utm_medium text,
  add column if not exists utm_campaign text,
  add column if not exists referrer text;

create index if not exists player_events_created_at_idx on public.player_events (created_at desc);
create index if not exists player_events_visitor_idx on public.player_events (visitor_id);
create index if not exists player_events_session_idx on public.player_events (session_id);

create table if not exists public.analytics_excluded_users (
  user_id uuid primary key,
  reason text not null default 'owner',
  note text,
  created_at timestamptz not null default now()
);

grant select on public.analytics_excluded_users to authenticated;
grant all on public.analytics_excluded_users to service_role;

alter table public.analytics_excluded_users enable row level security;

create policy "admins read excluded users"
on public.analytics_excluded_users
for select
to authenticated
using (public.has_role(auth.uid(), 'admin'));

insert into public.analytics_excluded_users (user_id, reason, note) values
  ('a844492f-cbcd-45a1-a2c0-4818c0b47762', 'owner', 'حساب المالك/المشرف'),
  ('c502ef5f-4686-4f64-a3b2-df4b11a75557', 'owner', 'حساب المالك — عملية الشراء التجريبية'),
  ('e507721e-cd6a-453e-ac07-726938acb91a', 'test', 'حساب اختبار قبل الإطلاق')
on conflict (user_id) do nothing;