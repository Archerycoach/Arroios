-- Create uploads table for storing images
CREATE TABLE IF NOT EXISTS uploads (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_type TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  uploaded_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE uploads ENABLE ROW LEVEL SECURITY;

-- Admin/Staff can view uploads
CREATE POLICY "Admin and staff can view uploads"
ON uploads FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

-- Admin/Staff can upload files
CREATE POLICY "Admin and staff can upload files"
ON uploads FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role IN ('admin', 'staff')
  )
);

-- Admin can delete uploads
CREATE POLICY "Admin can delete uploads"
ON uploads FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_uploads_uploaded_by ON uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_uploads_created ON uploads(created_at DESC);