import { supabase } from "@/integrations/supabase/client";
import { Guest } from "@/types";
import { sanitizeForDatabase } from "@/lib/dataUtils";

export const guestService = {
  // Get all guests
  async getAll(): Promise<Guest[]> {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data as Guest[];
  },

  // Get guest by ID
  async getById(id: string): Promise<Guest> {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as Guest;
  },

  // Get guest by email
  async getByEmail(email: string): Promise<Guest | null> {
    const { data, error } = await supabase
      .from("guests")
      .select("*")
      .eq("email", email)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // Not found
      throw error;
    }
    return data;
  },

  // Create guest
  async create(guestData: {
    email: string;
    full_name: string;
    phone?: string;
    address?: string;
    date_of_birth?: string;
    nationality?: string;
    tax_id?: string;
  }): Promise<Guest> {
    // Sanitize data: convert empty strings to null
    const sanitizedData = sanitizeForDatabase(guestData);
    
    const { data, error } = await supabase
      .from("guests")
      .insert([sanitizedData])
      .select()
      .single();

    if (error) throw error;
    return data as Guest;
  },

  // Update guest
  async update(
    id: string,
    updates: Partial<{
      email: string;
      full_name: string;
      phone: string;
      address: string;
      date_of_birth: string;
      nationality: string;
      tax_id: string;
    }>
  ): Promise<Guest> {
    // Sanitize data: convert empty strings to null
    const sanitizedUpdates = sanitizeForDatabase(updates);
    
    const { data, error } = await supabase
      .from("guests")
      .update(sanitizedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data as Guest;
  },

  // Find or create guest
  async findOrCreate(guestData: Omit<Guest, "id" | "created_at" | "updated_at">): Promise<Guest> {
    const existing = await guestService.getByEmail(guestData.email);
    if (existing) {
      return guestService.update(existing.id, guestData);
    }
    return guestService.create(guestData);
  },

  // Delete guest
  async delete(id: string): Promise<void> {
    const { error } = await supabase.from("guests").delete().eq("id", id);

    if (error) throw error;
  },
};