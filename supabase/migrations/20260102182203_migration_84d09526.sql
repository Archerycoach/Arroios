-- Add rental type and monthly price fields to rooms table
ALTER TABLE rooms 
ADD COLUMN IF NOT EXISTS rental_type TEXT DEFAULT 'nightly' CHECK (rental_type IN ('nightly', 'biweekly')),
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2);

-- Add helpful comment
COMMENT ON COLUMN rooms.rental_type IS 'Rental type: nightly (per night) or biweekly (15-day periods based on monthly price)';
COMMENT ON COLUMN rooms.monthly_price IS 'Monthly price used for biweekly period calculation (monthly_price / 2 per 15 days)';

-- Create index for filtering by rental type
CREATE INDEX IF NOT EXISTS idx_rooms_rental_type ON rooms(rental_type);

-- Update existing rooms to have default rental type
UPDATE rooms 
SET rental_type = 'nightly' 
WHERE rental_type IS NULL;