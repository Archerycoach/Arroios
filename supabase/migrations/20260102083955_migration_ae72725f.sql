-- Add missing columns to bookings table
ALTER TABLE bookings 
ADD COLUMN IF NOT EXISTS subtotal DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS tax_amount DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS cleaning_fee DECIMAL(10, 2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS payment_status TEXT DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS payment_method TEXT,
ADD COLUMN IF NOT EXISTS special_requests TEXT,
ADD COLUMN IF NOT EXISTS cancellation_reason TEXT;