import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PaymentWithDetails } from "@/types";

// Update to use 'payments' table instead of 'booking_payments'
type BookingPayment = Database["public"]["Tables"]["payments"]["Row"];
type PaymentMethod = "credit_card" | "debit_card" | "cash" | "bank_transfer" | "mbway" | "check" | "other";

export const paymentService = {
  /**
   * Generate monthly payments for a booking
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

      // Add security deposit if requested (due on check-in date)
      if (includeDeposit && depositAmount > 0) {
        payments.push({
          booking_id: bookingId,
          amount: depositAmount,
          due_date: baseDate.toISOString(),
          payment_type: "deposit",
          status: "pending",
          bank_account_id: bankAccountId,
          payment_method: "bank_transfer",
        });
      }

      // Generate monthly payments (each due 30 days apart)
      for (let i = 0; i < numberOfInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + (i * 30)); // Each payment due every 30 days

        payments.push({
          booking_id: bookingId,
          amount: monthlyAmount,
          due_date: dueDate.toISOString(),
          payment_type: "monthly",
          status: "pending",
          bank_account_id: bankAccountId,
          payment_method: "bank_transfer",
        });
      }

      const { error: insertError } = await supabase
        .from("payments")
        .insert(payments as any);

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
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .order("due_date", { ascending: true });

      if (error) throw error;
      return data as BookingPayment[];
    } catch (error) {
      console.error("Error fetching payments:", error);
      return [];
    }
  },

  /**
   * Mark a payment as paid
   */
  async markPaymentAsPaid(
    paymentId: string,
    paidDate: string,
    paymentMethod: string,
    notes?: string,
    bankAccountId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from("payments")
        .update({
          status: "completed",
          paid_at: paidDate,
          payment_method: paymentMethod as any,
          notes: notes,
          bank_account_id: bankAccountId,
          updated_at: new Date().toISOString(),
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

  // Alias for compatibility
  async getByBookingId(bookingId: string) {
    return this.getBookingPayments(bookingId);
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
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("payment_type", "deposit")
        .single();

      if (fetchError) throw fetchError;
      if (!depositPayment) {
        return { success: false, error: "Deposit payment not found" };
      }

      // Convert date string to ISO timestamp
      const refundTimestamp = new Date(refundDate).toISOString();

      // Mark deposit as refunded
      const { error: updateError } = await supabase
        .from("payments")
        .update({
          status: "refunded",
          paid_at: refundTimestamp,
          payment_method: refundMethod as any,
          notes: notes || "Caução devolvida",
        })
        .eq("id", depositPayment.id);

      if (updateError) throw updateError;

      // Create refund record
      const { error: insertError } = await supabase
        .from("payments")
        .insert({
          booking_id: bookingId,
          payment_type: "deposit_refund",
          amount: -depositPayment.amount,
          due_date: refundDate,
          paid_at: refundTimestamp,
          status: "completed",
          payment_method: refundMethod as any,
          notes: notes || "Devolução de caução",
          bank_account_id: depositPayment.bank_account_id,
        } as any);

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
        .from("payments")
        .select(
          `
          *,
          booking:bookings!payments_booking_id_fkey (
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
    depositStatus: "pending" | "completed" | "refunded" | null;
  }> {
    try {
      const payments = await this.getBookingPayments(bookingId);

      const total = payments.reduce((sum, p) => sum + p.amount, 0);
      const paid = payments
        .filter((p) => p.status === "completed" && p.paid_at)
        .reduce((sum, p) => sum + p.amount, 0);
      const pending = payments
        .filter((p) => p.status === "pending")
        .reduce((sum, p) => sum + p.amount, 0);

      const deposit = payments.find((p) => p.payment_type === "deposit");
      const depositStatus = deposit?.status as "pending" | "completed" | "refunded" | null || null;

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
        .from("payments")
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
        .from("payments")
        .select(
          `
          *,
          booking:bookings!payments_booking_id_fkey (
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
        .from("payments")
        .select(
          `
          *,
          booking:bookings!payments_booking_id_fkey (
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
        .from("payments")
        .select(
          `
          *,
          booking:bookings!payments_booking_id_fkey (
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
            email,
            tax_id
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