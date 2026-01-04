-- Drop the old ENUM type and create new one with correct values
ALTER TYPE room_type RENAME TO room_type_old;

CREATE TYPE room_type AS ENUM ('Standard', 'Suite', 'Large');