-- Add payment_type column to bookings table
ALTER TABLE bookings 
ADD COLUMN payment_type VARCHAR(50) NULL;

-- Add comment for documentation
COMMENT ON COLUMN bookings.payment_type IS 'Type of payment method used (cash, card, transfer, etc.)';