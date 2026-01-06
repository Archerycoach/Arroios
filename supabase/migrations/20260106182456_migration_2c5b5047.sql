-- Add missing columns to payments table to match booking_payments structure
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS due_date DATE,
ADD COLUMN IF NOT EXISTS payment_date DATE,
ADD COLUMN IF NOT EXISTS payment_type TEXT DEFAULT 'other';

-- Add comment explaining the columns
COMMENT ON COLUMN payments.due_date IS 'Data de vencimento do pagamento';
COMMENT ON COLUMN payments.payment_date IS 'Data efetiva do pagamento';
COMMENT ON COLUMN payments.payment_type IS 'Tipo de pagamento: monthly, biweekly, deposit, deposit_refund, daily, other';