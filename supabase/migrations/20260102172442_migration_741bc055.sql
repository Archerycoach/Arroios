-- Add minimum_nights column to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS minimum_nights INTEGER DEFAULT 1 CHECK (minimum_nights >= 1);

-- Add comment for documentation
COMMENT ON COLUMN rooms.minimum_nights IS 'Minimum number of nights required for booking this room';

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_rooms_minimum_nights ON rooms(minimum_nights);

-- Update existing rooms to have default minimum_nights
UPDATE rooms 
SET minimum_nights = 1 
WHERE minimum_nights IS NULL;