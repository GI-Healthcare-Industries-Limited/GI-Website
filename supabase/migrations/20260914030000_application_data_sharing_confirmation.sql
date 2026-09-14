-- Explicit candidate confirmation, separate from the privacy notice version.
-- No default or backfill: never invent agreement for an existing application.
alter table public.career_applications
  add column data_sharing_acknowledged_at timestamptz,
  add column data_sharing_statement_version text,
  add constraint career_applications_data_sharing_confirmation_check check (
    (data_sharing_acknowledged_at is null and data_sharing_statement_version is null)
    or (data_sharing_acknowledged_at is not null and data_sharing_statement_version is not null
      and char_length(data_sharing_statement_version) between 1 and 80)
  );
comment on column public.career_applications.data_sharing_acknowledged_at is
  'Server receipt time of an affirmative recruitment data-sharing checkbox. NULL means not recorded; not retroactive consent.';
comment on column public.career_applications.data_sharing_statement_version is
  'recruitment-data-sharing-v1: I’m happy to share my data with GI Healthcare. Separate from processing bases in the privacy notice. Expires with the application.';
notify pgrst, 'reload schema';
