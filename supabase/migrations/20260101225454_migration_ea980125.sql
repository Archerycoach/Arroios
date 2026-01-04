-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create ENUM types
CREATE TYPE user_role AS ENUM ('admin', 'staff', 'guest');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'paid', 'cancelled', 'no_show', 'completed');
CREATE TYPE payment_status AS ENUM ('pending', 'processing', 'completed', 'failed', 'refunded', 'partially_refunded');
CREATE TYPE payment_method AS ENUM ('credit_card', 'debit_card', 'bank_transfer', 'cash', 'other');
CREATE TYPE room_type AS ENUM ('single', 'double', 'suite', 'deluxe', 'studio', 'apartment');
CREATE TYPE bed_type AS ENUM ('single', 'double', 'queen', 'king', 'sofa_bed', 'bunk_bed');
CREATE TYPE special_request_status AS ENUM ('pending', 'approved', 'rejected', 'completed');
CREATE TYPE message_type AS ENUM ('guest', 'staff', 'system', 'automated');
CREATE TYPE notification_type AS ENUM ('booking_confirmed', 'booking_cancelled', 'payment_received', 'payment_failed', 'special_request', 'message_received', 'system');

-- 1. Users table (extends Supabase auth.users)
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role user_role DEFAULT 'guest' NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Properties table
CREATE TABLE properties (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  check_in_time TIME NOT NULL DEFAULT '15:00:00',
  check_out_time TIME NOT NULL DEFAULT '11:00:00',
  timezone TEXT DEFAULT 'Europe/Lisbon',
  currency TEXT DEFAULT 'EUR',
  tax_rate DECIMAL(5,2) DEFAULT 0,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  cancellation_policy TEXT,
  house_rules TEXT,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Rooms table
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  room_type room_type NOT NULL,
  description TEXT,
  max_guests INTEGER NOT NULL DEFAULT 2,
  beds JSONB NOT NULL DEFAULT '[]'::jsonb,
  size_sqm DECIMAL(10,2),
  base_price DECIMAL(10,2) NOT NULL,
  amenities JSONB DEFAULT '[]'::jsonb,
  images JSONB DEFAULT '[]'::jsonb,
  floor INTEGER,
  room_number TEXT,
  is_available BOOLEAN DEFAULT true,
  min_nights INTEGER DEFAULT 1,
  max_nights INTEGER,
  policies TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Availability blocks table
CREATE TABLE availability_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT,
  is_maintenance BOOLEAN DEFAULT false,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_date_range CHECK (end_date >= start_date)
);

-- 5. Dynamic pricing table
CREATE TABLE dynamic_pricing (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  min_nights INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(room_id, date)
);

-- 6. Guests table
CREATE TABLE guests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  document_type TEXT,
  document_number TEXT,
  nationality TEXT,
  date_of_birth DATE,
  address TEXT,
  city TEXT,
  country TEXT,
  postal_code TEXT,
  preferences JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Bookings table
CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number TEXT UNIQUE NOT NULL,
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE RESTRICT,
  guest_id UUID NOT NULL REFERENCES guests(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  check_in_date DATE NOT NULL,
  check_out_date DATE NOT NULL,
  num_guests INTEGER NOT NULL DEFAULT 1,
  num_nights INTEGER NOT NULL,
  status booking_status DEFAULT 'pending' NOT NULL,
  room_price DECIMAL(10,2) NOT NULL,
  extras_total DECIMAL(10,2) DEFAULT 0,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  cleaning_fee DECIMAL(10,2) DEFAULT 0,
  total_amount DECIMAL(10,2) NOT NULL,
  special_notes TEXT,
  cancellation_reason TEXT,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT valid_booking_dates CHECK (check_out_date > check_in_date),
  CONSTRAINT positive_guests CHECK (num_guests > 0),
  CONSTRAINT positive_nights CHECK (num_nights > 0)
);

-- 8. Payments table
CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  currency TEXT DEFAULT 'EUR',
  payment_method payment_method NOT NULL,
  status payment_status DEFAULT 'pending' NOT NULL,
  stripe_payment_intent_id TEXT,
  stripe_charge_id TEXT,
  transaction_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  refunded_amount DECIMAL(10,2) DEFAULT 0,
  refunded_at TIMESTAMP WITH TIME ZONE,
  failure_reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 9. Add-ons/Extras table
CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id UUID NOT NULL REFERENCES properties(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  unit TEXT DEFAULT 'per_item',
  is_available BOOLEAN DEFAULT true,
  category TEXT,
  icon TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 10. Booking add-ons (many-to-many)
CREATE TABLE booking_addons (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  addon_id UUID NOT NULL REFERENCES addons(id) ON DELETE RESTRICT,
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 11. Special requests table
CREATE TABLE special_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  request_type TEXT NOT NULL,
  description TEXT NOT NULL,
  request_date DATE,
  quantity INTEGER DEFAULT 1,
  additional_cost DECIMAL(10,2) DEFAULT 0,
  status special_request_status DEFAULT 'pending' NOT NULL,
  response_note TEXT,
  responded_by UUID REFERENCES users(id),
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 12. Messages/Conversations table
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_type message_type DEFAULT 'guest' NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 13. Expense categories table
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  color TEXT DEFAULT '#64748b',
  icon TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 14. Expenses table
CREATE TABLE expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID NOT NULL REFERENCES expense_categories(id) ON DELETE RESTRICT,
  property_id UUID REFERENCES properties(id) ON DELETE CASCADE,
  room_id UUID REFERENCES rooms(id) ON DELETE SET NULL,
  description TEXT NOT NULL,
  amount DECIMAL(10,2) NOT NULL,
  date DATE NOT NULL,
  vendor TEXT,
  invoice_number TEXT,
  is_recurring BOOLEAN DEFAULT false,
  recurrence_interval TEXT,
  payment_method payment_method,
  notes TEXT,
  attachments JSONB DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 15. Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  notification_type notification_type NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  link TEXT,
  is_read BOOLEAN DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_rooms_property ON rooms(property_id);
CREATE INDEX idx_rooms_type ON rooms(room_type);
CREATE INDEX idx_bookings_room ON bookings(room_id);
CREATE INDEX idx_bookings_guest ON bookings(guest_id);
CREATE INDEX idx_bookings_user ON bookings(user_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_dates ON bookings(check_in_date, check_out_date);
CREATE INDEX idx_payments_booking ON payments(booking_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_messages_booking ON messages(booking_id);
CREATE INDEX idx_messages_sender ON messages(sender_id);
CREATE INDEX idx_expenses_category ON expenses(category_id);
CREATE INDEX idx_expenses_date ON expenses(date);
CREATE INDEX idx_availability_blocks_room ON availability_blocks(room_id);
CREATE INDEX idx_availability_blocks_dates ON availability_blocks(start_date, end_date);
CREATE INDEX idx_dynamic_pricing_room_date ON dynamic_pricing(room_id, date);
CREATE INDEX idx_notifications_user ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(is_read);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_properties_updated_at BEFORE UPDATE ON properties
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_rooms_updated_at BEFORE UPDATE ON rooms
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_payments_updated_at BEFORE UPDATE ON payments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expenses_updated_at BEFORE UPDATE ON expenses
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_guests_updated_at BEFORE UPDATE ON guests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_addons_updated_at BEFORE UPDATE ON addons
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_special_requests_updated_at BEFORE UPDATE ON special_requests
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_dynamic_pricing_updated_at BEFORE UPDATE ON dynamic_pricing
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();