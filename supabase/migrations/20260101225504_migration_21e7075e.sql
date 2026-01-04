-- Enable Row Level Security on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE availability_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE dynamic_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE guests ENABLE ROW LEVEL SECURITY;
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_addons ENABLE ROW LEVEL SECURITY;
ALTER TABLE special_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for users table
CREATE POLICY "Users can view their own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON users
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for properties table
CREATE POLICY "Anyone can view active properties" ON properties
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage properties" ON properties
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for rooms table
CREATE POLICY "Anyone can view available rooms" ON rooms
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage rooms" ON rooms
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for availability_blocks table
CREATE POLICY "Anyone can view availability blocks" ON availability_blocks
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage availability blocks" ON availability_blocks
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for dynamic_pricing table
CREATE POLICY "Anyone can view dynamic pricing" ON dynamic_pricing
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage dynamic pricing" ON dynamic_pricing
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for guests table
CREATE POLICY "Users can view their own guest records" ON guests
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create guest records" ON guests
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all guests" ON guests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage guests" ON guests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for bookings table
CREATE POLICY "Users can view their own bookings" ON bookings
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can create bookings" ON bookings
  FOR INSERT WITH CHECK (user_id = auth.uid() OR auth.uid() IS NOT NULL);

CREATE POLICY "Admins can view all bookings" ON bookings
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage bookings" ON bookings
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for payments table
CREATE POLICY "Users can view their own payments" ON payments
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all payments" ON payments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage payments" ON payments
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for addons table
CREATE POLICY "Anyone can view available addons" ON addons
  FOR SELECT USING (is_available = true);

CREATE POLICY "Admins can manage addons" ON addons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for booking_addons table
CREATE POLICY "Users can view their booking addons" ON booking_addons
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all booking addons" ON booking_addons
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage booking addons" ON booking_addons
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for special_requests table
CREATE POLICY "Users can view their special requests" ON special_requests
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "Users can create special requests" ON special_requests
  FOR INSERT WITH CHECK (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all special requests" ON special_requests
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage special requests" ON special_requests
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for messages table
CREATE POLICY "Users can view messages from their bookings" ON messages
  FOR SELECT USING (
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
    OR sender_id = auth.uid()
  );

CREATE POLICY "Users can send messages for their bookings" ON messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() AND
    booking_id IN (SELECT id FROM bookings WHERE user_id = auth.uid())
  );

CREATE POLICY "Admins can view all messages" ON messages
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can send messages" ON messages
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

-- RLS Policies for expense_categories table
CREATE POLICY "Admins can view expense categories" ON expense_categories
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage expense categories" ON expense_categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- RLS Policies for expenses table
CREATE POLICY "Admins can view all expenses" ON expenses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role IN ('admin', 'staff'))
  );

CREATE POLICY "Admins can manage expenses" ON expenses
  FOR ALL USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Staff can create expenses" ON expenses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'staff')
  );

-- RLS Policies for notifications table
CREATE POLICY "Users can view their own notifications" ON notifications
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can update their own notifications" ON notifications
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "System can create notifications" ON notifications
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);