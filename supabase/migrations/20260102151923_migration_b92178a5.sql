-- Add is_active column to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- Add index for better performance on filtering
CREATE INDEX IF NOT EXISTS idx_rooms_is_active ON rooms(is_active);

-- Update existing rooms to be active by default
UPDATE rooms 
SET is_active = true 
WHERE is_active IS NULL;