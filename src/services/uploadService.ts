import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type Upload = Database["public"]["Tables"]["uploads"]["Row"];
type UploadInsert = Database["public"]["Tables"]["uploads"]["Insert"];

export const uploadService = {
  // Upload a file to Supabase Storage
  async uploadFile(
    file: File,
    bucket: string = "property-images",
    folder: string = "uploads"
  ): Promise<string> {
    const fileExt = file.name.split(".").pop();
    const fileName = `${folder}/${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(fileName, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (error) throw error;

    // Get public URL
    const { data: urlData } = supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return urlData.publicUrl;
  },

  // Upload and record in database
  async uploadAndRecord(
    file: File,
    type: "logo" | "gallery" | "room" | "other" = "other",
    bucket: string = "property-images"
  ): Promise<Upload> {
    const url = await this.uploadFile(file, bucket, type);

    const { data: user } = await supabase.auth.getUser();

    const uploadData: UploadInsert = {
      file_name: file.name,
      file_type: file.type,
      file_size: file.size,
      file_path: url,
      uploaded_by: user?.user?.id,
      category: type,
    };

    const { data, error } = await supabase
      .from("uploads")
      .insert(uploadData)
      .select()
      .single();

    if (error) throw error;
    return data as Upload;
  },

  // Get uploads by category
  async getByCategory(category: string): Promise<Upload[]> {
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .eq("category", category)
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },

  // Delete upload
  async delete(id: string, storagePath: string): Promise<void> {
    // Extract path from full URL
    const path = storagePath.split("/storage/v1/object/public/")[1];
    
    if (path) {
      const [bucket, ...pathParts] = path.split("/");
      const filePath = pathParts.join("/");

      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from(bucket)
        .remove([filePath]);

      if (storageError) console.error("Storage delete error:", storageError);
    }

    // Delete from database
    const { error } = await supabase
      .from("uploads")
      .delete()
      .eq("id", id);

    if (error) throw error;
  },

  // Get all uploads
  async getAll(): Promise<Upload[]> {
    const { data, error } = await supabase
      .from("uploads")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;
    return data || [];
  },
};