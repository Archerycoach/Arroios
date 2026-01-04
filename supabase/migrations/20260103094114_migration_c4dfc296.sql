-- Add missing columns to expenses table
ALTER TABLE expenses 
ADD COLUMN IF NOT EXISTS supplier TEXT,
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'card',
ADD COLUMN IF NOT EXISTS is_recurring BOOLEAN DEFAULT false;

-- Add comments for documentation
COMMENT ON COLUMN expenses.supplier IS 'Name of the supplier/vendor';
COMMENT ON COLUMN expenses.payment_method IS 'Payment method: card, cash, transfer, mbway, multibanco, check';
COMMENT ON COLUMN expenses.is_recurring IS 'Whether this is a recurring expense';