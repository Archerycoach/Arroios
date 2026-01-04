-- Add missing columns to bookings table
DO $$
BEGIN
  -- Add booking_number if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='booking_number') THEN
    ALTER TABLE bookings ADD COLUMN booking_number TEXT;
    
    -- Generate booking numbers for existing records
    UPDATE bookings 
    SET booking_number = 'BK' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 6, '0')
    WHERE booking_number IS NULL;
    
    -- Make it NOT NULL and UNIQUE after populating
    ALTER TABLE bookings ALTER COLUMN booking_number SET NOT NULL;
    ALTER TABLE bookings ADD CONSTRAINT bookings_booking_number_unique UNIQUE (booking_number);
  END IF;

  -- Add num_nights if it doesn't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='bookings' AND column_name='num_nights') THEN
    ALTER TABLE bookings ADD COLUMN num_nights INTEGER;
    
    -- Calculate nights for existing bookings
    UPDATE bookings 
    SET num_nights = GREATEST(1, EXTRACT(DAY FROM (check_out_date - check_in_date))::INTEGER)
    WHERE num_nights IS NULL;
    
    ALTER TABLE bookings ALTER COLUMN num_nights SET NOT NULL;
  END IF;
END $$;