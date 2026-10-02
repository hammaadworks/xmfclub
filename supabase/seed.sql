-- ==============================================================================
-- XMFCLUB - Comprehensive Seed Data (DML)
-- ==============================================================================
-- Use this script to populate a fresh database with rich, realistic sample data.
-- Includes:
--   - Global Club Settings (Branches & Belt Promotion Rules)
--   - Admin, Instructors, and Students across various belts & branches
--   - Historic & recent Attendance Logs for streak & belt progress tracking
--   - Upcoming & Past Events (Tournaments, Masterclasses, Bootcamps)
--   - Active Event Registrations linking members to events
--
-- Default login pattern for all seeded accounts:
-- Draw an "X" pattern (dots: 0 -> 4 -> 8 -> 5 -> 2 -> 6)
-- ==============================================================================

-- 1. App Settings (Branches & Belts)
INSERT INTO public.app_settings (id, branches, belts)
VALUES (
    'global',
    '[
        {"name": "XMF Main HQ", "address": "123 Main St, Central Dojo, Sector 4", "mapsUrl": "https://maps.google.com/?q=XMF+Main+HQ"},
        {"name": "Northside Dojo", "address": "456 North Ave, North Wing Complex", "mapsUrl": "https://maps.google.com/?q=Northside+Dojo"},
        {"name": "Downtown Club", "address": "789 Down Blvd, South Arena Floor 2", "mapsUrl": "https://maps.google.com/?q=Downtown+Club"},
        {"name": "XMF East Studio", "address": "101 East Studio Rd, Hub 3", "mapsUrl": "https://maps.google.com/?q=XMF+East+Studio"}
    ]'::jsonb,
    '[
        {"name": "White", "required_days": 30},
        {"name": "Yellow", "required_days": 30},
        {"name": "Orange", "required_days": 30},
        {"name": "Green", "required_days": 35},
        {"name": "Blue", "required_days": 40},
        {"name": "Purple", "required_days": 45},
        {"name": "Brown", "required_days": 60},
        {"name": "Red", "required_days": 75},
        {"name": "Black", "required_days": 90}
    ]'::jsonb
)
ON CONFLICT (id) DO UPDATE SET
    branches = EXCLUDED.branches,
    belts = EXCLUDED.belts,
    updated_at = timezone('utc'::text, now());

