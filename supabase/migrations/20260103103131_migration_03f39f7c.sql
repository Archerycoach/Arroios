-- Create settings table for frontend configuration
CREATE TABLE IF NOT EXISTS settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES users(id)
);

-- Enable RLS
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can view settings
CREATE POLICY "Admin and staff can view settings"
ON settings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

-- Admin can update settings
CREATE POLICY "Admin can update settings"
ON settings FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Admin can insert settings
CREATE POLICY "Admin can insert settings"
ON settings FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_settings_key ON settings(key);

-- Insert default settings
INSERT INTO settings (key, value) VALUES
  ('site_name', '"Gestão Arroios"'::jsonb),
  ('site_logo', '"/logo.png"'::jsonb),
  ('amenities', '["Wi-Fi Gratuito", "Ar Condicionado", "TV por Cabo", "Aquecimento Central", "Roupa de Cama Incluída", "Toalhas Incluídas"]'::jsonb),
  ('footer_info', '{
    "address": "Rua dos Arroios, Lisboa, Portugal",
    "phone": "+351 21 XXX XXXX",
    "email": "info@gestaoareoios.pt",
    "facebook": "",
    "instagram": "",
    "whatsapp": "+351 9XX XXX XXX"
  }'::jsonb),
  ('gallery_images', '[]'::jsonb)
ON CONFLICT (key) DO NOTHING;