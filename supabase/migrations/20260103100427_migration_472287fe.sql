-- Update messages table to support conversations
ALTER TABLE messages 
ADD COLUMN IF NOT EXISTS conversation_id UUID REFERENCES conversations(id),
ALTER COLUMN booking_id DROP NOT NULL;

-- Add index for the new column
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON messages(conversation_id);