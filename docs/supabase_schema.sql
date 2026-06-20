-- Clean slate: Drop all tables if they exist to reset the schema
DROP TABLE IF EXISTS event_registrations CASCADE;
DROP TABLE IF EXISTS attendance CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS syllabus CASCADE;
DROP TABLE IF EXISTS members CASCADE;
DROP TYPE IF EXISTS user_role CASCADE;

-- Enums
CREATE TYPE user_role AS ENUM ('admin', 'student');

-- Members Table (Completely independent of Supabase Auth)
CREATE TABLE members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id TEXT UNIQUE NOT NULL,
  role user_role NOT NULL DEFAULT 'student',
  name TEXT NOT NULL,
  phone TEXT UNIQUE,
  email TEXT UNIQUE,
  pattern_string TEXT, -- Storing pattern as a simple string (e.g., '012')
  photo_url TEXT,
  blood_group TEXT,
  belt TEXT DEFAULT 'White',
  address TEXT,
  branch TEXT,
  member_status TEXT DEFAULT 'Active',
  date_of_joining DATE DEFAULT CURRENT_DATE,
  date_of_leaving DATE,
  achievements TEXT,
  instructor_remarks TEXT,
  fee_status TEXT DEFAULT 'Paid',
  pending_amount NUMERIC DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Attendance Table
CREATE TABLE attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- Events Table
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  target_belt TEXT,
  fee_breakup JSONB,
  faqs JSONB,
  custom_questions JSONB,
  date TIMESTAMPTZ
);

-- Event Registrations Table
CREATE TABLE event_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  form_responses JSONB
);

-- Syllabus Table
CREATE TABLE syllabus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  belt_level TEXT NOT NULL,
  title TEXT NOT NULL,
  video_url TEXT,
  is_premium BOOLEAN DEFAULT FALSE
);

-- Turn on Row Level Security but allow all for the demo
ALTER TABLE public.members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access for demo" ON public.members FOR ALL USING (true);

ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access for demo" ON public.attendance FOR ALL USING (true);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access for demo" ON public.events FOR ALL USING (true);

ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access for demo" ON public.event_registrations FOR ALL USING (true);

ALTER TABLE public.syllabus ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public full access for demo" ON public.syllabus FOR ALL USING (true);

-- Seed Admins with plain pattern strings
INSERT INTO public.members (member_id, role, name, phone, pattern_string)
VALUES 
    -- '0367852'
    ('XC260002', 'admin', 'Mohammed Hammaad', '9663527755', '0367852'),
    -- '048526'
    ('XC260001', 'admin', 'Master Farhan', '8884503703', '048526')
ON CONFLICT (member_id) DO NOTHING;
