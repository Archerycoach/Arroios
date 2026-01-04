import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BookingAddOn = Database["public"]["Tables"]["booking_add_ons"]["Row"];
type BookingAddOnInsert = Database["public"]["Tables"]["booking_add_ons"]["Insert"];

export interface BookingAddOnWithDetails extends BookingAddOn {
  add_ons?: {
    id: string;
    name: string;
    description: string;
    category: string;
    price: number;
    unit: string;
  };
}

export const bookingAddOnService = {
  // Get add-ons for a booking
  async getByBookingId(bookingId: string): Promise<BookingAddOnWithDetails[]> {
    const { data, error } = await supabase
      .from("booking_add_ons")
      .select(`
        *,
        add_ons (
          id,
          name,
          description,
          category,
          price,
          unit
        )
      `)
      .eq("booking_id", bookingId);

    if (error) throw error;
    return data as BookingAddOnWithDetails[];
  },

  // Add add-on to booking
  async addToBooking(bookingAddOn: BookingAddOnInsert): Promise<BookingAddOn> {
    const { data, error } = await supabase
      .from("booking_add_ons")
      .insert(bookingAddOn)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update booking add-on quantity
  async updateQuantity(id: string, quantity: number, totalPrice: number): Promise<BookingAddOn> {
    const { data, error } = await supabase
      .from("booking_add_ons")
      .update({ quantity, total_price: totalPrice })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Remove add-on from booking
  async removeFromBooking(id: string): Promise<void> {
    const { error } = await supabase
      .from("booking_add_ons")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Calculate total add-ons cost for a booking
  async calculateTotal(bookingId: string): Promise<number> {
    const addOns = await this.getByBookingId(bookingId);
    return addOns.reduce((sum, item) => sum + item.total_price, 0);
  },
};