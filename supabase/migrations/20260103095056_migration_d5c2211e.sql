-- Create function to automatically update booking number on insert
CREATE OR REPLACE FUNCTION generate_booking_number()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.booking_number IS NULL THEN
    NEW.booking_number := 'BK' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(CAST(FLOOR(RANDOM() * 10000) AS TEXT), 4, '0');
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic booking number generation
DROP TRIGGER IF EXISTS trigger_generate_booking_number ON bookings;
CREATE TRIGGER trigger_generate_booking_number
  BEFORE INSERT ON bookings
  FOR EACH ROW
  EXECUTE FUNCTION generate_booking_number();