-- 2. Members (Admin, Trainers, & Students across all belt levels)
INSERT INTO public.members (
    member_id, name, dob, age, phone, email, role, belt,
    member_status, fee_status, password, address, pin_code, branch, blood_group,
    date_of_joining, achievements, instructor_remarks, instructor_remarks_color,
    actual_fee, fee_detail, due_date, pending_amount, is_reviewed, is_deleted
)
VALUES
-- 2.1 Admin Account
(
    'XMF2001',
    'Master Farhan (Admin)',
    '1988-04-12',
    38,
    '9876543210',
    'admin@xmfclub.com',
    'admin',
    'Black',
    'Active',
    'Paid',
    '12345',
    '100 Master Enclave, Central City',
    '560001',
    'XMF Main HQ',
    'O+',
    '2020-01-01',
    '5th Dan Black Belt, National Gold Medalist, Founder of XMF',
    'Lead Headmaster and Chief Examiner.',
    'green',
    0,
    'Lifetime Admin Pass',
    NULL,
    0,
    true,
    false
),
-- 2.2 Senior Instructor
(
    'XMF2201',
    'Sensei Tariq Vance',
    '1994-08-20',
    32,
    '9876543212',
    'tariq@xmfclub.com',
    'instructor',
    'Black',
    'Active',
    'Paid',
    '12345',
    '45 Northside Heights, Dojo Lane',
    '560012',
    'Northside Dojo',
    'A+',
    '2022-03-15',
    'State Sparring Champion, Certified Krav Maga & Kickboxing Instructor',
    'Leading advanced striking & sparring sessions.',
    'green',
    0,
    'Staff Pass',
    NULL,
    0,
    true,
    false
),
-- 2.3 Student 1: Alex Rivera (Yellow Belt)
(
    'XMF2601',
    'Alex Rivera',
    '2005-06-15',
    21,
    '9876543211',
    'alex@xmfclub.com',
    'student',
    'Yellow',
    'Active',
    'Paid',
    '12345',
    '12 Palm Avenue, Apt 4B',
    '560034',
    'XMF Main HQ',
    'B+',
    '2026-01-10',
    'Best Rookie Striker 2026',
    'Excellent flexibility and front kick precision. Ready for Orange belt grading soon.',
    'green',
    1500.00,
    'Monthly Standard Membership (Paid on 1st)',
    (CURRENT_DATE + INTERVAL '10 days'),
    0,
    true,
    false
),
-- 2.4 Student 2: Priya Sharma (Green Belt)
(
    'XMF2602',
    'Priya Sharma',
    '2007-11-23',
    18,
    '9876543213',
    'priya.sharma@example.com',
    'student',
    'Green',
    'Active',
    'Paid',
    '12345',
    '88 Lotus Court, North Sector',
    '560045',
    'Northside Dojo',
    'O-',
    '2025-05-12',
    'Regional Kata Gold Medalist',
    'Exceptional form and mental discipline.',
    'green',
    1500.00,
    'Quarterly Advance Paid',
    (CURRENT_DATE + INTERVAL '45 days'),
    0,
    true,
    false
),
-- 2.5 Student 3: David Chen (Blue Belt)
(
    'XMF2603',
    'David Chen',
    '2002-03-09',
    24,
    '9876543214',
    'david.chen@example.com',
    'student',
    'Blue',
    'Active',
    'Paid',
    '12345',
    '502 Skyline Towers, Downtown',
    '560001',
    'Downtown Club',
    'AB+',
    '2024-09-01',
    'Inter-Club Heavyweight Sparring Silver',
    'Consistent training attendance. Working on counter-punch combinations.',
    'green',
    1800.00,
    'Monthly Pro Membership',
    (CURRENT_DATE + INTERVAL '5 days'),
    0,
    true,
    false
),
-- 2.6 Student 4: Sarah Jenkins (Purple Belt)
(
    'XMF2604',
    'Sarah Jenkins',
    '1999-12-04',
    26,
    '9876543215',
    'sarah.j@example.com',
    'student',
    'Purple',
    'Active',
    'Paid',
    '12345',
    '19 Heritage Way, West End',
    '560027',
    'XMF Main HQ',
    'A-',
    '2024-02-18',
    'Fastest Submission Award 2025',
    'Assisting junior students with form correction.',
    'green',
    1800.00,
    'Annual VIP Pass',
    (CURRENT_DATE + INTERVAL '120 days'),
    0,
    true,
    false
),
-- 2.7 Student 5: Marcus Vance (Brown Belt)
(
    'XMF2605',
    'Marcus Vance',
    '1998-07-30',
    28,
    '9876543216',
    'marcus.vance@example.com',
    'student',
    'Brown',
    'Active',
    'Paid',
    '12345',
    '77 Pine Ridge, North Hills',
    '560064',
    'Northside Dojo',
    'O+',
    '2023-06-01',
    'National Open Quarterfinalist',
    'Preparing for 1st Dan Black Belt examination in Q4.',
    'green',
    2000.00,
    'Monthly Elite Membership',
    (CURRENT_DATE + INTERVAL '14 days'),
    0,
    true,
    false
),
-- 2.8 Student 6: Zoya Khan (White Belt - New Volunteer Intake)
(
    'XMF2606',
    'Zoya Khan',
    '2010-09-14',
    15,
    '9876543217',
    'zoya.khan@example.com',
    'student',
    'White',
    'Active',
    'Paid',
    '12345',
    '23 Rosewood Street, East Studio Area',
    '560075',
    'XMF East Studio',
    'B-',
    '2026-09-15',
    NULL,
    'Newly admitted via volunteer intake desk. High enthusiasm.',
    'green',
    1200.00,
    'Introductory Beginner Tier',
    (CURRENT_DATE + INTERVAL '20 days'),
    0,
    false, -- Pending Review
    false
),
-- 2.9 Student 7: Rahul Verma (Orange Belt - Pending Fee Sample)
(
    'XMF2607',
    'Rahul Verma',
    '2006-02-18',
    20,
    '9876543218',
    'rahul.verma@example.com',
    'student',
    'Orange',
    'Active',
    'Pending',
    '12345',
    '44 Market Street, Downtown',
    '560002',
    'Downtown Club',
    'O+',
    '2025-10-01',
    'Club Runner Up - Speed Punch Challenge',
    'Needs to clear outstanding month dues.',
    'amber',
    1500.00,
    'Monthly Standard (Pending payment for current cycle)',
    (CURRENT_DATE - INTERVAL '3 days'),
    1500.00,
    true,
    false
),
-- 2.10 Student 8: Kenji Sato (Red Belt)
(
    'XMF2608',
    'Kenji Sato',
    '2001-05-11',
    25,
    '9876543219',
    'kenji.sato@example.com',
    'student',
    'Red',
    'Active',
    'Paid',
    '12345',
    '310 Imperial Walk, Main HQ Area',
    '560001',
    'XMF Main HQ',
    'A+',
    '2023-01-20',
    'Grandmaster Trophy 2025, Master of Taekwondo Hyung',
    'Master-level technique and endurance.',
    'green',
    2000.00,
    'Prepaid Annual Package',
    (CURRENT_DATE + INTERVAL '90 days'),
    0,
    true,
    false
),
-- 2.11 Student 9: Emma Watson (White Belt - Intake Entry)
(
    'XMF2609',
    'Emma Watson',
    '2012-04-05',
    14,
    '9876543220',
    'emma.w@example.com',
    'student',
    'White',
    'Active',
    'Paid',
    '12345',
    '15 Cedar Lane, North District',
    '560086',
    'Northside Dojo',
    'AB-',
    '2026-09-20',
    NULL,
    'Great coordination in foundational stances.',
    'green',
    1200.00,
    'Monthly Junior Cadet Pass',
    (CURRENT_DATE + INTERVAL '25 days'),
    0,
    false, -- Pending Review
    false
),
-- 2.12 Inactive/Discontinued Student (for filtering tests)
(
    'XMF260A',
    'Imran Malik',
    '2004-08-19',
    22,
    '9876543221',
    'imran.malik@example.com',
    'student',
    'Yellow',
    'Inactive',
    'Paid',
    '12345',
    '88 River Road, East Sector',
    '560098',
    'XMF East Studio',
    'O+',
    '2025-02-01',
    NULL,
    'On temporary academic break until next semester.',
    'red',
    1200.00,
    'Suspended on request',
    NULL,
    0,
    true,
    false
)
ON CONFLICT (member_id) DO UPDATE SET
    name = EXCLUDED.name,
    dob = EXCLUDED.dob,
    age = EXCLUDED.age,
    phone = EXCLUDED.phone,
    email = EXCLUDED.email,
    role = EXCLUDED.role,
    belt = EXCLUDED.belt,
    member_status = EXCLUDED.member_status,
    fee_status = EXCLUDED.fee_status,
    password = EXCLUDED.password,
    address = EXCLUDED.address,
    pin_code = EXCLUDED.pin_code,
    branch = EXCLUDED.branch,
    blood_group = EXCLUDED.blood_group,
    achievements = EXCLUDED.achievements,
    instructor_remarks = EXCLUDED.instructor_remarks,
    instructor_remarks_color = EXCLUDED.instructor_remarks_color,
    actual_fee = EXCLUDED.actual_fee,
    fee_detail = EXCLUDED.fee_detail,
    pending_amount = EXCLUDED.pending_amount,
    is_reviewed = EXCLUDED.is_reviewed,
    is_deleted = EXCLUDED.is_deleted;

