-- Convert the column to use the new enum type
ALTER TABLE rooms 
ALTER COLUMN room_type TYPE room_type 
USING (
  CASE 
    WHEN room_type::text = 'standard' THEN 'Standard'::room_type
    WHEN room_type::text = 'suite' THEN 'Suite'::room_type
    WHEN room_type::text = 'large' THEN 'Large'::room_type
    ELSE 'Standard'::room_type
  END
);