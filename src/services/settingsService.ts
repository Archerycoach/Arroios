import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Setting = Database["public"]["Tables"]["settings"]["Row"];
type SettingInsert = Database["public"]["Tables"]["settings"]["Insert"];

export interface PropertySettings {
  name: string;
  logo_url?: string;
  amenities: string[];
  footer: {
    address: string;
    phone: string;
    email: string;
    social?: {
      facebook?: string;
      instagram?: string;
      twitter?: string;
    };
  };
  gallery_images: string[];
}

export const settingsService = {
  // Get a setting by key
  async get(key: string): Promise<any> {
    const { data, error } = await supabase
      .from("settings")
      .select("value")
      .eq("key", key)
      .maybeSingle();

    if (error) throw error;
    return data?.value;
  },

  // Get all settings as an object
  async getAll(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from("settings")
      .select("key, value");

    if (error) throw error;

    const settings: Record<string, any> = {};
    data?.forEach((setting) => {
      settings[setting.key] = setting.value;
    });

    return settings;
  },

  // Update a setting
  async update(key: string, value: any): Promise<void> {
    const { error } = await supabase
      .from("settings")
      .upsert({ key, value }, { onConflict: "key" });

    if (error) throw error;
  },

  // Get property settings (frontend config)
  async getPropertySettings(): Promise<PropertySettings> {
    const settings = await this.getAll();
    
    return {
      name: settings.property_name || "Gestão Arroios",
      logo_url: settings.logo_url,
      amenities: settings.amenities || [],
      footer: settings.footer || {
        address: "",
        phone: "",
        email: "",
      },
      gallery_images: settings.gallery_images || [],
    };
  },

  // Update property name
  async updatePropertyName(name: string): Promise<void> {
    await this.update("property_name", name);
  },

  // Update logo URL
  async updateLogoUrl(url: string): Promise<void> {
    await this.update("logo_url", url);
  },

  // Update amenities
  async updateAmenities(amenities: string[]): Promise<void> {
    await this.update("amenities", amenities);
  },

  // Update footer info
  async updateFooter(footer: PropertySettings["footer"]): Promise<void> {
    await this.update("footer", footer);
  },

  // Update gallery images
  async updateGalleryImages(images: string[]): Promise<void> {
    await this.update("gallery_images", images);
  },
};