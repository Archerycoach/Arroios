-- Create booking_payments table for tracking individual payments
CREATE TABLE IF NOT EXISTS booking_payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  payment_type TEXT NOT NULL CHECK (payment_type IN ('monthly', 'deposit', 'deposit_refund')),
  amount DECIMAL(10, 2) NOT NULL,
  due_date DATE NOT NULL,
  paid_date DATE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'refunded')),
  payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'card', 'mbway', 'other')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_booking_payments_booking_id ON booking_payments(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_payments_status ON booking_payments(status);
CREATE INDEX IF NOT EXISTS idx_booking_payments_due_date ON booking_payments(due_date);

-- Enable RLS
ALTER TABLE booking_payments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Authenticated users can view booking payments"
  ON booking_payments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert booking payments"
  ON booking_payments FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update booking payments"
  ON booking_payments FOR UPDATE
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete booking payments"
  ON booking_payments FOR DELETE
  USING (auth.uid() IS NOT NULL);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_booking_payments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_booking_payments_updated_at
  BEFORE UPDATE ON booking_payments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_payments_updated_at();