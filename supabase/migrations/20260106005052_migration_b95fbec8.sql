-- Add custom_price column to bookings table
ALTER TABLE bookings 
ADD COLUMN custom_price numeric(10,2) NULL;

-- Add comment to explain the column
COMMENT ON COLUMN bookings.custom_price IS 'Optional custom price that overrides the calculated room_price for special deals or manual adjustments';