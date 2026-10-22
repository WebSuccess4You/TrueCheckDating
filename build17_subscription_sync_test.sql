 \set ON_ERROR_STOP on
BEGIN;
create or replace function public.synchronize_membership_subscription(
  p_user_id uuid,
  p_product_id uuid,
  p_provider_customer_id text,
  p_provider_subscription_id text,
  p_status text,
  p_period_start timestamptz,
  p_period_end timestamptz,
  p_cancel_at_period_end boolean,
  p_event_created timestamptz,
  p_event_id text
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription public.subscriptions%rowtype;
  v_subscription_id uuid;
  v_product_type text;
  v_customer_owner uuid;
begin
  if p_user_id is null
    or p_product_id is null
    or nullif(trim(p_provider_customer_id), '') is null
    or nullif(trim(p_provider_subscription_id), '') is null
    or nullif(trim(p_status), '') is null
    or p_event_created is null
    or nullif(trim(p_event_id), '') is null
    or p_cancel_at_period_end is null
    or (p_period_start is not null and p_period_end is not null
        and p_period_end <= p_period_start) then
    raise exception 'Invalid subscription synchronization inputs';
  end if;

  -- Serialize concurrent updates for the same Stripe subscription.
  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(p_provider_subscription_id, 0)
  );

  -- Only the approved monthly membership product is valid.
  select product_type
    into v_product_type
    from public.products
   where id = p_product_id
     and code = 'monthly_membership';

  if not found or v_product_type <> 'membership' then
    raise exception 'Invalid membership subscription product';
  end if;

  -- Confirm the Stripe customer belongs to this user.
  select user_id
    into v_customer_owner
    from public.payment_customers
   where provider_customer_id = p_provider_customer_id
     and user_id = p_user_id
     and provider = 'stripe'
   for update;

  if not found or v_customer_owner <> p_user_id then
    raise exception 'Stripe customer ownership verification failed';
  end if;

  -- Lock any existing subscription before checking its ownership.
  select *
    into v_subscription
    from public.subscriptions
   where provider_subscription_id = p_provider_subscription_id
   for update;

  if found then
    if v_subscription.user_id <> p_user_id
      or v_subscription.provider_customer_id <> p_provider_customer_id
      or v_subscription.product_id <> p_product_id then
      raise exception 'Subscription ownership verification failed';
    end if;
  end if;

  -- Do not allow a previous billing period to replace a newer one.
  if v_subscription.id is not null
    and v_subscription.current_period_start is not null
    and p_period_start is not null
    and p_period_start < v_subscription.current_period_start then
    return v_subscription.id;
  end if;

  -- Ignore events older than the last accepted Stripe event.
  if v_subscription.id is not null
    and v_subscription.last_stripe_event_created is not null
    and p_event_created < v_subscription.last_stripe_event_created then
    return v_subscription.id;
  end if;

  -- Stripe events may share a creation timestamp.
  -- Do not treat event IDs as chronological sequence numbers.
  if v_subscription.id is not null
    and v_subscription.last_stripe_event_created = p_event_created
    and v_subscription.last_stripe_event_id is distinct from p_event_id then
    if v_subscription.status is not distinct from p_status
      and v_subscription.current_period_start is not distinct from p_period_start
      and v_subscription.current_period_end is not distinct from p_period_end
      and v_subscription.cancel_at_period_end is not distinct from p_cancel_at_period_end then
      return v_subscription.id;
    end if;
    raise exception
      'Ambiguous Stripe event ordering; subscription refresh required';
  end if;

  -- Insert or update the subscription while retaining its owner.
  insert into public.subscriptions (
    user_id,
    product_id,
    provider,
    provider_customer_id,
    provider_subscription_id,
    status,
    current_period_start,
    current_period_end,
    cancel_at_period_end,
    last_stripe_event_created,
    last_stripe_event_id,
    updated_at
  ) values (
    p_user_id,
    p_product_id,
    'stripe',
    p_provider_customer_id,
    p_provider_subscription_id,
    p_status,
    p_period_start,
    p_period_end,
    p_cancel_at_period_end,
    p_event_created,
    p_event_id,
    now()
  )
  on conflict (provider_subscription_id) do update set
    status = excluded.status,
    current_period_start = excluded.current_period_start,
    current_period_end = excluded.current_period_end,
    cancel_at_period_end = excluded.cancel_at_period_end,
    last_stripe_event_created = excluded.last_stripe_event_created,
    last_stripe_event_id = excluded.last_stripe_event_id,
    updated_at = now()
  returning id into v_subscription_id;

  -- Synchronize access without resetting legacy usage counters.
  insert into public.entitlements (
    user_id,
    case_id,
    entitlement_type,
    source_type,
    source_id,
    starts_at,
    ends_at,
    usage_limit,
    usage_count,
    status,
    metadata
  ) values (
    p_user_id,
    null,
    'membership',
    'subscription',
    v_subscription_id,
    coalesce(p_period_start, now()),
    p_period_end,
    20,
    0,
    case
      when p_status in ('active', 'trialing', 'past_due')
        then 'active'
      else 'inactive'
    end,
    pg_catalog.jsonb_build_object(
      'provider_subscription_id', p_provider_subscription_id
    )
  )
  on conflict (source_type, source_id, entitlement_type)
    where source_type = 'subscription'
  do update set
    starts_at = excluded.starts_at,
    ends_at = excluded.ends_at,
    status = excluded.status,
    metadata = excluded.metadata,
    updated_at = now();

  return v_subscription_id;
