-- Retain existing answers and declarations; apply the compact format only to v2.
create function public.application_word_count(value text) returns integer
language sql immutable parallel safe set search_path = pg_catalog as $$
  select count(*)::integer from regexp_matches(coalesce(value, ''), U&'[^\0009-\000D\0020\00A0\1680\2000-\200A\2028\2029\202F\205F\3000\FEFF]+', 'g');
$$;

create function public.application_awards_valid(value text[]) returns boolean
language sql immutable parallel safe set search_path = pg_catalog as $$
  select coalesce(array_ndims(value), 1) = 1 and cardinality(value) <= 10
    and not exists (select 1 from unnest(value) as award where award is null
      or char_length(award) > 1600 or public.application_word_count(award) not between 1 and 20);
$$;
revoke all on function public.application_word_count(text), public.application_awards_valid(text[]) from public, anon, authenticated;
grant execute on function public.application_word_count(text), public.application_awards_valid(text[]) to service_role;

alter table public.career_applications
  add column award_entries text[],
  drop constraint career_applications_project_summary_check,
  drop constraint career_applications_biggest_failure_check,
  drop constraint career_applications_growth_area_check,
  drop constraint career_applications_personal_answers_check,
  add constraint career_applications_project_summary_check check (
    case when application_questions_version = 'application-questions-v2'
      then project_summary is not null and char_length(project_summary) <= 1600 and public.application_word_count(project_summary) between 1 and 80
      else project_summary is null or char_length(btrim(project_summary)) between 80 and 2400 end
  ),
  add constraint career_applications_biggest_failure_check check (
    case when application_questions_version = 'application-questions-v2'
      then biggest_failure is not null and char_length(biggest_failure) <= 1600 and public.application_word_count(biggest_failure) between 1 and 50
      else biggest_failure is null or char_length(btrim(biggest_failure)) between 80 and 1400 end
  ),
  add constraint career_applications_growth_area_check check (
    case when application_questions_version = 'application-questions-v2'
      then growth_area is not null and char_length(growth_area) <= 1600 and public.application_word_count(growth_area) between 1 and 40
      else growth_area is null or char_length(btrim(growth_area)) between 60 and 1000 end
  ),
  add constraint career_applications_personal_answers_check check (
    (application_questions_version is null and awards_status is null and competition_awards is null
      and awards_detail is null and biggest_failure is null and growth_area is null and authorship_confirmed_at is null and award_entries is null)
    or (application_questions_version is not null and application_questions_version = 'application-questions-v1'
      and award_entries is null and awards_status is not null and awards_detail is not null and biggest_failure is not null
      and growth_area is not null and project_summary is not null and authorship_confirmed_at is not null
      and ((awards_status = 'listed' and competition_awards is not null)
        or (awards_status = 'none_yet' and competition_awards is null)))
    or (application_questions_version is not null and application_questions_version = 'application-questions-v2'
      and awards_status is not null and award_entries is not null and public.application_awards_valid(award_entries)
      and competition_awards is null and awards_detail is null and authorship_confirmed_at is null
      and data_sharing_acknowledged_at is not null and data_sharing_statement_version is not null
      and data_sharing_statement_version = 'recruitment-data-sharing-v2'
      and ((awards_status = 'listed' and cardinality(award_entries) between 1 and 10)
        or (awards_status = 'none_yet' and cardinality(award_entries) = 0)))
  );

comment on column public.career_applications.award_entries is
  'application-questions-v2: ordered award cards, each at most 20 whitespace-separated words. Empty array means none yet. Retained/deleted with the application.';
comment on column public.career_applications.data_sharing_statement_version is
  'v1: I’m happy to share my data with GI Healthcare. v2: I agree to GI Healthcare using my information to assess my application and contact me, as described in the privacy notice. Prefix: recruitment-data-sharing-. Statements are versioned, not backfilled; processing bases are in the notice.';
notify pgrst, 'reload schema';
