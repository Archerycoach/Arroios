import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { PaymentWithDetails } from "@/types";
import { extraRevenueService } from "./extraRevenueService";

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
      // First, get the payment details to create revenue
      const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select(`
          *,
          bookings!inner (
            id,
            booking_number,
            room_id,
            rooms!inner (
              name,
              room_number
            )
          )
        `)
        .eq("id", paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment status
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

      // Create revenue entry automatically
      const booking = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings;
      const room = booking?.rooms;
      
      const paymentTypeLabel = payment.payment_type === "deposit" 
        ? "Caução" 
        : payment.payment_type === "monthly" 
        ? "Mensalidade" 
        : "Pagamento";

      const description = `${paymentTypeLabel} - Reserva #${booking?.booking_number || payment.booking_id} - ${room?.name || ''} (Quarto ${room?.room_number || ''})`;

      // Create the revenue record
      await extraRevenueService.create({
        booking_id: payment.booking_id,
        amount: payment.amount,
        date: paidDate,
        type: payment.payment_type === "deposit" ? "Cauções" : "Mensalidades",
        description: description,
        payment_method: paymentMethod,
        bank_account_id: bankAccountId || null,
        notes: notes || null,
      });

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

  /**
   * Update pending payment amounts for a booking (when monthly value changes)
   */
  async updatePendingPaymentAmounts(
    bookingId: string,
    newMonthlyAmount: number
  ): Promise<{ success: boolean; updated: number; error?: string }> {
    try {
      // Get all pending monthly payments for this booking
      const { data: pendingPayments, error: fetchError } = await supabase
        .from("payments")
        .select("*")
        .eq("booking_id", bookingId)
        .eq("status", "pending")
        .eq("payment_type", "monthly")
        .order("due_date", { ascending: true });

      if (fetchError) throw fetchError;

      if (!pendingPayments || pendingPayments.length === 0) {
        return { success: true, updated: 0 };
      }

      // Update each pending payment with the new amount
      let updated = 0;
      for (const payment of pendingPayments) {
        const { error: updateError } = await supabase
          .from("payments")
          .update({
            amount: newMonthlyAmount,
            updated_at: new Date().toISOString(),
          })
          .eq("id", payment.id);

        if (updateError) {
          console.error(`Error updating payment ${payment.id}:`, updateError);
        } else {
          updated++;
        }
      }

      return { success: true, updated };
    } catch (error) {
      console.error("Error updating pending payment amounts:", error);
      return {
        success: false,
        updated: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Regenerate pending payments when booking dates/amounts change
   * Deletes all pending payments and creates new ones based on updated booking details
   */
  async regeneratePendingPayments(
    bookingId: string,
    monthlyAmount: number,
    numberOfInstallments: number,
    checkInDate: string,
    depositAmount?: number
  ): Promise<{ success: boolean; regenerated: number; error?: string }> {
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

      // Delete all pending payments (keep completed/refunded ones)
      const { error: deleteError } = await supabase
        .from("payments")
        .delete()
        .eq("booking_id", bookingId)
        .eq("status", "pending");

      if (deleteError) throw deleteError;

      // Generate new pending payments
      const baseDate = new Date(checkInDate);
      const payments = [];

      // Add security deposit if provided and amount > 0
      if (depositAmount && depositAmount > 0) {
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

      // Generate monthly payments using the provided numberOfInstallments
      console.log(`Generating ${numberOfInstallments} installments of €${monthlyAmount} each`);
      
      for (let i = 0; i < numberOfInstallments; i++) {
        const dueDate = new Date(baseDate);
        dueDate.setDate(dueDate.getDate() + (i * 30));

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

      return { success: true, regenerated: payments.length };
    } catch (error) {
      console.error("Error regenerating pending payments:", error);
      return {
        success: false,
        regenerated: 0,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },

  /**
   * Migrate existing completed payments to revenues
   */
  async syncPaymentsToRevenues(): Promise<{
    success: boolean;
    message: string;
    synced: number;
    skipped: number;
    errors: number;
  }> {
    let synced = 0;
    let skipped = 0;
    let errors = 0;

    try {
      // 1. Fetch all completed payments
      const { data: payments, error: fetchError } = await supabase
        .from("payments")
        .select(`
          *,
          bookings!inner (
            id,
            booking_number,
            room_id,
            rooms!inner (
              name,
              room_number
            )
          )
        `)
        .eq("status", "completed");

      if (fetchError) throw fetchError;

      // 2. Fetch all existing revenues to avoid duplicates
      // We'll match by booking_id, amount and date (approximate)
      const { data: existingRevenues } = await supabase
        .from("extra_revenues")
        .select("booking_id, amount, date, type");

      // 3. Process each payment
      for (const payment of payments || []) {
        try {
          // Check if already exists
          const exists = existingRevenues?.some(
            (rev) =>
              rev.booking_id === payment.booking_id &&
              Math.abs(rev.amount - payment.amount) < 0.01 && // Compare amounts with tolerance
              rev.date === payment.paid_at?.split("T")[0] // Compare date part
          );

          if (exists) {
            skipped++;
            continue;
          }

          const booking = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings;
          const room = booking?.rooms;

          const paymentTypeLabel = payment.payment_type === "deposit"
            ? "Caução"
            : payment.payment_type === "monthly"
            ? "Mensalidade"
            : "Pagamento";

          const description = `${paymentTypeLabel} - Reserva #${booking?.booking_number || payment.booking_id} - ${room?.name || ""} (Quarto ${room?.room_number || ""})`;

          // Create the revenue record
          await extraRevenueService.create({
            booking_id: payment.booking_id,
            amount: payment.amount,
            date: payment.paid_at || new Date().toISOString(),
            type: payment.payment_type === "deposit" ? "Cauções" : "Mensalidades",
            description: description,
            payment_method: payment.payment_method,
            bank_account_id: payment.bank_account_id || null,
            notes: payment.notes || null,
          });

          synced++;
        } catch (err) {
          console.error(`Error syncing payment ${payment.id}:`, err);
          errors++;
        }
      }

      return {
        success: true,
        message: "Sincronização concluída com sucesso",
        synced,
        skipped,
        errors,
      };
    } catch (error) {
      console.error("Error syncing payments to revenues:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        synced,
        skipped,
        errors,
      };
    }
  },

  /**
   * Update a completed payment
   */
  async updatePayment(
    paymentId: string,
    newAmount: number,
    newStatus: "completed" | "refunded" | "pending",
    newPaidDate?: string,
    newPaymentMethod?: string,
    newNotes?: string,
    newBankAccountId?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, get the payment details to create revenue
      const { data: payment, error: fetchError } = await supabase
        .from("payments")
        .select(`
          *,
          bookings!inner (
            id,
            booking_number,
            room_id,
            rooms!inner (
              name,
              room_number
            )
          )
        `)
        .eq("id", paymentId)
        .single();

      if (fetchError) throw fetchError;

      // Update payment status
      const { error } = await supabase
        .from("payments")
        .update({
          amount: newAmount,
          status: newStatus,
          paid_at: newPaidDate ? new Date(newPaidDate).toISOString() : undefined,
          payment_method: newPaymentMethod as any,
          notes: newNotes,
          bank_account_id: newBankAccountId,
          updated_at: new Date().toISOString(),
        })
        .eq("id", paymentId);

      if (error) throw error;

      // Update revenue entry if it exists
      // Check if there's a revenue for this payment
      const { data: revenues } = await supabase
        .from("extra_revenues")
        .select("id")
        .eq("booking_id", payment.booking_id)
        .eq("amount", payment.amount) // Try to match by old amount
        .order("created_at", { ascending: false })
        .limit(1);

      if (revenues && revenues.length > 0) {
        // Update existing revenue
        await extraRevenueService.update(revenues[0].id, {
          amount: newAmount,
          date: newPaidDate || new Date().toISOString(),
          payment_method: newPaymentMethod || payment.payment_method,
          bank_account_id: newBankAccountId || null,
          notes: newNotes || null,
        });
      } else if (newStatus === "completed") {
        // Create new revenue if not found and status is completed
        const booking = Array.isArray(payment.bookings) ? payment.bookings[0] : payment.bookings;
        const room = booking?.rooms;
        
        const paymentTypeLabel = payment.payment_type === "deposit" 
          ? "Caução" 
          : payment.payment_type === "monthly" 
          ? "Mensalidade" 
          : "Pagamento";

        const description = `${paymentTypeLabel} - Reserva #${booking?.booking_number || payment.booking_id} - ${room?.name || ''} (Quarto ${room?.room_number || ''})`;

        await extraRevenueService.create({
          booking_id: payment.booking_id,
          amount: newAmount,
          date: newPaidDate || new Date().toISOString(),
          type: payment.payment_type === "deposit" ? "Cauções" : "Mensalidades",
          description: description,
          payment_method: newPaymentMethod || payment.payment_method,
          bank_account_id: newBankAccountId || null,
          notes: newNotes || null,
        });
      }

      return { success: true };
    } catch (error) {
      console.error("Error updating payment:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  },
};