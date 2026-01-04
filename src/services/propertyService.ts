import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Property = Database["public"]["Tables"]["properties"]["Row"];
type PropertyInsert = Database["public"]["Tables"]["properties"]["Insert"];
type PropertyUpdate = Database["public"]["Tables"]["properties"]["Update"];

export const propertyService = {
  // Get all properties
  async getAll(): Promise<Property[]> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Get property by ID
  async getById(id: string): Promise<Property | null> {
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create property
  async create(property: PropertyInsert): Promise<Property> {
    const { data, error } = await supabase
      .from("properties")
      .insert(property)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update property
  async update(id: string, updates: PropertyUpdate): Promise<Property> {
    const { data, error } = await supabase
      .from("properties")
      .update(updates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete property
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("properties")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },
};