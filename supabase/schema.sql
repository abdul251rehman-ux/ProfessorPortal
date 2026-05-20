-- ============================================================
--  Professor Portal — Supabase Schema
--  Run this entire file in the Supabase SQL Editor
-- ============================================================

-- 1. PROFILES
create table public.profiles (
  id              uuid references auth.users(id) on delete cascade primary key,
  name            text,
  university_name text,
  university_logo_url text,
  created_at      timestamptz default now() not null
);

alter table public.profiles enable row level security;

create policy "professors can view own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "professors can update own profile"
  on public.profiles for update
  using (auth.uid() = id);

create policy "professors can insert own profile"
  on public.profiles for insert
  with check (auth.uid() = id);

-- 2. CLASSES
create table public.classes (
  id            uuid default gen_random_uuid() primary key,
  professor_id  uuid references public.profiles(id) on delete cascade not null,
  name          text not null,
  section       text,
  semester      text,
  year          text,
  created_at    timestamptz default now() not null
);

alter table public.classes enable row level security;

create policy "professors manage own classes"
  on public.classes for all
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- 3. SUBJECTS
create table public.subjects (
  id            uuid default gen_random_uuid() primary key,
  professor_id  uuid references public.profiles(id) on delete cascade not null,
  class_id      uuid references public.classes(id) on delete cascade not null,
  name          text not null,
  code          text,
  created_at    timestamptz default now() not null
);

alter table public.subjects enable row level security;

create policy "professors manage own subjects"
  on public.subjects for all
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- 4. STUDENTS
create table public.students (
  id            uuid default gen_random_uuid() primary key,
  professor_id  uuid references public.profiles(id) on delete cascade not null,
  class_id      uuid references public.classes(id) on delete cascade not null,
  roll_number   text not null,
  name          text not null,
  created_at    timestamptz default now() not null
);

alter table public.students enable row level security;

create policy "professors manage own students"
  on public.students for all
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- 5. LECTURES
create table public.lectures (
  id            uuid default gen_random_uuid() primary key,
  professor_id  uuid references public.profiles(id) on delete cascade not null,
  subject_id    uuid references public.subjects(id) on delete cascade not null,
  date          date not null default current_date,
  topic         text,
  created_at    timestamptz default now() not null
);

alter table public.lectures enable row level security;

create policy "professors manage own lectures"
  on public.lectures for all
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- 6. ATTENDANCE
create table public.attendance (
  id          uuid default gen_random_uuid() primary key,
  lecture_id  uuid references public.lectures(id) on delete cascade not null,
  student_id  uuid references public.students(id) on delete cascade not null,
  present     boolean default false not null,
  unique(lecture_id, student_id)
);

alter table public.attendance enable row level security;

create policy "professors manage attendance"
  on public.attendance for all
  using (
    exists (
      select 1 from public.lectures l
      where l.id = attendance.lecture_id
        and l.professor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.lectures l
      where l.id = attendance.lecture_id
        and l.professor_id = auth.uid()
    )
  );

-- 7. MARK COMPONENTS
create table public.mark_components (
  id            uuid default gen_random_uuid() primary key,
  professor_id  uuid references public.profiles(id) on delete cascade not null,
  subject_id    uuid references public.subjects(id) on delete cascade not null,
  name          text not null,
  max_marks     numeric not null default 100,
  created_at    timestamptz default now() not null
);

alter table public.mark_components enable row level security;

create policy "professors manage own mark components"
  on public.mark_components for all
  using (professor_id = auth.uid())
  with check (professor_id = auth.uid());

-- 8. STUDENT MARKS
create table public.student_marks (
  id              uuid default gen_random_uuid() primary key,
  component_id    uuid references public.mark_components(id) on delete cascade not null,
  student_id      uuid references public.students(id) on delete cascade not null,
  marks_obtained  numeric,
  unique(component_id, student_id)
);

alter table public.student_marks enable row level security;

create policy "professors manage student marks"
  on public.student_marks for all
  using (
    exists (
      select 1 from public.mark_components mc
      where mc.id = student_marks.component_id
        and mc.professor_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.mark_components mc
      where mc.id = student_marks.component_id
        and mc.professor_id = auth.uid()
    )
  );

-- ============================================================
--  Trigger: auto-create profile row when a new user signs in
--  (handles manual accounts created via Supabase dashboard)
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    split_part(new.email, '@', 1)
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
