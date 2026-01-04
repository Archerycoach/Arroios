-- Drop legacy tables with CASCADE to remove dependencies
DROP TABLE IF EXISTS addons CASCADE;
DROP TABLE IF EXISTS booking_addons CASCADE;

-- Ensure profiles has all necessary columns
DO $$
BEGIN
  -- Add role column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'role') THEN
    ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'guest';
  END IF;
  
  -- Add full_name column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'full_name') THEN
    ALTER TABLE profiles ADD COLUMN full_name TEXT;
  END IF;
  
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'phone') THEN
    ALTER TABLE profiles ADD COLUMN phone TEXT;
  END IF;
  
  -- Add avatar_url column if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'profiles' AND column_name = 'avatar_url') THEN
    ALTER TABLE profiles ADD COLUMN avatar_url TEXT;
  END IF;
END $$;

-- Add constraint to role column
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_role_check CHECK (role IN ('admin', 'guest', 'staff'));

-- Update messages table to support conversations
ALTER TABLE messages ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id);
ALTER TABLE messages ALTER COLUMN booking_id DROP NOT NULL;

-- Create index for conversation_id in messages
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);