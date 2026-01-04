import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import type { BookingWithDetails } from "./bookingService";
import type { Guest } from "@/types";

type Notification = Database["public"]["Tables"]["notifications"]["Row"];
type NotificationInsert = Database["public"]["Tables"]["notifications"]["Insert"];

export const notificationService = {
  // Get all notifications for current user
  async getAll(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Get unread notifications
  async getUnread(): Promise<Notification[]> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { data, error } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user.id)
      .eq("is_read", false)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create notification
  async create(notification: NotificationInsert): Promise<Notification> {
    const { data, error } = await supabase
      .from("notifications")
      .insert(notification)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Mark notification as read
  async markAsRead(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("id", id);

    if (error) throw error;
  },

  // Mark all as read
  async markAllAsRead(): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error("User not authenticated");

    const { error } = await supabase
      .from("notifications")
      .update({ 
        is_read: true, 
        read_at: new Date().toISOString() 
      })
      .eq("user_id", user.id)
      .eq("is_read", false);

    if (error) throw error;
  },

  // Delete notification
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("notifications")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Send booking confirmation notification
  async sendBookingConfirmation(booking: BookingWithDetails, guest: Guest): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await this.create({
      user_id: user.id,
      type: "booking_confirmed",
      title: "Reserva Confirmada",
      message: `A reserva ${booking.booking_number} de ${guest.full_name} foi confirmada.`,
      data: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        guest_name: guest.full_name,
      },
      is_read: false,
    });
  },

  // Send cancellation notification
  async sendCancellationNotification(booking: BookingWithDetails, guest: Guest): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await this.create({
      user_id: user.id,
      type: "booking_cancelled",
      title: "Reserva Cancelada",
      message: `A reserva ${booking.booking_number} de ${guest.full_name} foi cancelada.`,
      data: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        guest_name: guest.full_name,
      },
      is_read: false,
    });
  },

  // Send payment received notification
  async sendPaymentReceived(booking: BookingWithDetails, amount: number): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await this.create({
      user_id: user.id,
      type: "payment_received",
      title: "Pagamento Recebido",
      message: `Pagamento de €${amount.toFixed(2)} recebido para a reserva ${booking.booking_number}.`,
      data: {
        booking_id: booking.id,
        booking_number: booking.booking_number,
        amount,
      },
      is_read: false,
    });
  },

  // Send new message notification
  async sendNewMessage(guestName: string, conversationId: string): Promise<void> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await this.create({
      user_id: user.id,
      type: "message_received",
      title: "Nova Mensagem",
      message: `Nova mensagem de ${guestName}.`,
      data: {
        conversation_id: conversationId,
        guest_name: guestName,
      },
      is_read: false,
    });
  },

  // Subscribe to notifications
  subscribeToNotifications(callback: (notification: Notification) => void) {
    const channel = supabase.channel("notifications");

    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;

      channel
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "notifications",
            filter: `user_id=eq.${user.id}`,
          },
          (payload) => {
            callback(payload.new as Notification);
          }
        )
        .subscribe();
    });

    return channel;
  },
};