-- Run this in Supabase SQL Editor

create table if not exists subscriptions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null unique,
  stripe_customer_id text,
  stripe_subscription_id text,
  plan text default 'free',
  status text default 'inactive',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table subscriptions enable row level security;

create policy "Users can view own subscription"
  on subscriptions for select
  using (auth.uid() = user_id);

-- Also add a function to get user tier efficiently
create or replace function get_user_tier(uid uuid)
returns text as $$
  select coalesce(
    (select plan from subscriptions where user_id = uid and status = 'active' limit 1),
    'free'
  );
$$ language sql security definer;
