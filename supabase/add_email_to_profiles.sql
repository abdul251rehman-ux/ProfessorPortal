-- ============================================================
--  Step 1: Add email column to profiles
-- ============================================================
alter table public.profiles add column if not exists email text;

-- ============================================================
--  Step 2: Update trigger so email is copied automatically
--          when a new auth user is created
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, name, email)
  values (
    new.id,
    split_part(new.email, '@', 1),
    new.email
  )
  on conflict (id) do update
    set email = new.email;
  return new;
end;
$$;

-- ============================================================
--  Step 3: Backfill email for any existing professors
-- ============================================================
update public.profiles p
set email = u.email
from auth.users u
where p.id = u.id
  and p.email is null;


-- ============================================================
--  HOW TO ADD A PROFESSOR (copy-paste this block, edit values)
-- ============================================================
do $$
declare
  v_uid uuid := gen_random_uuid();
begin

  -- 1. Create the login account
  insert into auth.users (
    instance_id, id, aud, role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at, updated_at
  ) values (
    '00000000-0000-0000-0000-000000000000',
    v_uid,
    'authenticated',
    'authenticated',
    'rehman@portal.com',                       -- << email
    crypt('rehman123', gen_salt('bf')),         -- << password
    now(),
    '{"provider":"email","providers":["email"]}',
    '{}',
    now(), now()
  );

  -- 2. Required so Supabase Auth lets the user sign in
  insert into auth.identities (
    id, user_id,
    identity_data,
    provider,
    last_sign_in_at, created_at, updated_at
  ) values (
    v_uid, v_uid,
    jsonb_build_object('sub', v_uid::text, 'email', 'rehman@portal.com'),
    'email',
    now(), now(), now()
  );

  -- 3. Fill in name and phone (trigger already created the row)
  update public.profiles
  set
    name  = 'Rehman',                          -- << display name
    phone = '0300-1234567',                    -- << phone number
    email = 'rehman@portal.com'               -- << email (already set by trigger, just explicit)
  where id = v_uid;

end;
$$;
