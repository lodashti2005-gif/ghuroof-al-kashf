create policy "No direct public access" on public.contact_submissions
for all to anon, authenticated
using (false)
with check (false);
