-- TrueCheckDating.com Build 17
-- Membership usage limits and billing-period accounting.
--
-- Individual Full Report ($9.99):
-- 1 initial report plus 3 updates within 30 days.
-- Maximum 4 report generations.
--
-- Monthly Membership ($14.99):
-- 20 Full Report generations per billing period.
-- 20 successful AI Chat Analyses per billing period.
-- Maximum 5 active cases.
--
-- Requirements:
-- Keep report and analysis allowances independent.
-- Preserve the existing hourly AI request limit.
-- Enforce usage limits atomically.
-- Release reservations for failed or rejected analyses.
-- Protect against simultaneous requests.
-- Handle abandoned reservations and Stripe webhook retries.
-- Renew allowances only for a new billing period.
-- Never call OpenAI merely to generate a Full Report.
--
-- Apply after Build 16 migrations.
-- Do not deploy until Build 17 testing is complete.
-- Build 17: independent membership allowances by billing period.
create table if not exists public.membership_usage_periods (
  id uuid primary key default gen_random_uuid(),

  subscription_id uuid not null
    references public.subscriptions(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  period_start timestamptz not null,
  period_end timestamptz not null,

  report_limit integer not null default 20
    check (report_limit >= 0),

  report_count integer not null default 0
    check (report_count >= 0),

  analysis_limit integer not null default 20
    check (analysis_limit >= 0),

  analysis_count integer not null default 0
    check (analysis_count >= 0),

  analysis_reserved integer not null default 0
    check (analysis_reserved >= 0),

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint membership_usage_period_dates_check
    check (period_end > period_start),

  constraint membership_usage_report_limit_check
    check (report_count <= report_limit),

  constraint membership_usage_analysis_limit_check
    check (analysis_count + analysis_reserved <= analysis_limit),

  constraint membership_usage_period_unique
    unique (subscription_id, period_start)
);

create index if not exists membership_usage_periods_user_idx
  on public.membership_usage_periods(user_id, period_end desc);

alter table public.membership_usage_periods
  enable row level security;

revoke all on table public.membership_usage_periods
  from anon, authenticated;

grant select on table public.membership_usage_periods
  to authenticated;

create policy membership_usage_periods_owner_select
  on public.membership_usage_periods
  for select
  to authenticated
  using (user_id = (select auth.uid()));
  -- Permit trusted server-side operations on membership usage records.
grant select, insert, update, delete
  on public.membership_usage_periods
  to service_role;
  -- Enforce subscription ownership for membership usage records.
alter table public.subscriptions
  add constraint subscriptions_id_user_unique
  unique (id, user_id);

alter table public.membership_usage_periods
  add constraint membership_usage_subscription_owner_fk
  foreign key (subscription_id, user_id)
  references public.subscriptions(id, user_id)
  on delete cascade;

-- Initialize membership usage without resetting existing counters.
create or replace function public.initialize_membership_usage_period(
  p_subscription_id uuid,
  p_user_id uuid,
  p_period_start timestamptz,
  p_period_end timestamptz
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_subscription public.subscriptions%rowtype;
  v_usage_id uuid;
begin
  if p_subscription_id is null
    or p_user_id is null
    or p_period_start is null
    or p_period_end is null
    or p_period_end <= p_period_start then
    raise exception 'Invalid membership billing period';
  end if;

  select *
    into v_subscription
    from public.subscriptions
   where id = p_subscription_id
   for update;

  if not found or v_subscription.user_id <> p_user_id then
    raise exception 'Subscription ownership verification failed';
  end if;

  if v_subscription.current_period_start is not null
    and p_period_start < v_subscription.current_period_start then
    raise exception 'Stale membership billing period';
  end if;

  if v_subscription.current_period_start is distinct from p_period_start
    or v_subscription.current_period_end is distinct from p_period_end then
    raise exception 'Billing period does not match subscription';
  end if;

  insert into public.membership_usage_periods (
    subscription_id,
    user_id,
    period_start,
    period_end,
    report_limit,
    analysis_limit
  ) values (
    p_subscription_id,
    p_user_id,
    p_period_start,
    p_period_end,
    20,
    20
  )
  on conflict (subscription_id, period_start) do nothing;

  select id
    into v_usage_id
    from public.membership_usage_periods
   where subscription_id = p_subscription_id
     and period_start = p_period_start
     and period_end = p_period_end;

  if v_usage_id is null then
    raise exception 'Membership billing period conflicts with existing record';
  end if;

  return v_usage_id;
end;
$$;

revoke all on function public.initialize_membership_usage_period(
  uuid, uuid, timestamptz, timestamptz
) from public, anon, authenticated;

grant execute on function public.initialize_membership_usage_period(
  uuid, uuid, timestamptz, timestamptz
) to service_role;


-- Build 17: Track individual monthly AI analysis reservations.
create table if not exists public.membership_analysis_reservations (
  id uuid primary key default gen_random_uuid(),

  analysis_id uuid not null
    references public.chat_analyses(id) on delete cascade,

  membership_usage_period_id uuid not null
    references public.membership_usage_periods(id) on delete cascade,

  user_id uuid not null
    references auth.users(id) on delete cascade,

  status text not null default 'reserved'
    check (status in ('reserved', 'consumed', 'released')),

  created_at timestamptz not null default now(),
  finalized_at timestamptz,

  constraint membership_analysis_reservations_analysis_unique
    unique (analysis_id),

  constraint membership_analysis_reservations_finalized_check
    check (
      (status = 'reserved' and finalized_at is null)
      or
      (status in ('consumed', 'released') and finalized_at is not null)
    )
);

create index if not exists membership_analysis_reservations_period_idx
  on public.membership_analysis_reservations(
    membership_usage_period_id, status
  );

create index if not exists membership_analysis_reservations_user_idx
  on public.membership_analysis_reservations(user_id, created_at desc);

alter table public.membership_analysis_reservations
  enable row level security;

revoke all on table public.membership_analysis_reservations
  from anon, authenticated;

grant select on table public.membership_analysis_reservations
  to authenticated;

create policy membership_analysis_reservations_owner_select
  on public.membership_analysis_reservations
  for select
  to authenticated
  using (user_id = (select auth.uid()));

grant select, insert, update, delete
  on public.membership_analysis_reservations
  to service_role;

-- Build 17: Enforce consistent ownership across analysis reservations.
alter table public.chat_analyses
  add constraint chat_analyses_id_owner_unique
  unique (id, auth_user_id);

alter table public.membership_usage_periods
  add constraint membership_usage_periods_id_owner_unique
  unique (id, user_id);

alter table public.membership_analysis_reservations
  add constraint membership_reservation_analysis_owner_fk
  foreign key (analysis_id, user_id)
  references public.chat_analyses(id, auth_user_id)
  on delete cascade;

alter table public.membership_analysis_reservations
  add constraint membership_reservation_period_owner_fk
  foreign key (membership_usage_period_id, user_id)
  references public.membership_usage_periods(id, user_id)
  on delete cascade;

-- Build 17: Track Stripe subscription synchronization events.
alter table public.subscriptions
  add column if not exists last_stripe_event_created timestamptz;

alter table public.subscriptions
  add column if not exists last_stripe_event_id text;


-- Build 17: Synchronize Stripe subscription and membership entitlement atomically.
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

revoke all on function public.synchronize_membership_subscription(
  uuid, uuid, text, text, text, timestamptz,
  timestamptz, boolean, timestamptz, text
) from public, anon, authenticated;

grant execute on function public.synchronize_membership_subscription(
  uuid, uuid, text, text, text, timestamptz,
  timestamptz, boolean, timestamptz, text
) to service_role;
