-- Update default values for max_guests and min_nights
ALTER TABLE rooms 
ALTER COLUMN max_guests SET DEFAULT 1,
ALTER COLUMN min_nights SET DEFAULT 15;