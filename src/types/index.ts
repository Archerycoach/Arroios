// User & Authentication
export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "admin" | "staff" | "guest";

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
}

// Property & Room
export interface Property {
  id: string;
  name: string;
  address: string;
  city: string;
  country: string;
  postalCode?: string;
  description?: string;
  images?: string[];
  amenities?: string[];
  policies?: PropertyPolicies;
  contactEmail: string;
  contactPhone: string;
  checkInTime: string;
  checkOutTime: string;
  timezone?: string;
  currency: string;
  taxRate?: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface PropertyPolicies {
  cancellation: CancellationPolicy;
  minimumStay: number;
  childrenAllowed: boolean;
  petsAllowed: boolean;
  smokingAllowed: boolean;
}

export type CancellationPolicy = "flexible" | "moderate" | "strict";

export type RoomType = "Standard" | "Suite" | "Large";
export type RentalType = "nightly" | "biweekly" | "short_term" | "long_term";

// Room interface matching actual database schema
export interface Room {
  id: string;
  property_id?: string;
  room_number?: string;
  name: string;
  description?: string;
  room_type: RoomType;
  base_price: number;
  max_guests: number;
  amenities: string[];
  images: string[];
  is_available: boolean;
  rental_type: RentalType;
  minimum_nights?: number;
  floor?: number;
  created_at: string;
  updated_at: string;
}

export interface Guest {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  address?: string; // Add address
  date_of_birth?: string; // Add date of birth
  nationality?: string; // Add nationality
  tax_id?: string; // Add tax ID (NIF)
  created_at: string;
  updated_at: string;
}

// Availability & Pricing
export interface Availability {
  id: string;
  roomId: string;
  date: string;
  isAvailable: boolean;
  reason?: string;
  createdAt: string;
  updatedAt: string;
}

export interface RatePlan {
  id: string;
  roomId: string;
  name: string;
  startDate: string;
  endDate: string;
  price: number;
  dayOfWeekPrices?: DayOfWeekPrices;
  minimumStay?: number;
  checkInDays?: number[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DayOfWeekPrices {
  monday?: number;
  tuesday?: number;
  wednesday?: number;
  thursday?: number;
  friday?: number;
  saturday?: number;
  sunday?: number;
}

// Booking
export interface Booking {
  id: string;
  bookingNumber: string;
  roomId: string;
  guestId: string;
  checkIn: string;
  checkOut: string;
  numberOfGuests: number;
  numberOfNights: number;
  status: BookingStatus;
  totalPrice: number;
  subtotal: number;
  tax: number;
  discount?: number;
  couponCode?: string;
  specialRequests: string;
  cancellationReason?: string;
  cancelledAt?: string;
  createdAt: string;
  updatedAt: string;
}

export type BookingStatus = 
  | "pending"
  | "confirmed"
  | "paid"
  | "cancelled"
  | "no-show"
  | "completed";

// Payment
export interface Payment {
  id: string;
  bookingId: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  method: PaymentMethod;
  stripePaymentIntentId?: string;
  stripeChargeId?: string;
  refundedAmount?: number;
  createdAt: string;
  updatedAt: string;
}

export type PaymentStatus = 
  | "pending"
  | "processing"
  | "succeeded"
  | "failed"
  | "refunded"
  | "partially_refunded";

export type PaymentMethod = "card" | "bank_transfer" | "cash" | "other";

export interface Refund {
  id: string;
  paymentId: string;
  bookingId: string;
  amount: number;
  reason: string;
  status: "pending" | "approved" | "rejected" | "completed";
  stripeRefundId?: string;
  createdAt: string;
  updatedAt: string;
}

// Add-ons & Extras
export interface AddOn {
  id: string;
  propertyId: string;
  name: string;
  description: string;
  category: AddOnCategory;
  price: number;
  unit: "per_booking" | "per_night" | "per_person" | "per_item";
  maxQuantity?: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export type AddOnCategory = 
  | "bed"
  | "breakfast"
  | "cleaning"
  | "transfer"
  | "parking"
  | "other";

export interface BookingAddOn {
  id: string;
  bookingId: string;
  addOnId: string;
  quantity: number;
  totalPrice: number;
  createdAt: string;
}

// Special Requests by Date
export interface SpecialRequest {
  id: string;
  bookingId: string;
  requestDate: string;
  type: SpecialRequestType;
  description: string;
  quantity?: number;
  cost?: number;
  status: RequestStatus;
  notes?: string;
  respondedAt?: string;
  respondedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export type SpecialRequestType = 
  | "extra_bed"
  | "crib"
  | "late_checkin"
  | "early_checkout"
  | "special_meal"
  | "other";

export type RequestStatus = "pending" | "approved" | "rejected";

// Messages
export interface Conversation {
  id: string;
  bookingId: string;
  guestId: string;
  lastMessageAt: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderRole: UserRole;
  content: string;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

// Expenses & Financial
export interface Expense {
  id: string;
  propertyId: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  isRecurring: boolean;
  recurringFrequency?: "daily" | "weekly" | "monthly" | "yearly";
  roomId?: string;
  attachments?: string[];
  notes?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface ExpenseCategory {
  id: string;
  name: string;
  color: string;
  icon?: string;
  createdAt: string;
}

export interface Revenue {
  bookingId: string;
  amount: number;
  channel: RevenueChannel;
  date: string;
  roomId: string;
}

export type RevenueChannel = "website" | "manual" | "partner" | "other";

// Reports & Analytics
export interface OccupancyReport {
  period: string;
  totalNights: number;
  occupiedNights: number;
  occupancyRate: number;
  roomBreakdown: {
    roomId: string;
    roomName: string;
    occupiedNights: number;
    occupancyRate: number;
  }[];
}

export interface FinancialReport {
  period: string;
  revenue: number;
  expenses: number;
  profit: number;
  margin: number;
  adr: number;
  revpar: number;
  bookingsCount: number;
  channelBreakdown: {
    channel: RevenueChannel;
    revenue: number;
    bookings: number;
  }[];
  expenseBreakdown: {
    category: string;
    amount: number;
    percentage: number;
  }[];
}

// Search & Filters
export interface SearchParams {
  checkIn: string;
  checkOut: string;
  guests: number;
  roomType?: RoomType;
  minPrice?: number;
  maxPrice?: number;
  amenities?: string[];
}

export interface SearchResult {
  room: Room;
  availableUnits: number;
  totalPrice: number;
  pricePerNight: number;
}

// Notifications
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, unknown>;
  isRead: boolean;
  readAt?: string;
  createdAt: string;
}

export type NotificationType = 
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "payment_received"
  | "payment_failed"
  | "special_request"
  | "message_received"
  | "system";