end;
$$;

DO $$
DECLARE s public.subscriptions%rowtype; v_id uuid;
BEGIN
SELECT * INTO STRICT s FROM public.subscriptions WHERE id = '24245c17-b432-4e3b-bc9b-663d727491f6';
UPDATE public.entitlements SET usage_count = 7 WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership';
IF NOT FOUND THEN RAISE EXCEPTION 'Missing entitlement fixture'; END IF;
IF s.last_stripe_event_created IS NULL THEN RAISE EXCEPTION 'Missing event timestamp'; END IF;
v_id := public.synchronize_membership_subscription(s.user_id, s.product_id, s.provider_customer_id, s.provider_subscription_id, s.status, s.current_period_start, s.current_period_end, NOT s.cancel_at_period_end, s.last_stripe_event_created + interval '1 day', 'evt_sync_test_baseline');
IF v_id IS DISTINCT FROM s.id THEN RAISE EXCEPTION 'Unexpected subscription ID'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.subscriptions WHERE id = s.id AND cancel_at_period_end = NOT s.cancel_at_period_end AND last_stripe_event_id = 'evt_sync_test_baseline') THEN RAISE EXCEPTION 'Subscription update failed'; END IF;
IF NOT EXISTS (SELECT 1 FROM public.entitlements WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership' AND usage_count = 7) THEN RAISE EXCEPTION 'Usage counter changed'; END IF;
DECLARE v_before jsonb; v_entitlement jsonb; v_rejected boolean := false; BEGIN
SELECT to_jsonb(t) INTO STRICT v_before FROM public.subscriptions t WHERE id = s.id;
SELECT to_jsonb(e) INTO STRICT v_entitlement FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership';
PERFORM public.synchronize_membership_subscription(s.user_id, s.product_id, s.provider_customer_id, s.provider_subscription_id, s.status, s.current_period_start, s.current_period_end, NOT s.cancel_at_period_end, s.last_stripe_event_created + interval '1 day', 'evt_sync_same_timestamp');
BEGIN
PERFORM public.synchronize_membership_subscription(s.user_id, s.product_id, s.provider_customer_id, s.provider_subscription_id, s.status, s.current_period_start, s.current_period_end, s.cancel_at_period_end, s.last_stripe_event_created + interval '1 day', 'evt_sync_conflicting_timestamp');
EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Ambiguous Stripe event ordering; subscription refresh required' THEN RAISE; END IF; v_rejected := true; END;
IF NOT v_rejected THEN RAISE EXCEPTION 'Conflicting event accepted'; END IF;
IF v_before IS DISTINCT FROM (SELECT to_jsonb(t) FROM public.subscriptions t WHERE id = s.id) THEN RAISE EXCEPTION 'Subscription state changed'; END IF;
IF v_entitlement IS DISTINCT FROM (SELECT to_jsonb(e) FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership') THEN RAISE EXCEPTION 'Entitlement changed'; END IF;
RAISE NOTICE 'PASS: equal-timestamp safeguards and state preservation'; END;
DECLARE v_before jsonb; v_entitlement jsonb; i integer; BEGIN
SELECT to_jsonb(t) INTO STRICT v_before FROM public.subscriptions t WHERE id = s.id;
SELECT to_jsonb(e) INTO STRICT v_entitlement FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership';
FOR i IN 1..2 LOOP
PERFORM public.synchronize_membership_subscription(s.user_id, s.product_id, s.provider_customer_id, s.provider_subscription_id, s.status, CASE WHEN i = 2 THEN s.current_period_start - interval '1 month' ELSE s.current_period_start END, CASE WHEN i = 2 THEN s.current_period_end - interval '1 month' ELSE s.current_period_end END, s.cancel_at_period_end, CASE WHEN i = 1 THEN s.last_stripe_event_created ELSE s.last_stripe_event_created + interval '2 days' END, 'evt_sync_stale_' || i::text);
IF v_before IS DISTINCT FROM (SELECT to_jsonb(t) FROM public.subscriptions t WHERE id = s.id) THEN RAISE EXCEPTION 'Stale case % changed subscription', i; END IF;
IF v_entitlement IS DISTINCT FROM (SELECT to_jsonb(e) FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership') THEN RAISE EXCEPTION 'Stale case % changed entitlement', i; END IF;
END LOOP;
RAISE NOTICE 'PASS: older event and older billing period leave state unchanged'; END;
DECLARE v_before jsonb; v_entitlement jsonb; v_rejected boolean := false; BEGIN
SELECT to_jsonb(t) INTO STRICT v_before FROM public.subscriptions t WHERE id = s.id;
SELECT to_jsonb(e) INTO STRICT v_entitlement FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership';
BEGIN
PERFORM public.synchronize_membership_subscription(s.user_id, s.product_id, 'cus_sync_test_unrecognized', s.provider_subscription_id, s.status, s.current_period_start, s.current_period_end, s.cancel_at_period_end, s.last_stripe_event_created + interval '2 days', 'evt_sync_wrong_customer');
EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Stripe customer ownership verification failed' THEN RAISE; END IF; v_rejected := true; END;
IF NOT v_rejected THEN RAISE EXCEPTION 'Unrecognized customer accepted'; END IF;
IF v_before IS DISTINCT FROM (SELECT to_jsonb(t) FROM public.subscriptions t WHERE id = s.id) THEN RAISE EXCEPTION 'Ownership failure changed subscription'; END IF;
IF v_entitlement IS DISTINCT FROM (SELECT to_jsonb(e) FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership') THEN RAISE EXCEPTION 'Ownership failure changed entitlement'; END IF;
RAISE NOTICE 'PASS: unrecognized customer rejected without changing state'; END;
DECLARE v_other uuid := '00000000-0000-4000-8000-000000017201'; v_before jsonb; v_entitlement jsonb; v_rejected boolean := false; BEGIN
INSERT INTO auth.users (id) VALUES (v_other);
INSERT INTO public.payment_customers (user_id, provider, provider_customer_id) VALUES (v_other, 'stripe', 'cus_sync_other_owner_test');
SELECT to_jsonb(t) INTO STRICT v_before FROM public.subscriptions t WHERE id = s.id;
SELECT to_jsonb(e) INTO STRICT v_entitlement FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership';
BEGIN
PERFORM public.synchronize_membership_subscription(v_other, s.product_id, 'cus_sync_other_owner_test', s.provider_subscription_id, s.status, s.current_period_start, s.current_period_end, s.cancel_at_period_end, s.last_stripe_event_created + interval '2 days', 'evt_sync_reassignment');
EXCEPTION WHEN raise_exception THEN IF SQLERRM <> 'Subscription ownership verification failed' THEN RAISE; END IF; v_rejected := true; END;
IF NOT v_rejected THEN RAISE EXCEPTION 'Subscription reassignment accepted'; END IF;
IF v_before IS DISTINCT FROM (SELECT to_jsonb(t) FROM public.subscriptions t WHERE id = s.id) THEN RAISE EXCEPTION 'Reassignment changed subscription'; END IF;
IF v_entitlement IS DISTINCT FROM (SELECT to_jsonb(e) FROM public.entitlements e WHERE source_id = s.id AND source_type = 'subscription' AND entitlement_type = 'membership') THEN RAISE EXCEPTION 'Reassignment changed entitlement'; END IF;
IF EXISTS (SELECT 1 FROM public.entitlements WHERE user_id = v_other AND source_type = 'subscription' AND source_id = s.id) THEN RAISE EXCEPTION 'Reassignment granted access to other user'; END IF;
RAISE NOTICE 'PASS: valid different customer cannot take over subscription'; END;
RAISE NOTICE 'PASS: subscription synchronization preserves usage';
END;
$$;
ROLLBACK;
