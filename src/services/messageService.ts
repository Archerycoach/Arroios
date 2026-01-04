import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

// Define explicit interface to avoid deep type inference issues
export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  is_read: boolean | null;
  read_at: string | null;
  created_at: string;
}

type MessageInsert = Database["public"]["Tables"]["messages"]["Insert"];

export const messageService = {
  // Get messages for a conversation
  async getByConversationId(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from("messages")
      .select("*")
      .eq("conversation_id", conversationId)
      .order("created_at", { ascending: true });

    if (error) throw error;
    return (data as any) as Message[];
  },

  // Send a message
  async send(message: MessageInsert): Promise<Message> {
    const { data, error } = await supabase
      .from("messages")
      .insert(message)
      .select()
      .single();

    if (error) throw error;
    return (data as any) as Message;
  },

  // Mark message as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) throw error;
  },

  // Mark all messages in conversation as read
  async markConversationAsRead(conversationId: string): Promise<void> {
    const { error } = await supabase
      .from("messages")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("conversation_id", conversationId)
      .eq("is_read", false);

    if (error) throw error;
  },

  // Get unread messages count for a conversation
  async getUnreadCount(conversationId: string): Promise<number> {
    const { data, error } = await supabase
      .from("messages")
      .select("id", { count: "exact" })
      .eq("conversation_id", conversationId)
      .eq("is_read", false);

    if (error) throw error;
    return data?.length || 0;
  },

  // Subscribe to new messages in a conversation
  subscribeToConversation(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return supabase
      .channel(`conversation-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "messages",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          callback(payload.new as unknown as Message);
        }
      )
      .subscribe();
  },
};