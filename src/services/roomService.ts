import { supabase } from "@/integrations/supabase/client";
import { Room, RoomType, RentalType } from "@/types";
import { sanitizeForDatabase } from "@/lib/dataUtils";

export interface RoomWithProperty extends Room {
  property?: {
    name: string;
  };
}

export const roomService = {
  // Get all rooms
  async getAll(): Promise<RoomWithProperty[]> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("room_number", { ascending: true });

    if (error) throw error;
    return data as RoomWithProperty[];
  },

  // Get available rooms
  async getAvailable(): Promise<RoomWithProperty[]> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("is_available", true)
      .order("room_number", { ascending: true });

    if (error) throw error;
    return data as RoomWithProperty[];
  },

  // Get room by ID
  async getById(id: string): Promise<RoomWithProperty> {
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data as RoomWithProperty;
  },

  // Create room
  async create(roomData: {
    property_id: string;
    name: string;
    description?: string;
    room_number: string;
    room_type: RoomType;
    max_guests: number;
    base_price: number;
    daily_price: number;
    biweekly_price?: number | null;
    monthly_price?: number | null;
    rental_type?: RentalType;
    minimum_nights?: number;
    floor: number;
    images?: string[];
    amenities?: string[];
    is_available: boolean;
  }): Promise<Room> {
    // Sanitize data: convert empty strings to null
    const sanitizedData = sanitizeForDatabase(roomData);
    
    const { data, error } = await supabase
      .from("rooms")
      .insert(sanitizedData as any)
      .select()
      .single();

    if (error) throw error;
    return data as Room;
  },

  // Update room
  async update(id: string, updates: Partial<Room>): Promise<Room> {
    // Sanitize data: convert empty strings to null
    const sanitizedUpdates = sanitizeForDatabase(updates);
    
    // Use RETURNING * implicitly (no separate SELECT needed)
    const { data, error } = await supabase
      .from("rooms")
      .update(sanitizedUpdates as any)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("Update error:", error);
      throw error;
    }
    
    if (!data) {
      throw new Error(`Room with id ${id} not found after update`);
    }
    
    return data as Room;
  },

  // Delete room
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("rooms")
      .delete() // Actually delete row
      .eq("id", id);

    if (error) throw error;
  }
};