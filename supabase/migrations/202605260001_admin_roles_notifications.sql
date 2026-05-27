alter table public.user_profiles
  add column if not exists role text not null default 'user',
  add column if not exists is_blocked boolean not null default false,
  add column if not exists blocked_at timestamp with time zone,
  add column if not exists admin_notes text,
  add column if not exists notification_opt_in boolean not null default true;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'user_profiles_role_check'
  ) then
    alter table public.user_profiles
      add constraint user_profiles_role_check check (role in ('user', 'admin'));
  end if;
end $$;

create index if not exists user_profiles_role_idx on public.user_profiles(role);
create index if not exists user_profiles_created_at_idx on public.user_profiles(created_at);
create index if not exists user_profiles_streak_idx on public.user_profiles(current_streak, longest_streak);

create table if not exists public.admin_email_logs (
  id bigint generated always as identity primary key,
  recipient_user_id uuid references auth.users(id) on delete set null,
  recipient_email text not null,
  subject text not null,
  email_type text not null default 'custom',
  sent_by uuid references auth.users(id) on delete set null,
  status text not null default 'sent',
  provider_id text,
  error text,
  created_at timestamp with time zone not null default now()
);

create index if not exists admin_email_logs_recipient_user_id_idx
  on public.admin_email_logs(recipient_user_id);
create index if not exists admin_email_logs_created_at_idx
  on public.admin_email_logs(created_at desc);

create table if not exists public.notifications (
  id bigint generated always as identity primary key,
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  href text,
  audience jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamp with time zone not null default now(),
  read_at timestamp with time zone
);

create index if not exists notifications_user_id_created_at_idx
  on public.notifications(user_id, created_at desc);
create index if not exists notifications_status_idx
  on public.notifications(status);

create table if not exists public.admin_audit_logs (
  id bigint generated always as identity primary key,
  actor_id uuid references auth.users(id) on delete set null,
  target_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  details jsonb not null default '{}'::jsonb,
  created_at timestamp with time zone not null default now()
);

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.user_profiles
    where id = auth.uid()
      and role = 'admin'
      and is_blocked = false
  );
$$;

grant execute on function public.is_admin() to authenticated;

alter table public.admin_email_logs enable row level security;
alter table public.notifications enable row level security;
alter table public.admin_audit_logs enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Users can read own profile'
  ) then
    create policy "Users can read own profile"
      on public.user_profiles
      for select
      to authenticated
      using (id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Public can read profiles'
  ) then
    create policy "Public can read profiles"
      on public.user_profiles
      for select
      to anon, authenticated
      using (true);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Admins can read all profiles'
  ) then
    create policy "Admins can read all profiles"
      on public.user_profiles
      for select
      to authenticated
      using (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'user_profiles'
      and policyname = 'Admins can update all profiles'
  ) then
    create policy "Admins can update all profiles"
      on public.user_profiles
      for update
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_email_logs'
      and policyname = 'Admins can manage email logs'
  ) then
    create policy "Admins can manage email logs"
      on public.admin_email_logs
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Admins can manage notifications'
  ) then
    create policy "Admins can manage notifications"
      on public.notifications
      for all
      to authenticated
      using (public.is_admin())
      with check (public.is_admin());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Users can read own notifications'
  ) then
    create policy "Users can read own notifications"
      on public.notifications
      for select
      to authenticated
      using (user_id = auth.uid() or user_id is null);
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Users can mark own notifications read'
  ) then
    create policy "Users can mark own notifications read"
      on public.notifications
      for update
      to authenticated
      using (user_id = auth.uid())
      with check (user_id = auth.uid());
  end if;

  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'admin_audit_logs'
      and policyname = 'Admins can read audit logs'
  ) then
    create policy "Admins can read audit logs"
      on public.admin_audit_logs
      for select
      to authenticated
      using (public.is_admin());
  end if;
end $$;

