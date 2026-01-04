-- Check if profiles has data just to be safe before dropping
SELECT count(*) FROM profiles;
-- Drop profiles table as we are using users table
DROP TABLE IF EXISTS profiles;