import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type FrontendText = Database["public"]["Tables"]["frontend_texts"]["Row"];
type FrontendTextInsert = Database["public"]["Tables"]["frontend_texts"]["Insert"];
type FrontendTextUpdate = Database["public"]["Tables"]["frontend_texts"]["Update"];

export const frontendTextsService = {
  // Get all texts
  async getAll(): Promise<FrontendText[]> {
    const { data, error } = await supabase
      .from("frontend_texts")
      .select("*")
      .order("page")
      .order("section")
      .order("key");

    if (error) throw error;
    return data || [];
  },

  // Get texts by page
  async getByPage(page: string): Promise<FrontendText[]> {
    const { data, error } = await supabase
      .from("frontend_texts")
      .select("*")
      .eq("page", page)
      .order("section")
      .order("key");

    if (error) throw error;
    return data || [];
  },

  // Get a specific text by key
  async getByKey(key: string): Promise<string> {
    const { data, error } = await supabase
      .from("frontend_texts")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    return data?.value || "";
  },

  // Get texts as key-value object for easy access
  async getTextsMap(page?: string): Promise<Record<string, string>> {
    let query = supabase.from("frontend_texts").select("key, value");

    if (page) {
      query = query.eq("page", page);
    }

    const { data, error } = await query;

    if (error) throw error;

    const textsMap: Record<string, string> = {};
    (data || []).forEach((text) => {
      textsMap[text.key] = text.value;
    });

    return textsMap;
  },

  // Update a text
  async update(key: string, value: string): Promise<FrontendText> {
    const { data, error } = await supabase
      .from("frontend_texts")
      .update({
        value,
        updated_at: new Date().toISOString(),
      })
      .eq("key", key)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Bulk update texts
  async bulkUpdate(updates: Array<{ key: string; value: string }>): Promise<void> {
    const promises = updates.map((update) => this.update(update.key, update.value));
    await Promise.all(promises);
  },

  // Reset text to default value
  async resetToDefault(key: string): Promise<FrontendText> {
    const { data, error } = await supabase
      .from("frontend_texts")
      .select("default_value")
      .eq("key", key)
      .single();

    if (error) throw error;

    return this.update(key, data.default_value);
  },

  // Reset all texts to default values
  async resetAllToDefault(): Promise<void> {
    const { error } = await supabase.rpc("reset_all_frontend_texts");
    if (error) throw error;
  },

  // Create a new text entry
  async create(text: FrontendTextInsert): Promise<FrontendText> {
    const { data, error } = await supabase
      .from("frontend_texts")
      .insert(text)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete a text entry
  async delete(key: string): Promise<void> {
    const { error } = await supabase.from("frontend_texts").delete().eq("key", key);

    if (error) throw error;
  },

  // Get grouped texts by page and section for admin UI
  async getGrouped(): Promise<
    Record<string, Record<string, FrontendText[]>>
  > {
    const texts = await this.getAll();
    const grouped: Record<string, Record<string, FrontendText[]>> = {};

    texts.forEach((text) => {
      if (!grouped[text.page]) {
        grouped[text.page] = {};
      }
      const section = text.section || "default";
      if (!grouped[text.page][section]) {
        grouped[text.page][section] = [];
      }
      grouped[text.page][section].push(text);
    });

    return grouped;
  },

  // Export texts as JSON (for backup)
  async exportTexts(): Promise<string> {
    const texts = await this.getAll();
    return JSON.stringify(texts, null, 2);
  },

  // Import texts from JSON
  async importTexts(jsonData: string): Promise<void> {
    const texts = JSON.parse(jsonData) as FrontendTextInsert[];
    const promises = texts.map((text) =>
      supabase
        .from("frontend_texts")
        .upsert(text, { onConflict: "key" })
    );
    await Promise.all(promises);
  },
};