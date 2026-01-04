-- Update the rental_type check constraint to allow new types
ALTER TABLE rooms DROP CONSTRAINT IF EXISTS rooms_rental_type_check;

ALTER TABLE rooms ADD CONSTRAINT rooms_rental_type_check 
  CHECK (rental_type IN ('nightly', 'biweekly', 'short_term', 'long_term'));

-- Commenting to ensure schema reload picks this up
COMMENT ON COLUMN rooms.rental_type IS 'Rental duration type: nightly, biweekly, short_term, long_term';