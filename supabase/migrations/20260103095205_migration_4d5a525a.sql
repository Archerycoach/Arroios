-- Create add_ons table (without dependency on profiles)
CREATE TABLE IF NOT EXISTS add_ons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN ('bed', 'breakfast', 'cleaning', 'transfer', 'parking', 'other')),
  price DECIMAL(10,2) NOT NULL,
  unit TEXT NOT NULL CHECK (unit IN ('per_booking', 'per_night', 'per_person', 'per_item')),
  max_quantity INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE add_ons ENABLE ROW LEVEL SECURITY;

-- RLS Policies (anyone can view active add-ons, only authenticated users can manage)
CREATE POLICY "Anyone can view active add-ons" ON add_ons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Authenticated users can manage add-ons" ON add_ons
  FOR ALL USING (auth.uid() IS NOT NULL);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_add_ons_property ON add_ons(property_id);
CREATE INDEX IF NOT EXISTS idx_add_ons_active ON add_ons(is_active);