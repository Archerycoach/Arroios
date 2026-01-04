-- Add missing category column to uploads table
ALTER TABLE uploads ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'other';
CREATE INDEX IF NOT EXISTS idx_uploads_category ON uploads(category);