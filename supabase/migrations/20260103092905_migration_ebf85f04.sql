-- Add tax_id column to guests table
ALTER TABLE guests 
ADD COLUMN IF NOT EXISTS tax_id TEXT;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_guests_tax_id ON guests(tax_id);

-- Update RLS policies to allow tax_id access
-- (Existing policies should already cover this, but let's verify)