create or replace view public.leaderboard_profiles as
select
  id,
  username,
  current_streak,
  longest_streak,
  numbers_easy_hs,
  numbers_medium_hs,
  numbers_hard_hs,
  numbers_guessing_hs,
  colors_hs_0,
  colors_hs_1,
  colors_hs_2,
  colors_hs_3,
  words_hs_0,
  words_hs_1,
  words_hs_2,
  people_hs_0,
  people_hs_1,
  people_hs_2,
  highscore_0,
  highscore_1,
  highscore_2,
  highscore_3,
  highscore_4,
  highscore_5,
  lbs_highscore,
  party_mode_score
from public.user_profiles
where is_blocked = false;

grant select on public.leaderboard_profiles to anon, authenticated;

create or replace function public.lookup_leaderboard_profile_by_email(email_to_find text)
returns table (
  id uuid,
  username text,
  current_streak integer,
  longest_streak integer,
  numbers_easy_hs integer,
  numbers_medium_hs integer,
  numbers_hard_hs integer,
  numbers_guessing_hs integer,
  colors_hs_0 integer,
  colors_hs_1 integer,
  colors_hs_2 integer,
  colors_hs_3 integer,
  words_hs_0 integer,
  words_hs_1 integer,
  words_hs_2 integer,
  people_hs_0 integer,
  people_hs_1 integer,
  people_hs_2 integer,
  highscore_0 integer,
  highscore_1 integer,
  highscore_2 integer,
  highscore_3 integer,
  highscore_4 integer,
  highscore_5 integer,
  lbs_highscore integer,
  party_mode_score integer
)
language sql
security definer
set search_path = public, auth
as $$
  select
    p.id,
    p.username,
    p.current_streak,
    p.longest_streak,
    p.numbers_easy_hs,
    p.numbers_medium_hs,
    p.numbers_hard_hs,
    p.numbers_guessing_hs,
    p.colors_hs_0,
    p.colors_hs_1,
    p.colors_hs_2,
    p.colors_hs_3,
    p.words_hs_0,
    p.words_hs_1,
    p.words_hs_2,
    p.people_hs_0,
    p.people_hs_1,
    p.people_hs_2,
    p.highscore_0,
    p.highscore_1,
    p.highscore_2,
    p.highscore_3,
    p.highscore_4,
    p.highscore_5,
    p.lbs_highscore,
    p.party_mode_score
  from public.user_profiles p
  join auth.users u on u.id = p.id
  where lower(u.email) = lower(trim(email_to_find))
    and coalesce(p.is_blocked, false) = false
  limit 1;
$$;

revoke all on function public.lookup_leaderboard_profile_by_email(text) from public;
grant execute on function public.lookup_leaderboard_profile_by_email(text) to authenticated;

-- Challenge editor policies. These are intentionally admin-only.
alter table public.daily_challenges enable row level security;
alter table public.questions enable row level security;
alter table public.answers enable row level security;
alter table public.levels enable row level security;
alter table public.variations enable row level security;
alter table public.evidence_scenes enable row level security;
alter table public.questions_cm enable row level security;
alter table public.answers_cm enable row level security;

do $$
declare
  content_table text;
begin
  foreach content_table in array array[
    'daily_challenges',
    'questions',
    'answers',
    'levels',
    'variations',
    'evidence_scenes',
    'questions_cm',
    'answers_cm'
  ] loop
    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = content_table
        and policyname = 'Public can read content'
    ) then
      execute format(
        'create policy "Public can read content" on public.%I for select to anon, authenticated using (true)',
        content_table
      );
    end if;

    if not exists (
      select 1 from pg_policies
      where schemaname = 'public'
        and tablename = content_table
        and policyname = 'Admins can manage content'
    ) then
      execute format(
        'create policy "Admins can manage content" on public.%I for all to authenticated using (public.is_admin()) with check (public.is_admin())',
        content_table
      );
    end if;
  end loop;
end $$;

-- Run this once after the migration to promote yourself:
-- update public.user_profiles
-- set role = 'admin'
-- where id = (select id from auth.users where email = 'your-email@example.com');
