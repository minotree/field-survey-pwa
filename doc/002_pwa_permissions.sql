-- Field Survey PWA permissions v2.0 / 2026-09-23
-- Preconditions: 001_shared_schema.sql applied; Supabase Auth signup disabled; operator account created manually.
-- survey-photos bucket must be PRIVATE and created in Dashboard before Storage policies.

begin;
grant select, insert, update on public.survey_locations to authenticated;

create policy survey_locations_operator_select on public.survey_locations
for select to authenticated using (auth.uid() is not null);
create policy survey_locations_operator_insert on public.survey_locations
for insert to authenticated with check (auth.uid() is not null and created_by = auth.uid());
create policy survey_locations_operator_update on public.survey_locations
for update to authenticated using (created_by = auth.uid()) with check (created_by = auth.uid());
commit;

-- Storage policies: apply only after creating PRIVATE bucket survey-photos.
-- Example policy bodies should restrict bucket_id='survey-photos' and authenticated users.
-- Keep public/anon upload disabled. Review current Supabase Storage policy syntax before applying.
