-- Create booking_add_ons junction table
CREATE TABLE IF NOT EXISTS booking_add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  add_on_id UUID NOT NULL REFERENCES add_ons(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(booking_id, add_on_id)
);

-- Enable RLS
ALTER TABLE booking_add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policies (authenticated users can view and manage their booking add-ons)
CREATE POLICY "Users can view booking add-ons" ON booking_add_ons
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can manage booking add-ons" ON booking_add_ons
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_booking_add_ons_booking ON booking_add_ons(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_add_ons_add_on ON booking_add_ons(add_on_id);