-- Add a new professor
-- Copy this block, fill in the values, and run in Supabase SQL Editor

INSERT INTO profiles (id, email, password, name, phone, university_name)
VALUES (
  gen_random_uuid(),
  'EMAIL_HERE',
  'PASSWORD_HERE',
  'FULL_NAME_HERE',
  'PHONE_HERE',
  'UNIVERSITY_NAME_HERE'
);

-- ============================================================
-- EXISTING PROFESSORS
-- ============================================================

-- Ateeq Ur Rehman
INSERT INTO profiles (id, email, password, name, phone, university_name)
VALUES (
  gen_random_uuid(),
  'profatiq@university.edu',
  'profatiq251',
  'Ateeq Ur Rehman',
  '03469204646',
  'Thal University Bhakkar'
);

-- Faqeer Ullah
INSERT INTO profiles (id, email, password, name, phone, university_name)
VALUES (
  gen_random_uuid(),
  'proffaqir@university.edu',
  'proffaqir251',
  'Faqeer Ullah',
  '03236150510',
  'Thal University Bhakkar'
);
