import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PaymentWithDetails } from "@/types";

type BookingPayment = Database["public"]["Tables"]["booking_payments"]["Row"];
type BookingPaymentInsert = Database["public"]["Tables"]["booking_payments"]["Insert"];

export const paymentService = {
  /**
   * Generate monthly payments for a booking
   * Creates monthly payments + optional security deposit
   */
  async generatePaymentsForBooking(
    bookingId: string,
    monthlyAmount: number,
    numberOfInstallments: number,
    checkInDate: string,
    includeDeposit: boolean = true,
    depositAmount: number = 0
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Get booking details to fetch room's bank account
      const { data: booking, error: bookingError } = await supabase
        .from("bookings")
        .select(`
          *,
          rooms!inner (
            bank_account_id
          )
        `)
        .eq("id", bookingId)
        .single();

      if (bookingError) throw bookingError;

      const bankAccountId = booking.rooms?.bank_account_id || null;
      const baseDate = new Date(checkInDate);
      const payments = [];

      // Generate monthly payments
      for (let i = 0; i < numberOfInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        payments.push({
          booking_id: bookingId,
          amount: monthlyAmount,
          due_date: dueDate.toISOString(),
          payment_type: "monthly" as const,
          status: "pending" as const,
          bank_account_id: bankAccountId,
        });
      }

      // Add security deposit if requested
      if (includeDeposit && depositAmount > 0) {
        payments.push({
          booking_id: bookingId,
          amount: depositAmount,
          due_date: baseDate.toISOString(),
          payment_type: "deposit" as const,
          status: "pending" as const,
          bank_account_id: bankAccountId,
        });
      }

      const { error: insertError } = await supabase
        .from("payments")
        .insert(payments);

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      console.error("Error generating payments:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get all payments for a booking
   */
  async getBookingPayments(bookingId: string): Promise<BookingPayment[]> {
    try {
      const { data, error } = await supabase
        .from("booking_payments")
        .select("*")
        .eq("booking_id", bookingId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  },

  /**
   * Mark payment as paid
   */
  async markPaymentAsPaid(
    paymentId: string,
    paidDate: string,
    paymentMethod: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("booking_payments")
        .update({
          status: "paid",
          paid_date: paidDate,
          payment_method: paymentMethod,
          notes: notes || null,
        })
        .eq("id", paymentId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error marking payment as paid:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Refund security deposit
   */
  async refundDeposit(
    bookingId: string,
    refundDate: string,
    refundMethod: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // Find the deposit payment
      const { data: depositPayment, error: fetchError } = await supabase
        .from("booking_payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("payment_type", "deposit")
        .single();

      if (fetchError) throw fetchError;
      if (!depositPayment) {
        return { success: false, error: "Deposit payment not found" };
      }

      // Mark deposit as refunded
      const { error: updateError } = await supabase
        .from("booking_payments")
        .update({
          status: "refunded",
          paid_date: refundDate,
          payment_method: refundMethod,
          notes: notes || "Caução devolvida",
        })
        .eq("id", depositPayment.id);

      if (updateError) throw updateError;

      // Create refund record
      const { error: insertError } = await supabase
        .from("booking_payments")
        .insert({
          booking_id: bookingId,
          payment_type: "deposit_refund",
          amount: -depositPayment.amount, // Negative amount for refund
          due_date: refundDate,
          paid_date: refundDate,
          status: "paid",
          payment_method: refundMethod,
          notes: notes || "Devolução de caução",
        });

      if (insertError) throw insertError;

      return { success: true };
    } catch (error) {
      console.error("Error refunding deposit:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get pending payments across all bookings
   */
  async getPendingPayments(): Promise<
    Array<BookingPayment & { booking?: any; guest?: any; room?: any }>
  > {
    try {
      const { data, error } = await supabase
        .from("booking_payments")
        .select(
          `
          *,
          booking:bookings!booking_payments_booking_id_fkey (
            id,
            check_in_date,
            check_out_date,
            guest:guests!bookings_guest_id_fkey (
              id,
              full_name,
              email
            ),
            room:rooms!bookings_room_id_fkey (
              id,
              name
            )
          )
        `
        )
        .eq("status", "pending")
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching pending payments:", error);
      return [];
    }
  },

  /**
   * Get payment statistics for a booking
   */
  async getPaymentStats(bookingId: string): Promise<{
    total: number;
    paid: number;
    pending: number;
    depositStatus: "pending" | "paid" | "refunded" | null;
  }> {
    try {
      const payments = await this.getBookingPayments(bookingId);

      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      const paid = payments
        .filter((p) => p.status === "paid")
        .reduce((sum, p) => sum + p.amount, 0);
      const pending = payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

      const deposit = payments.find((p) => p.payment_type === "deposit");
      const depositStatus = deposit?.status || null;

      return { total, paid, pending, depositStatus };
    } catch (error) {
      console.error("Error calculating payment stats:", error);
      return { total: 0, paid: 0, pending: 0, depositStatus: null };
    }
  },

  /**
   * Delete all payments for a booking (when deleting booking)
   */
  async deleteBookingPayments(bookingId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("booking_payments")
        .delete()
        .eq("booking_id", bookingId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error("Error deleting payments:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Get payments for a specific month (for export)
   */
  async getPaymentsByMonth(year: number, month: number): Promise<Array<BookingPayment & { booking?: any; guest?: any; room?: any }>> {
    try {
      const startDate = new Date(year, month - 1, 1).toISOString().split("T")[0];
      const endDate = new Date(year, month, 0).toISOString().split("T")[0];

      const { data, error } = await supabase
        .from("booking_payments")
        .select(
          `
          *,
          booking:bookings!booking_payments_booking_id_fkey (
            id,
            check_in_date,
            check_out_date,
            guest:guests!bookings_guest_id_fkey (
              id,
              full_name,
              email,
              phone
            ),
            room:rooms!bookings_room_id_fkey (
              id,
              name,
              room_number
            )
          )
        `
        )
        .gte("due_date", startDate)
        .lte("due_date", endDate)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching payments by month:", error);
      return [];
    }
  },

  /**
   * Get payments for a specific room (with booking and guest details)
   */
  async getPaymentsByRoom(roomId: string) {
    try {
      const { data, error } = await supabase
        .from("booking_payments")
        .select(
          `
          *,
          booking:bookings!booking_payments_booking_id_fkey (
            id,
            room:rooms!bookings_room_id_fkey (
              room_number,
              name
            ),
            guest:guests!bookings_guest_id_fkey (
              full_name,
              email,
              tax_id
            )
          )
        `
        )
        .eq("booking.room_id", roomId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching payments by room:", error);
      return [];
    }
  },

  /**
   * Get all payments with complete details (booking, room, guest)
   */
  async getAllPaymentsWithDetails() {
    try {
      const { data, error } = await supabase
        .from("booking_payments")
        .select(
          `
          *,
          booking:bookings!booking_payments_booking_id_fkey (
            id,
            room:rooms!bookings_room_id_fkey (
              room_number,
              name
            ),
            guest:guests!bookings_guest_id_fkey (
              full_name,
              email,
              tax_id
            )
          )
        `
        )
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching all payments with details:", error);
      return [];
    }
  },

  async getAll(): Promise<PaymentWithDetails[]> {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        bookings!inner (
          id,
          booking_number,
          check_in_date,
          check_out_date,
          guests!inner (
            id,
            full_name,
            email
          ),
          rooms!inner (
            id,
            name,
            room_number,
            room_type
          )
        ),
        bank_accounts (
          id,
          name,
          bank_name,
          iban
        )
      `)
      .order("due_date", { ascending: true });

    if (error) throw error;

    return (data || []).map((payment) => ({
      ...payment,
      bookings: Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings,
      bank_accounts: Array.isArray(payment.bank_accounts) ? payment.bank_accounts[0] : payment.bank_accounts,
      // Ensure payment_type is treated as string if missing in types but present in DB
      payment_type: (payment as any).payment_type || "other",
    })) as unknown as PaymentWithDetails[];
  },

  async getById(id: string): Promise<PaymentWithDetails | null> {
    const { data, error } = await supabase
      .from("payments")
      .select(`
        *,
        bookings!inner (
          id,
          booking_number,
          check_in_date,
          check_out_date,
          guests!inner (
            id,
            full_name,
            email
          ),
          rooms!inner (
            id,
            name,
            room_number,
            room_type
          )
        ),
        bank_accounts (
          id,
          name,
          bank_name,
          iban
        )
      `)
      .eq("id", id)
      .single();

    if (error) throw error;

    if (!data) return null;

    return {
      ...data,
      bookings: Array.isArray(data.bookings) ? data.bookings[0] : data.bookings,
      bank_accounts: Array.isArray(data.bank_accounts) ? data.bank_accounts[0] : data.bank_accounts,
      // Ensure payment_type is treated as string if missing in types but present in DB
      payment_type: (data as any).payment_type || "other",
    } as unknown as PaymentWithDetails;
  },
};