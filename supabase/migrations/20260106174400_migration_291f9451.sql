-- Add bank_account_id to rooms table
ALTER TABLE rooms ADD COLUMN IF NOT EXISTS bank_account_id UUID REFERENCES bank_accounts(id) ON DELETE SET NULL;