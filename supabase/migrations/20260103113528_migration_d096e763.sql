-- Add pricing columns to rooms table
ALTER TABLE rooms
ADD COLUMN IF NOT EXISTS daily_price DECIMAL(10,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS biweekly_price DECIMAL(10,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS monthly_price DECIMAL(10,2) DEFAULT NULL;

-- Update existing rooms to use daily_price from base_price
UPDATE rooms SET daily_price = base_price WHERE daily_price = 0;

-- Add comment explaining pricing structure
COMMENT ON COLUMN rooms.daily_price IS 'Price per night';
COMMENT ON COLUMN rooms.biweekly_price IS 'Price for 15 days stay (optional, if null uses daily_price * 15)';
COMMENT ON COLUMN rooms.monthly_price IS 'Price for 30 days stay (optional, if null uses daily_price * 30)';