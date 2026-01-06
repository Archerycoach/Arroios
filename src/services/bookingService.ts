import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { sanitizeForDatabase } from "@/lib/dataUtils";

type Booking = Database["public"]["Tables"]["bookings"]["Row"];
type BookingInsert = Database["public"]["Tables"]["bookings"]["Insert"];
type BookingUpdate = Database["public"]["Tables"]["bookings"]["Update"];

// Extend Booking with joined relations - using actual DB column names
export interface BookingWithDetails extends Booking {
  guest: {
    id: string;
    full_name: string;
    email: string;
    phone?: string | null;
  };
  room: {
    id: string;
    name: string;
    type: string;
    room_number?: string | null;
    base_price: number;
    images?: string[];
  };
}

export interface CreateBookingData {
  guest_id: string;
  room_id: string;
  check_in_date: string;
  check_out_date: string;
  total_price: number;
  status: "pending" | "confirmed" | "checked_in" | "checked_out" | "cancelled";
  notes?: string | null;
}

export const bookingService = {
  // Get all bookings with details
  async getAll(): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (
          id,
          name,
          room_type,
          base_price,
          room_number
        ),
        guests (
          id,
          full_name,
          email,
          phone
        )
      `)
      .order("created_at", { ascending: false });

    if (error) throw error;
    
    // Map DB columns to frontend interface
    const bookings: BookingWithDetails[] = (data || []).map((b) => ({
      ...b,
      guest: {
        id: b.guests?.id || "",
        full_name: b.guests?.full_name || "",
        email: b.guests?.email || "",
        phone: b.guests?.phone,
      },
      room: {
        id: b.rooms?.id || "",
        name: b.rooms?.name || "",
        type: b.rooms?.room_type || "", // Map room_type to type
        room_number: b.rooms?.room_number,
        base_price: b.rooms?.base_price || 0,
      },
    })) as unknown as BookingWithDetails[];
    return bookings;
  },

  // Get bookings by guest ID
  async getByGuestId(guestId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms (
          name,
          room_type,
          base_price
        ),
        guests (
          full_name,
          email,
          phone
        )
      `)
      .eq("guest_id", guestId)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as any as BookingWithDetails[];
  },

  // Get booking by ID
  async getById(id: string): Promise<BookingWithDetails> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms!bookings_room_id_fkey (
          name,
          room_type,
          base_price,
          images
        ),
        guests!bookings_guest_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;
    if (!data) throw new Error("Booking not found");

    return {
      ...data,
      rooms: data.rooms ? {
        ...data.rooms,
        images: Array.isArray(data.rooms.images) 
          ? (data.rooms.images as string[]).map(String) 
          : []
      } : undefined,
      guests: data.guests
    } as any as BookingWithDetails;
  },

  // Get bookings by user
  async getByUserId(userId: string): Promise<BookingWithDetails[]> {
    const { data, error } = await supabase
      .from("bookings")
      .select(`
        *,
        rooms!bookings_room_id_fkey (
          name,
          room_type,
          base_price,
          images
        ),
        guests!bookings_guest_id_fkey (
          full_name,
          email,
          phone
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return (data || []).map(booking => ({
      ...booking,
      rooms: booking.rooms ? {
        ...booking.rooms,
        images: Array.isArray(booking.rooms.images) 
          ? (booking.rooms.images as string[]).map(String) 
          : []
      } : undefined,
      guests: booking.guests
    })) as any as BookingWithDetails[];
  },

  // Create booking
  async create(booking: BookingInsert) {
    // Sanitize data: convert empty strings to null
    const sanitizedBooking = sanitizeForDatabase(booking);
    
    const { data, error } = await supabase
      .from("bookings")
      .insert(sanitizedBooking)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update booking
  async update(id: string, updates: Partial<Booking>) {
    // Sanitize data: convert empty strings to null
    const sanitizedUpdates = sanitizeForDatabase(updates);
    
    const { data, error } = await supabase
      .from("bookings")
      .update(sanitizedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update booking status
  async updateStatus(id: string, status: "pending" | "confirmed" | "paid" | "completed" | "cancelled"): Promise<void> {
    const { error } = await supabase
      .from("bookings")
      .update({ status })
      .eq("id", id);

    if (error) throw error;
  },

  // Delete booking
  async delete(id: string) {
    const { error } = await supabase
      .from("bookings")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Calculate best price based on duration - SIMPLIFIED
  calculateBestPrice(
    room: { monthly_price: number; biweekly_price?: number | null; base_price?: number },
    nights: number
  ): { totalPrice: number; priceType: "biweekly" | "monthly" | "daily"; breakdown: string } {
    const monthlyPrice = room.monthly_price || room.base_price || 0;
    const biweeklyPrice = room.biweekly_price || (monthlyPrice / 2);

    if (monthlyPrice === 0) {
      throw new Error("Preço mensal não definido para este quarto");
    }

    // For stays less than 15 days, count complete biweekly periods (usually 0)
    if (nights < 15) {
      const quinzenasCompletas = Math.floor(nights / 15);
      const totalPrice = quinzenasCompletas * biweeklyPrice;
      return {
        totalPrice,
        priceType: "daily",
        breakdown: `${nights} dia${nights !== 1 ? 's' : ''} ÷ 15 = ${quinzenasCompletas} quinzenas completas × €${biweeklyPrice.toFixed(2)}`,
      };
    }

    // For stays 15-29 days, count complete biweekly periods
    if (nights >= 15 && nights < 30) {
      const quinzenasCompletas = Math.floor(nights / 15);
      const totalPrice = quinzenasCompletas * biweeklyPrice;
      return {
        totalPrice,
        priceType: "biweekly",
        breakdown: `${nights} dias ÷ 15 = ${quinzenasCompletas} quinzenas completas × €${biweeklyPrice.toFixed(2)}`,
      };
    }

    // For stays 30+ days, count complete months
    const mesesCompletos = Math.floor(nights / 30);
    const totalPrice = mesesCompletos * monthlyPrice;

    return {
      totalPrice,
      priceType: "monthly",
      breakdown: `${nights} dias ÷ 30 = ${mesesCompletos} meses completos × €${monthlyPrice.toFixed(2)}`,
    };
  },

  // Calculate booking totals with intelligent pricing
  calculateTotals(
    room: { monthly_price: number; biweekly_price?: number | null; base_price?: number },
    nights: number,
    addOns: { price: number; quantity: number }[] = []
  ): {
    subtotal: number;
    priceBreakdown: string;
    priceType: string;
    addOnsTotal: number;
    taxAmount: number;
    cleaningFee: number;
    total: number;
  } {
    const { totalPrice, priceType, breakdown } = this.calculateBestPrice(room, nights);
    
    const addOnsTotal = addOns.reduce((sum, addon) => sum + addon.price * addon.quantity, 0);
    const cleaningFee = 25;
    const taxRate = 0.06;
    const taxAmount = (totalPrice + addOnsTotal) * taxRate;
    const total = totalPrice + addOnsTotal + cleaningFee + taxAmount;

    return {
      subtotal: totalPrice,
      priceBreakdown: breakdown,
      priceType,
      addOnsTotal,
      taxAmount,
      cleaningFee,
      total,
    };
  },
};