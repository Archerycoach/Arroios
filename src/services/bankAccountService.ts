import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];
type BankAccountInsert = Database["public"]["Tables"]["bank_accounts"]["Insert"];
type BankAccountUpdate = Database["public"]["Tables"]["bank_accounts"]["Update"];

export const bankAccountService = {
  /**
   * Get all bank accounts
   */
  async getAll(): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get active bank accounts only
   */
  async getActive(): Promise<BankAccount[]> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (error) throw error;
    return data || [];
  },

  /**
   * Get bank account by ID
   */
  async getById(id: string): Promise<BankAccount | null> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Create new bank account
   */
  async create(account: BankAccountInsert): Promise<BankAccount> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .insert(account)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Update bank account
   */
  async update(id: string, updates: BankAccountUpdate): Promise<BankAccount> {
    const { data, error } = await supabase
      .from("bank_accounts")
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  /**
   * Delete bank account
   */
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from("bank_accounts")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  /**
   * Toggle active status
   */
  async toggleActive(id: string, isActive: boolean): Promise<BankAccount> {
    return this.update(id, { is_active: isActive });
  },
};