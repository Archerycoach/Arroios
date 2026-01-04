-- Add room_number to rooms table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='rooms' AND column_name='room_number') THEN
    ALTER TABLE rooms ADD COLUMN room_number TEXT;
    
    -- Generate room numbers for existing rooms
    UPDATE rooms 
    SET room_number = 'R' || LPAD(CAST(ROW_NUMBER() OVER (ORDER BY created_at) AS TEXT), 3, '0')
    WHERE room_number IS NULL;
  END IF;
END $$;