-- 3. Attendance Logs (Simulating historic training sessions for belt progress)
-- 3.1 Attendance for Alex Rivera (XMF2601 - Yellow Belt, 12 sessions logged)
INSERT INTO public.attendance (member_id, belt, timestamp)
VALUES
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '24 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '22 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '19 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '17 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '15 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '12 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '10 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '8 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '5 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '3 days')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now() - INTERVAL '1 day')),
    ('XMF2601', 'Yellow', timezone('utc'::text, now()));

-- 3.2 Attendance for Priya Sharma (XMF2602 - Green Belt, 18 sessions logged)
INSERT INTO public.attendance (member_id, belt, timestamp)
VALUES
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '30 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '27 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '24 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '21 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '18 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '14 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '11 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '7 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '4 days')),
    ('XMF2602', 'Green', timezone('utc'::text, now() - INTERVAL '1 day'));

-- 3.3 Attendance for David Chen (XMF2603 - Blue Belt, 15 sessions logged)
INSERT INTO public.attendance (member_id, belt, timestamp)
VALUES
    ('XMF2603', 'Blue', timezone('utc'::text, now() - INTERVAL '25 days')),
    ('XMF2603', 'Blue', timezone('utc'::text, now() - INTERVAL '20 days')),
    ('XMF2603', 'Blue', timezone('utc'::text, now() - INTERVAL '15 days')),
    ('XMF2603', 'Blue', timezone('utc'::text, now() - INTERVAL '10 days')),
    ('XMF2603', 'Blue', timezone('utc'::text, now() - INTERVAL '6 days')),
    ('XMF2603', 'Blue', timezone('utc'::text, now() - INTERVAL '2 days'));

