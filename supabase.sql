-- Run this once in your Supabase project's SQL Editor.
-- Row Level Security stays on (the default) — these tables are only ever
-- accessed by the app's serverless functions using the service_role key,
-- which bypasses RLS. No anon/client access is used or needed.

create table if not exists quiz_progress (
  id bigserial primary key,
  identity text not null,
  category text not null,
  correct int not null,
  attempted int not null,
  total int not null,
  status text not null,
  updated_at timestamptz not null default now(),
  unique (identity, category)
);

create table if not exists quiz_sessions (
  identity text primary key,
  session_json jsonb not null,
  updated_at timestamptz not null default now()
);

alter table quiz_progress enable row level security;
alter table quiz_sessions enable row level security;
