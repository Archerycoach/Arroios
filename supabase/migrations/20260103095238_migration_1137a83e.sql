-- Create or replace function to generate booking numbers
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(nextval('booking_number_seq')::TEXT, 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create sequence for booking numbers if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS booking_number_seq START 1;

-- Drop trigger if exists and recreate
DROP TRIGGER IF EXISTS set_booking_number ON bookings;

CREATE TRIGGER set_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_number();