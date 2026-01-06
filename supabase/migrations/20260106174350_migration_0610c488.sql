-- Create bank_accounts table
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bank_name TEXT,
  iban TEXT,
  swift_bic TEXT,
  account_holder TEXT,
  is_active BOOLEAN DEFAULT true,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow authenticated users to view bank accounts" ON bank_accounts FOR SELECT USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to insert bank accounts" ON bank_accounts FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to update bank accounts" ON bank_accounts FOR UPDATE USING (auth.uid() IS NOT NULL);
CREATE POLICY "Allow authenticated users to delete bank accounts" ON bank_accounts FOR DELETE USING (auth.uid() IS NOT NULL);