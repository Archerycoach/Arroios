-- Create expense_categories table if not exists
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#3b82f6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view categories" ON expense_categories FOR SELECT USING (true);
CREATE POLICY "Admin can insert categories" ON expense_categories FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can update categories" ON expense_categories FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can delete categories" ON expense_categories FOR DELETE USING (auth.uid() IS NOT NULL);

-- Create extra_revenues table
CREATE TABLE IF NOT EXISTS extra_revenues (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  type TEXT NOT NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  date DATE NOT NULL,
  booking_id UUID REFERENCES bookings(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE extra_revenues ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can view extra revenues" ON extra_revenues FOR SELECT USING (true);
CREATE POLICY "Admin can insert extra revenues" ON extra_revenues FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can update extra revenues" ON extra_revenues FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Admin can delete extra revenues" ON extra_revenues FOR DELETE USING (auth.uid() IS NOT NULL);

-- Insert default categories
INSERT INTO expense_categories (name, color) VALUES
  ('Limpeza', '#10b981'),
  ('Manutenção', '#f59e0b'),
  ('Utilities', '#3b82f6'),
  ('Marketing', '#ec4899'),
  ('Salários', '#8b5cf6'),
  ('Taxas/Comissões', '#ef4444')
ON CONFLICT DO NOTHING;