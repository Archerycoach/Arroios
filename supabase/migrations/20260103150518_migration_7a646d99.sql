-- Update only existing columns that should allow NULL

-- Expenses table - description can be NULL
ALTER TABLE expenses 
  ALTER COLUMN description DROP NOT NULL;

COMMENT ON COLUMN expenses.description IS 'Optional expense description - can be NULL';

-- Bookings table - user_id can be NULL (for guest bookings without accounts)
ALTER TABLE bookings 
  ALTER COLUMN user_id DROP NOT NULL;

COMMENT ON COLUMN bookings.user_id IS 'Optional user ID - NULL for guest bookings';

-- Rooms table - optional fields can be NULL
ALTER TABLE rooms 
  ALTER COLUMN description DROP NOT NULL,
  ALTER COLUMN biweekly_price DROP NOT NULL,
  ALTER COLUMN monthly_price DROP NOT NULL;

COMMENT ON COLUMN rooms.description IS 'Optional room description - can be NULL';
COMMENT ON COLUMN rooms.biweekly_price IS 'Optional biweekly price - can be NULL';
COMMENT ON COLUMN rooms.monthly_price IS 'Optional monthly price - can be NULL';