-- 4. Events (Upcoming & Past Competitions / Masterclasses)
INSERT INTO public.events (
    id, title, description, target_belt, date, time, fee, fee_breakup, venue_name, venue_map_url
)
VALUES
-- 4.1 Grand National Championship (Upcoming in 10 days)
(
    'e0000000-0000-0000-0000-000000000001',
    'National Open Martial Arts Championship 2026',
    'Official tournament featuring open division point sparring, creative kata routines, and speed board breaking with awards ceremony.',
    'All',
    (CURRENT_DATE + INTERVAL '10 days' + TIME '09:30:00')::timestamptz,
    '09:30',
    750.00,
    '{"entry": 500, "kit": 250, "total": 750}'::jsonb,
    'XMF Main HQ',
    'https://maps.google.com/?q=XMF+Main+HQ'
),
-- 4.2 Black & Brown Belt Masterclass (Upcoming in 21 days)
(
    'e0000000-0000-0000-0000-000000000002',
    'Advanced Dan Candidate Masterclass & Sparring Lab',
    'High-intensity tactical fight breakdown, pressure point counters, and Dan grading curriculum prep under Master Farhan.',
    'Brown',
    (CURRENT_DATE + INTERVAL '21 days' + TIME '16:00:00')::timestamptz,
    '16:00',
    1200.00,
    '{"workshop": 1000, "certification": 200, "total": 1200}'::jsonb,
    'Northside Dojo',
    'https://maps.google.com/?q=Northside+Dojo'
),
-- 4.3 Junior Striking & Reflex Seminar (Upcoming in 5 days)
(
    'e0000000-0000-0000-0000-000000000003',
    'Junior Sparring & Agility Workshop',
    'Dynamic reflex drills, pad striking, and sportsmanship building for White, Yellow, and Orange belt cadets.',
    'Yellow',
    (CURRENT_DATE + INTERVAL '5 days' + TIME '11:00:00')::timestamptz,
    '11:00',
    350.00,
    '{"entry": 350, "total": 350}'::jsonb,
    'Downtown Club',
    'https://maps.google.com/?q=Downtown+Club'
),
-- 4.4 Past Completed Seminar (Completed 30 days ago)
(
    'e0000000-0000-0000-0000-000000000004',
    'Summer Self-Defense Intensive 2026',
    'Street awareness, situational escape strategies, and core conditioning workshop.',
    'All',
    (CURRENT_DATE - INTERVAL '30 days' + TIME '10:00:00')::timestamptz,
    '10:00',
    500.00,
    '{"total": 500}'::jsonb,
    'XMF Main HQ',
    'https://maps.google.com/?q=XMF+Main+HQ'
)
ON CONFLICT (id) DO UPDATE SET
    title = EXCLUDED.title,
    description = EXCLUDED.description,
    target_belt = EXCLUDED.target_belt,
    date = EXCLUDED.date,
    time = EXCLUDED.time,
    fee = EXCLUDED.fee,
    fee_breakup = EXCLUDED.fee_breakup,
    venue_name = EXCLUDED.venue_name;

-- 5. Event Registrations (Linking Members to Events)
INSERT INTO public.event_registrations (event_id, member_id, status, registered_at)
VALUES
    -- Alex Rivera registered for National Championship & Junior Workshop
    ('e0000000-0000-0000-0000-000000000001', 'XMF2601', 'Registered', timezone('utc'::text, now() - INTERVAL '3 days')),
    ('e0000000-0000-0000-0000-000000000003', 'XMF2601', 'Registered', timezone('utc'::text, now() - INTERVAL '2 days')),

    -- Priya Sharma registered for National Championship
    ('e0000000-0000-0000-0000-000000000001', 'XMF2602', 'Registered', timezone('utc'::text, now() - INTERVAL '4 days')),

    -- David Chen registered for National Championship
    ('e0000000-0000-0000-0000-000000000001', 'XMF2603', 'Registered', timezone('utc'::text, now() - INTERVAL '1 day')),

    -- Marcus Vance registered for Advanced Dan Masterclass
    ('e0000000-0000-0000-0000-000000000002', 'XMF2605', 'Registered', timezone('utc'::text, now() - INTERVAL '5 days')),

    -- Sarah Jenkins registered for National Championship
    ('e0000000-0000-0000-0000-000000000001', 'XMF2604', 'Registered', timezone('utc'::text, now() - INTERVAL '2 days'))
ON CONFLICT (event_id, member_id) DO NOTHING;
