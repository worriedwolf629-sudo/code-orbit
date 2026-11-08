-- ==============================================================================
-- CodeOrbit Database Schema & Row Level Security (RLS)
-- Run this script in your Supabase SQL Editor (https://supabase.com/dashboard)
-- ==============================================================================

-- 1. Enable UUID Extension (standard in Supabase)
create extension if not exists "uuid-ossp";

-- 2. Subjects Table
create table if not exists public.subjects (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
    name text not null,
    description text default '',
    color text default '#2dd4bf',
    icon text default 'Boxes',
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    deleted_at timestamptz default null
);

-- 3. Snippets Table
create table if not exists public.snippets (
    id text primary key,
    user_id uuid references auth.users(id) on delete cascade default auth.uid() not null,
    subject_id text not null references public.subjects(id) on delete cascade,
    serial_number integer default 1 not null,
    title text not null,
    language text default 'java' not null,
    tags text[] default '{}',
    notes text default '',
    code text not null default '',
    is_starred boolean default false,
    time_complexity text default '',
    space_complexity text default '',
    common_mistake text default '',
    last_reviewed timestamptz default null,
    recall_score text default null,
    review_count integer default 0,
    missed_count integer default 0,
    created_at timestamptz default now() not null,
    updated_at timestamptz default now() not null,
    deleted_at timestamptz default null
);

-- 4. Fast Query Indexes
create index if not exists idx_subjects_user_updated on public.subjects (user_id, updated_at);
create index if not exists idx_subjects_user_deleted on public.subjects (user_id, deleted_at);

create index if not exists idx_snippets_user_updated on public.snippets (user_id, updated_at);
create index if not exists idx_snippets_user_subject on public.snippets (user_id, subject_id, deleted_at);

-- 5. Automatic updated_at Trigger Function
create or replace function public.handle_updated_at()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

drop trigger if exists set_subjects_updated_at on public.subjects;
create trigger set_subjects_updated_at
    before update on public.subjects
    for each row
    execute function public.handle_updated_at();

drop trigger if exists set_snippets_updated_at on public.snippets;
create trigger set_snippets_updated_at
    before update on public.snippets
    for each row
    execute function public.handle_updated_at();

-- 6. Enable Row Level Security (RLS)
alter table public.subjects enable row level security;
alter table public.snippets enable row level security;

-- 7. RLS Policies: Subjects (Strict isolation to authenticated owner)
drop policy if exists "Users can select own subjects" on public.subjects;
create policy "Users can select own subjects"
    on public.subjects for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own subjects" on public.subjects;
create policy "Users can insert own subjects"
    on public.subjects for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own subjects" on public.subjects;
create policy "Users can update own subjects"
    on public.subjects for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own subjects" on public.subjects;
create policy "Users can delete own subjects"
    on public.subjects for delete
    using (auth.uid() = user_id);

-- 8. RLS Policies: Snippets (Strict isolation to authenticated owner)
drop policy if exists "Users can select own snippets" on public.snippets;
create policy "Users can select own snippets"
    on public.snippets for select
    using (auth.uid() = user_id);

drop policy if exists "Users can insert own snippets" on public.snippets;
create policy "Users can insert own snippets"
    on public.snippets for insert
    with check (auth.uid() = user_id);

drop policy if exists "Users can update own snippets" on public.snippets;
create policy "Users can update own snippets"
    on public.snippets for update
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop policy if exists "Users can delete own snippets" on public.snippets;
create policy "Users can delete own snippets"
    on public.snippets for delete
    using (auth.uid() = user_id);

-- 9. Enable Realtime Replication for instant phone/laptop sync
alter publication supabase_realtime add table public.subjects;
alter publication supabase_realtime add table public.snippets;

