-- Add notes column to guests table
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN guests.notes IS 'Additional notes about the guest';