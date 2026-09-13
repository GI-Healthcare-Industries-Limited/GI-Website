-- Run inside a transaction/savepoint and ROLLBACK afterwards. Never commit this fixture.
do $$
declare
  uk_today date := (clock_timestamp() at time zone 'Europe/London')::date;
  expected_error boolean := false;
  test_id uuid;
begin
  -- DST: summer closes an hour earlier in UTC; winter stays at midnight UTC.
  assert ((date '2026-09-30' + 1)::timestamp at time zone 'Europe/London') = timestamptz '2026-09-30 23:00:00+00';
  assert ((date '2026-10-25' + 1)::timestamp at time zone 'Europe/London') = timestamptz '2026-10-26 00:00:00+00';
  assert ((date '2026-03-29' + 1)::timestamp at time zone 'Europe/London') = timestamptz '2026-03-29 23:00:00+00';

  update public.career_openings set closing_date = uk_today - 1 where job_title = 'Embedded Systems Engineer';
  update public.career_openings set closing_date = null where job_title = 'Business Development and Operations Manager';
  assert (select not is_open from public.career_opening_availability where job_title = 'Embedded Systems Engineer');
  assert (select is_open from public.career_opening_availability where job_title = 'Business Development and Operations Manager');
  begin
    insert into public.career_applications (job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint)
    values ('Embedded Systems Engineer', 'Deadline QA', 'deadline-test@example.invalid', 'https://example.invalid/portfolio', repeat('Test-only project summary. ', 5), true, repeat('0', 64));
  exception when raise_exception then
    if sqlerrm = 'APPLICATION_CLOSED' then expected_error := true; else raise; end if;
  end;
  assert expected_error, 'Expired deadline must block inserts at the database';

  -- Applications are accepted on the closing date itself.
  update public.career_openings set closing_date = uk_today where job_title = 'Embedded Systems Engineer';
  assert (select is_open from public.career_opening_availability where job_title = 'Embedded Systems Engineer');
  insert into public.career_applications (job_title, name, email, portfolio_url, project_summary, right_to_work, request_fingerprint)
  values ('Embedded Systems Engineer', 'Deadline QA', 'deadline-test@example.invalid', 'https://example.invalid/portfolio', repeat('Test-only project summary. ', 5), true, repeat('0', 64)) returning id into test_id;
  assert test_id is not null;

  -- Clear and extend both reopen a previously closed role.
  update public.career_openings set closing_date = uk_today + 7 where job_title = 'Embedded Systems Engineer';
  assert (select is_open from public.career_opening_availability where job_title = 'Embedded Systems Engineer');
  update public.career_openings set closing_date = null where job_title = 'Embedded Systems Engineer';
  assert (select is_open and closes_at is null from public.career_opening_availability where job_title = 'Embedded Systems Engineer');

  assert not has_table_privilege('anon', 'public.career_openings', 'UPDATE');
  assert not has_table_privilege('authenticated', 'public.career_openings', 'UPDATE');
  assert not has_table_privilege('anon', 'public.career_opening_availability', 'SELECT');
end;
$$;
