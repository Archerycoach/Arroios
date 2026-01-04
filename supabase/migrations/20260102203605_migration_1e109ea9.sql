-- Add floor and building columns to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS floor INTEGER,
ADD COLUMN IF NOT EXISTS building TEXT;

-- Add helpful comments
COMMENT ON COLUMN rooms.floor IS 'Floor number (0=ground, 1=first, etc.)';
COMMENT ON COLUMN rooms.building IS 'Building or apartment identifier';

-- Create index for filtering performance
CREATE INDEX IF NOT EXISTS idx_rooms_floor ON rooms(floor);
CREATE INDEX IF NOT EXISTS idx_rooms_building ON rooms(building);