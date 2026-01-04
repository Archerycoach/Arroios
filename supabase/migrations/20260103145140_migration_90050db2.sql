-- 1. Convert to text first to allow arbitrary values during migration
ALTER TABLE rooms ALTER COLUMN room_type TYPE text;

-- 2. Update values mapping old types to new ones (handling potential case variations)
UPDATE rooms 
SET room_type = CASE 
  WHEN lower(room_type) = 'single' THEN 'Standard'
  WHEN lower(room_type) = 'double' THEN 'Suite'
  WHEN lower(room_type) IN ('triple', 'family') THEN 'Large'
  -- Keep existing valid values if any, else default to Standard
  WHEN room_type IN ('Standard', 'Suite', 'Large') THEN room_type
  ELSE 'Standard'
END;

-- 3. Drop the old type if it exists
DROP TYPE IF EXISTS room_type;

-- 4. Create the new enum type
CREATE TYPE room_type AS ENUM ('Standard', 'Suite', 'Large');

-- 5. Convert column back to the new enum type
ALTER TABLE rooms 
ALTER COLUMN room_type TYPE room_type USING room_type::room_type;

-- 6. Update default values and constraints for other columns
ALTER TABLE rooms ALTER COLUMN max_guests SET DEFAULT 1;
ALTER TABLE rooms ALTER COLUMN min_nights SET DEFAULT 15;

-- 7. Ensure existing records meet the new criteria
UPDATE rooms SET max_guests = 1 WHERE max_guests IS NULL OR max_guests = 0;
UPDATE rooms SET min_nights = 15 WHERE min_nights IS NULL OR min_nights < 15;