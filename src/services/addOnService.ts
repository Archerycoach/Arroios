import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type AddOn = Database["public"]["Tables"]["add_ons"]["Row"];
type AddOnInsert = Database["public"]["Tables"]["add_ons"]["Insert"];
type AddOnUpdate = Database["public"]["Tables"]["add_ons"]["Update"];

export interface AddOnWithBookings extends AddOn {
  booking_add_ons?: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
  }>;
}

export const addOnService = {
  // Get all add-ons
  async getAll(): Promise<AddOn[]> {
    const { data, error } = await supabase
      .from("add_ons")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get active add-ons only
  async getActive(): Promise<AddOn[]> {
    const { data, error } = await supabase
      .from("add_ons")
      .select("*")
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get add-ons by category
  async getByCategory(category: string): Promise<AddOn[]> {
    const { data, error } = await supabase
      .from("add_ons")
      .select("*")
      .eq("category", category)
      .eq("is_active", true)
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get add-on by ID
  async getById(id: string): Promise<AddOn> {
    const { data, error } = await supabase
      .from("add_ons")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create add-on
  async create(addOn: AddOnInsert): Promise<AddOn> {
    const { data, error } = await supabase
      .from("add_ons")
      .insert(addOn)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update add-on
  async update(id: string, updates: AddOnUpdate): Promise<AddOn> {
    const { data, error } = await supabase
      .from("add_ons")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete add-on
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("add_ons")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Calculate add-on total price
  calculatePrice(addOn: AddOn, quantity: number, nights?: number): number {
    let total = addOn.price * quantity;

    if (addOn.unit === "per_night" && nights) {
      total *= nights;
    }

    return total;
  },
};