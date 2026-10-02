-- Migration: Add password and address pin_code to public.members, remove legacy pattern_hash

DO $$
BEGIN
  -- If pin_code was previously added as the password column, rename it to password
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'members' 
      AND column_name = 'pin_code'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'members' 
      AND column_name = 'password'
  ) THEN
    ALTER TABLE public.members RENAME COLUMN pin_code TO password;
  END IF;
END $$;

-- Ensure password column exists with default '12345'
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS password TEXT NOT NULL DEFAULT '12345';

-- Ensure pin_code column exists for residential address postal code
ALTER TABLE public.members ADD COLUMN IF NOT EXISTS pin_code TEXT;

-- Drop obsolete pattern_hash if still present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
      AND table_name = 'members' 
      AND column_name = 'pattern_hash'
  ) THEN
    ALTER TABLE public.members DROP COLUMN pattern_hash;
  END IF;
END $$;

-- Create index on pin_code
CREATE INDEX IF NOT EXISTS idx_members_pin_code ON public.members(pin_code);

-- Notify PostgREST to reload its schema cache immediately
NOTIFY pgrst, 'reload schema';
