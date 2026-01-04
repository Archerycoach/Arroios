import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Conversation = Database["public"]["Tables"]["conversations"]["Row"];
type ConversationInsert = Database["public"]["Tables"]["conversations"]["Insert"];

export interface ConversationWithDetails extends Conversation {
  guests?: {
    full_name: string;
    email: string;
  };
  bookings?: {
    booking_number: string;
    rooms: {
      name: string;
      room_number: string;
    };
  };
}

export const conversationService = {
  // Get all conversations
  async getAll(): Promise<ConversationWithDetails[]> {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        guests (
          full_name,
          email
        ),
        bookings (
          booking_number,
          rooms (
            name,
            room_number
          )
        )
      `)
      .order("last_message_at", { ascending: false });

    if (error) throw error;
    return data as ConversationWithDetails[];
  },

  // Get conversations by guest
  async getByGuestId(guestId: string): Promise<ConversationWithDetails[]> {
    const { data, error } = await supabase
      .from("conversations")
      .select(`
        *,
        guests (
          full_name,
          email
        ),
        bookings (
          booking_number,
          rooms (
            name,
            room_number
          )
        )
      `)
      .eq("guest_id", guestId)
      .order("last_message_at", { ascending: false });

    if (error) throw error;
    return data as ConversationWithDetails[];
  },

  // Get conversation by booking
  async getByBookingId(bookingId: string): Promise<Conversation | null> {
    const { data, error } = await supabase
      .from("conversations")
      .select("*")
      .eq("booking_id", bookingId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null;
      throw error;
    }
    return data;
  },

  // Create conversation
  async create(conversation: ConversationInsert): Promise<Conversation> {
    const { data, error } = await supabase
      .from("conversations")
      .insert(conversation)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark conversation as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("conversations")
      .update({ unread_count: 0 })
      .eq("id", id);

    if (error) throw error;
  },

  // Get unread count
  async getUnreadCount(): Promise<number> {
    const { data, error } = await supabase
      .from("conversations")
      .select("unread_count");

    if (error) throw error;
    return data?.reduce((sum, conv) => sum + conv.unread_count, 0) || 0;
  },
};