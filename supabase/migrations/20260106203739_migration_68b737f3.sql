-- Add notes column to payments table
ALTER TABLE payments ADD COLUMN IF NOT EXISTS notes TEXT;

COMMENT ON COLUMN payments.notes IS 'Additional notes or comments about the payment';