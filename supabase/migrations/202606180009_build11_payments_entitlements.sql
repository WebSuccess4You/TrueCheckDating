-- TrueCheck.ai Build 11
-- Stripe payments, subscriptions, entitlements, usage tracking, and webhook idempotency.
-- Apply after all migrations through Build 10.

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code in ('one_time_report', 'monthly_membership')),
  name text not null,
  product_type text not null check (product_type in ('one_time_report', 'membership')),
  price_minor_units integer not null check (price_minor_units > 0),
  currency text not null default 'usd' check (char_length(currency) = 3),
  active boolean not null default true,
  entitlement_rules jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

insert into public.products (code, name, product_type, price_minor_units, currency, entitlement_rules)
values
  ('one_time_report', 'TrueCheck.ai Full Individual Report', 'one_time_report', 999, 'usd',
   '{"case_scoped": true, "reanalysis_limit": 3, "reanalysis_window_days": 30}'::jsonb),
  ('monthly_membership', 'TrueCheck.ai Monthly Membership', 'membership', 1499, 'usd',
   '{"active_case_limit": 5, "analysis_limit_per_period": 20}'::jsonb)
on conflict (code) do update set
  name = excluded.name,
  product_type = excluded.product_type,
  price_minor_units = excluded.price_minor_units,
  currency = excluded.currency,
  entitlement_rules = excluded.entitlement_rules,
  updated_at = now();

create table if not exists public.payment_customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_customer_id text not null unique,
  created_at timestamptz not null default now(),
  unique (user_id, provider)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  product_id uuid not null references public.products(id),
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_checkout_session_id text unique,
  provider_payment_id text unique,
  status text not null check (status in ('pending', 'paid', 'failed', 'refunded', 'canceled')),
  amount_minor_units integer not null check (amount_minor_units >= 0),
  currency text not null check (char_length(currency) = 3),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists payments_user_created_idx
  on public.payments(user_id, created_at desc);
create index if not exists payments_case_created_idx
  on public.payments(case_id, created_at desc);

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id),
  provider text not null default 'stripe' check (provider = 'stripe'),
  provider_customer_id text not null,
  provider_subscription_id text not null unique,
  status text not null,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists subscriptions_user_updated_idx
  on public.subscriptions(user_id, updated_at desc);

create table if not exists public.entitlements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete cascade,
  entitlement_type text not null check (entitlement_type in ('case_full_report', 'membership')),
  source_type text not null check (source_type in ('payment', 'subscription', 'manual')),
  source_id uuid,
  starts_at timestamptz not null default now(),
  ends_at timestamptz,
  usage_limit integer check (usage_limit is null or usage_limit >= 0),
  usage_count integer not null default 0 check (usage_count >= 0),
  status text not null check (status in ('active', 'inactive', 'expired', 'revoked')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint entitlements_case_scope_check check (
    (entitlement_type = 'case_full_report' and case_id is not null)
    or (entitlement_type = 'membership' and case_id is null)
  )
);

create unique index if not exists entitlements_case_payment_unique_idx
  on public.entitlements(source_type, source_id, entitlement_type, case_id)
  where source_type = 'payment';
create unique index if not exists entitlements_subscription_unique_idx
  on public.entitlements(source_type, source_id, entitlement_type)
  where source_type = 'subscription';
create index if not exists entitlements_user_status_idx
  on public.entitlements(user_id, status, ends_at);
create index if not exists entitlements_case_status_idx
  on public.entitlements(case_id, status, ends_at);

create table if not exists public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  case_id uuid references public.cases(id) on delete set null,
  event_type text not null,
  quantity integer not null default 1 check (quantity > 0),
  entitlement_id uuid references public.entitlements(id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists usage_events_user_created_idx
  on public.usage_events(user_id, created_at desc);

create table if not exists public.stripe_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider_event_id text not null unique,
  event_type text not null,
  processing_status text not null check (processing_status in ('processing', 'completed', 'failed')),
  error_message text,
  received_at timestamptz not null default now(),
  processed_at timestamptz
);

alter table public.products enable row level security;
alter table public.payment_customers enable row level security;
alter table public.payments enable row level security;
alter table public.subscriptions enable row level security;
alter table public.entitlements enable row level security;
alter table public.usage_events enable row level security;
alter table public.stripe_webhook_events enable row level security;

revoke all on table public.products from anon, authenticated;
revoke all on table public.payment_customers from anon, authenticated;
revoke all on table public.payments from anon, authenticated;
revoke all on table public.subscriptions from anon, authenticated;
revoke all on table public.entitlements from anon, authenticated;
revoke all on table public.usage_events from anon, authenticated;
revoke all on table public.stripe_webhook_events from anon, authenticated;

grant select on table public.products to authenticated;
grant select on table public.payment_customers to authenticated;
grant select on table public.payments to authenticated;
grant select on table public.subscriptions to authenticated;
grant select on table public.entitlements to authenticated;
grant select on table public.usage_events to authenticated;

create policy "Authenticated users can read active products"
  on public.products for select to authenticated
  using (active = true);

create policy "Users can read their own Stripe customer record"
  on public.payment_customers for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own payments"
  on public.payments for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own subscriptions"
  on public.subscriptions for select to authenticated
  using ((select auth.uid()) = user_id);

create policy "Users can read their own entitlements"
  on public.entitlements for select to authenticated
  using (
    (select auth.uid()) = user_id
    and (
      case_id is null
      or exists (
        select 1 from public.cases
        where cases.id = entitlements.case_id
          and cases.auth_user_id = (select auth.uid())
      )
    )
  );

create policy "Users can read their own usage events"
  on public.usage_events for select to authenticated
  using ((select auth.uid()) = user_id);

comment on table public.stripe_webhook_events is
  'Server-only Stripe webhook receipt ledger used to make event processing idempotent.';
comment on table public.entitlements is
  'Server-written access grants. Browser return URLs never create or activate an entitlement.';
