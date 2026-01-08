ALTER TABLE extra_revenues 
ADD COLUMN IF NOT EXISTS payment_method text,
ADD COLUMN IF NOT EXISTS bank_account_id uuid REFERENCES bank_accounts(id),
ADD COLUMN IF NOT EXISTS notes text;