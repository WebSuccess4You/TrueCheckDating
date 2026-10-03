-- Apply after the Build 15 atomic report migration.
-- Claim one signed Stripe event at a time, with a recovery window for crashes.
alter table public.stripe_webhook_events
  add column if not exists claim_token uuid;

create or replace function public.reserve_stripe_webhook_event(
  p_event_id text,
  p_event_type text,
  p_claim_token uuid
)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_record public.stripe_webhook_events%rowtype;
begin
  if p_event_id is null or p_event_id = '' or p_event_type is null
    or p_event_type = '' or p_claim_token is null then
    raise exception 'Invalid webhook reservation';
  end if;

  insert into public.stripe_webhook_events (
    provider_event_id, event_type, processing_status, claim_token
  ) values (
    p_event_id, p_event_type, 'processing', p_claim_token
  ) on conflict (provider_event_id) do nothing;
  if found then
    return 'new';
  end if;

  select * into v_record from public.stripe_webhook_events
  where provider_event_id = p_event_id for update;
  if v_record.processing_status = 'completed' then
    return 'completed';
  end if;
  if v_record.processing_status = 'processing'
    and v_record.received_at > pg_catalog.now() - interval '10 minutes' then
    return 'processing';
  end if;

  update public.stripe_webhook_events
  set event_type = p_event_type,
      processing_status = 'processing',
      claim_token = p_claim_token,
      received_at = pg_catalog.now(),
      processed_at = null,
      error_message = null
  where provider_event_id = p_event_id;
  return 'new';
end;
$$;

revoke all on function public.reserve_stripe_webhook_event(text, text, uuid)
  from public, anon, authenticated;
grant execute on function public.reserve_stripe_webhook_event(text, text, uuid)
  to service_role;
