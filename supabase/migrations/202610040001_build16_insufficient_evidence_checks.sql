-- Build 16: completed questionnaires can have insufficient evidence.
-- Apply to TrueCheckDating-Staging only during staging verification.
-- Preserve required summaries, completion timestamps, and video safety acknowledgment.
begin;

alter table public.profile_checks
  drop constraint profile_checks_completed_fields_check;
alter table public.profile_checks
  add constraint profile_checks_completed_fields_check check (
    status <> 'completed'
    or (
      (component_score is not null or evidence_completeness = 0)
      and summary is not null
      and completed_at is not null
    )
  );

alter table public.video_checks
  drop constraint video_checks_completed_fields_check;
alter table public.video_checks
  add constraint video_checks_completed_fields_check check (
    status <> 'completed'
    or (
      (component_score is not null or evidence_completeness = 0)
      and summary is not null
      and safety_acknowledged_at is not null
      and completed_at is not null
    )
  );

commit;
