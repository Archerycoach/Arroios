import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";
import { sanitizeForDatabase } from "@/lib/dataUtils";

type Expense = Database["public"]["Tables"]["expenses"]["Row"];
type ExpenseInsert = Database["public"]["Tables"]["expenses"]["Insert"];
type ExpenseUpdate = Database["public"]["Tables"]["expenses"]["Update"];
type ExpenseCategory = Database["public"]["Tables"]["expense_categories"]["Row"];

export interface ExpenseWithCategory extends Expense {
  expense_categories?: {
    name: string;
    color: string;
  };
}

export const expenseService = {
  // Get all expenses
  async getAll(): Promise<Expense[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        expense_categories!expenses_category_id_fkey (
          name,
          color
        )
      `)
      .order("date", { ascending: false }); // Correct: database column is named 'date'

    if (error) throw error;
    return data || [];
  },

  // Get expenses by date range
  async getByDateRange(startDate: string, endDate: string): Promise<ExpenseWithCategory[]> {
    const { data, error } = await supabase
      .from("expenses")
      .select(`
        *,
        expense_categories!expenses_category_id_fkey (
          name,
          color
        )
      `)
      .gte("date", startDate)
      .lte("date", endDate)
      .order("date", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Create expense
  async create(expense: ExpenseInsert): Promise<Expense> {
    // Sanitize data: convert empty strings to null
    const sanitizedExpense = sanitizeForDatabase(expense);
    
    const { data, error } = await supabase
      .from("expenses")
      .insert(sanitizedExpense)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Update expense
  async update(id: string, updates: ExpenseUpdate): Promise<Expense> {
    // Sanitize data: convert empty strings to null
    const sanitizedUpdates = sanitizeForDatabase(updates);
    
    const { data, error } = await supabase
      .from("expenses")
      .update(sanitizedUpdates)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete expense
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("expenses")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get all categories
  async getCategories(): Promise<ExpenseCategory[]> {
    const { data, error } = await supabase
      .from("expense_categories")
      .select("*")
      .order("name");

    if (error) throw error;
    return data || [];
  },

  // Calculate totals by category
  async getTotalsByCategory(startDate: string, endDate: string): Promise<Record<string, number>> {
    const expenses = await expenseService.getByDateRange(startDate, endDate);
    const totals: Record<string, number> = {};

    expenses.forEach((expense) => {
      const categoryName = expense.expense_categories?.name || "Uncategorized";
      totals[categoryName] = (totals[categoryName] || 0) + expense.amount;
    });

    return totals;
  },
};