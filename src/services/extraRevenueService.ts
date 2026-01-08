import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { sanitizeForDatabase } from "@/lib/dataUtils";

type ExtraRevenue = Database["public"]["Tables"]["extra_revenues"]["Row"];
type ExtraRevenueInsert = Database["public"]["Tables"]["extra_revenues"]["Insert"];
type ExtraRevenueUpdate = Database["public"]["Tables"]["extra_revenues"]["Update"];

export interface ExtraRevenueWithDetails extends ExtraRevenue {
  bookings?: {
    booking_number: string;
    rooms: {
      name: string;
      room_number: string;
    };
  };
}

export const extraRevenueService = {
  // Get all extra revenues
  async getAll(): Promise<ExtraRevenueWithDetails[]> {
    const { data, error } = await supabase
      .from("extra_revenues")
      .select(`
        *,
        bookings (
          booking_number,
          rooms (
            name,
            room_number
          )
        )
      `)
      .order("date", { ascending: false });

    if (error) throw error;
    return data as ExtraRevenueWithDetails[];
  },

  // Get extra revenues by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ExtraRevenueWithDetails[]> {
    const { data, error } = await supabase
      .from("extra_revenues")
      .select(`
        *,
        bookings (
          booking_number,
          rooms (
            name,
            room_number
          )
        )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return data as ExtraRevenueWithDetails[];
  },

  // Get extra revenues by booking
  async getByBookingId(bookingId: string): Promise<ExtraRevenue[]> {
    const { data, error } = await supabase
      .from("extra_revenues")
      .select("*")
      .eq("booking_id", bookingId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create extra revenue
  async create(revenue: ExtraRevenueInsert): Promise<ExtraRevenue> {
    // Sanitize data: convert empty strings to null
    const sanitizedRevenue = sanitizeForDatabase(revenue);
    
    const { data, error } = await supabase
      .from("extra_revenues")
      .insert(sanitizedRevenue)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update extra revenue
  async update(id: string, updates: ExtraRevenueUpdate): Promise<ExtraRevenue> {
    // Sanitize data: convert empty strings to null
    const sanitizedUpdates = sanitizeForDatabase(updates);
    
    const { data, error } = await supabase
      .from("extra_revenues")
      .update(sanitizedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete extra revenue
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("extra_revenues")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Calculate total extra revenues for a period
  async getTotalByDateRange(startDate: string, endDate: string): Promise<number> {
    const revenues = await this.getByDateRange(startDate, endDate);
    return revenues.reduce((sum, revenue) => sum + revenue.amount, 0);
  },

  // Get revenues by category
  async getTotalsByCategory(startDate: string, endDate: string): Promise<Record<string, number>> {
    const revenues = await this.getByDateRange(startDate, endDate);
    const totals: Record<string, number> = {};

    revenues.forEach((revenue) => {
      const category = revenue.type || "Outros";
      totals[category] = (totals[category] || 0) + revenue.amount;
    });

    return totals;
  },
};