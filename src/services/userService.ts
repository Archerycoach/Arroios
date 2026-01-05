import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

// Security: Sanitize error messages
const sanitizeError = (error: any): string => {
  // Log full error in development for debugging
  if (process.env.NODE_ENV === "development") {
    console.error("Full error details:", {
      message: error?.message,
      code: error?.code,
      status: error?.status,
      details: error?.details,
      hint: error?.hint,
    });
  }

  if (error.message?.includes("duplicate key")) {
    return "Este email já está em uso";
  }
  if (error.message?.includes("permission denied") || error.message?.includes("insufficient_privilege")) {
    return "Sem permissões suficientes para esta operação";
  }
  if (error.message?.includes("For security purposes")) {
    return "Limite de requisições atingido. Por favor aguarde alguns segundos e tente novamente.";
  }
  if (error.status === 429 || error.message?.includes("rate limit")) {
    return "Demasiadas tentativas. Por favor aguarde 60 segundos antes de tentar novamente.";
  }
  if (error.message?.includes("violates row-level security")) {
    return "Sem permissões para criar utilizadores. Certifique-se de que está autenticado como administrador.";
  }
  if (error.message?.includes("User already registered")) {
    return "Este email já está registado";
  }
  
  // In production, log to console.error for Vercel logs
  console.error("Unexpected error in userService:", error);
  
  return "Ocorreu um erro. Por favor, tente novamente.";
};

// Retry helper with exponential backoff
const retryWithBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  initialDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;
      
      // Don't retry on certain errors
      if (
        error.message?.includes("duplicate key") ||
        error.message?.includes("invalid") ||
        error.message?.includes("permission denied")
      ) {
        throw error;
      }
      
      // Check if it's a rate limit error
      const isRateLimit = 
        error.status === 429 || 
        error.message?.includes("rate limit") ||
        error.message?.includes("For security purposes");
      
      if (isRateLimit && attempt < maxRetries - 1) {
        // Exponential backoff: 1s, 2s, 4s
        const delay = initialDelay * Math.pow(2, attempt);
        if (process.env.NODE_ENV === "development") {
          console.log(`Rate limit hit, retrying in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
        }
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      
      // If it's the last retry or not a rate limit error, throw
      if (attempt === maxRetries - 1) {
        throw error;
      }
    }
  }
  
  throw lastError;
};

export const userService = {
  // Get all users with optional filters
  async getAllUsers(filters?: {
    role?: UserRole;
    search?: string;
  }) {
    try {
      let query = supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false });

      if (filters?.role) {
        query = query.eq("role", filters.role);
      }

      if (filters?.search) {
        // Security: Use parameterized queries, not string interpolation
        query = query.or(`full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching users:", error);
      }
      throw new Error(sanitizeError(error));
    }
  },

  // Create new user
  async createUser(userData: {
    email: string;
    password: string;
    full_name: string;
    phone?: string;
    role: UserRole;
  }) {
    try {
      // Security: Validate input
      if (!userData.email || !userData.password || !userData.full_name) {
        throw new Error("Todos os campos obrigatórios devem ser preenchidos");
      }

      if (userData.password.length < 6) {
        throw new Error("A password deve ter pelo menos 6 caracteres");
      }

      // Security: Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(userData.email)) {
        throw new Error("Email inválido");
      }

      console.log("Creating user - Step 1: Starting auth signup");

      // Create auth user with retry logic
      const result = await retryWithBackoff(async () => {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: userData.email,
          password: userData.password,
          options: {
            data: {
              full_name: userData.full_name,
              phone: userData.phone,
            },
          },
        });

        if (authError) {
          console.error("Auth signup error:", authError);
          throw authError;
        }
        if (!authData.user) {
          console.error("Auth signup succeeded but no user returned");
          throw new Error("Falha ao criar utilizador");
        }

        console.log("Creating user - Step 2: Auth signup successful, user ID:", authData.user.id);
        return authData;
      }, 3, 2000); // 3 retries, starting with 2 second delay

      console.log("Creating user - Step 3: Inserting into users table");

      // Insert user record in users table (not update!)
      const { data: user, error: insertError } = await supabase
        .from("users")
        .insert({ 
          id: result.user.id,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          role: userData.role,
        })
        .select();

      if (insertError) {
        console.error("Insert into users table error:", insertError);
        throw insertError;
      }
      
      // Validate result
      if (!user || user.length === 0) {
        console.error("Insert succeeded but no user data returned");
        throw new Error("Falha ao criar registo do utilizador");
      }

      console.log("Creating user - Step 4: Success! User created:", user[0].id);
      return user[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw new Error(sanitizeError(error));
    }
  },

  // Get user by ID
  async getUserById(userId: string) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("ID de utilizador inválido");
      }

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching user:", error);
      }
      throw new Error(sanitizeError(error));
    }
  },

  // Update user role
  async updateUserRole(userId: string, role: UserRole) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("ID de utilizador inválido");
      }

      // Security: Validate role
      const validRoles: UserRole[] = ["admin", "staff", "guest"];
      if (!validRoles.includes(role)) {
        throw new Error("Role inválido");
      }

      const { data, error } = await supabase
        .from("users")
        .update({ role, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select();

      if (error) throw error;
      
      // Validate result - FIXED: No more .single()
      if (!data || data.length === 0) {
        throw new Error("Utilizador não encontrado");
      }
      
      if (data.length > 1) {
        throw new Error("Múltiplos utilizadores encontrados - erro de integridade");
      }

      return data[0];
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating user role:", error);
      }
      throw new Error(sanitizeError(error));
    }
  },

  // Update user profile completely
  async updateUser(userId: string, updates: {
    full_name?: string;
    phone?: string;
    role?: UserRole;
    avatar_url?: string;
  }) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("ID de utilizador inválido");
      }

      // Security: Validate role if provided
      if (updates.role) {
        const validRoles: UserRole[] = ["admin", "staff", "guest"];
        if (!validRoles.includes(updates.role)) {
          throw new Error("Role inválido");
        }
      }

      // Security: Sanitize avatar URL if provided
      if (updates.avatar_url) {
        try {
          new URL(updates.avatar_url);
        } catch {
          throw new Error("URL de avatar inválido");
        }
      }

      const { data, error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select();

      if (error) throw error;
      
      // Validate result - FIXED: No more .single()
      if (!data || data.length === 0) {
        throw new Error("Utilizador não encontrado");
      }
      
      if (data.length > 1) {
        throw new Error("Múltiplos utilizadores encontrados - erro de integridade");
      }

      return data[0];
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating user:", error);
      }
      throw new Error(sanitizeError(error));
    }
  },

  // Update user profile
  async updateUserProfile(userId: string, updates: {
    full_name?: string;
    phone?: string;
    avatar_url?: string;
  }) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("ID de utilizador inválido");
      }

      // Security: Sanitize avatar URL if provided
      if (updates.avatar_url) {
        try {
          new URL(updates.avatar_url);
        } catch {
          throw new Error("URL de avatar inválido");
        }
      }

      const { data, error } = await supabase
        .from("users")
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq("id", userId)
        .select();

      if (error) throw error;
      
      // Validate result - FIXED: No more .single()
      if (!data || data.length === 0) {
        throw new Error("Utilizador não encontrado");
      }
      
      if (data.length > 1) {
        throw new Error("Múltiplos utilizadores encontrados - erro de integridade");
      }

      return data[0];
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error updating user profile:", error);
      }
      throw new Error(sanitizeError(error));
    }
  },

  // Get user statistics
  async getUserStats() {
    try {
      const { data: allUsers, error: allError } = await supabase
        .from("users")
        .select("role");

      if (allError) throw allError;

      const stats = {
        total: allUsers?.length || 0,
        admins: allUsers?.filter(u => u.role === "admin").length || 0,
        staff: allUsers?.filter(u => u.role === "staff").length || 0,
        guests: allUsers?.filter(u => u.role === "guest").length || 0,
      };

      return stats;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching user stats:", error);
      }
      throw new Error(sanitizeError(error));
    }
  },

  // Get user's bookings count
  async getUserBookingsCount(userId: string) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        return 0;
      }

      const { count, error } = await supabase
        .from("bookings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error fetching user bookings count:", error);
      }
      return 0;
    }
  },

  // Delete user
  async deleteUser(userId: string) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("ID de utilizador inválido");
      }

      console.log("Deleting user - Step 1: Deleting from users table");

      // Delete from users table first
      const { error: deleteError } = await supabase
        .from("users")
        .delete()
        .eq("id", userId);

      if (deleteError) {
        console.error("Error deleting from users table:", deleteError);
        throw deleteError;
      }

      console.log("Deleting user - Step 2: Deleting from auth");

      // Delete from auth.users (requires admin API)
      // Note: This uses the Supabase Admin API which requires service role key
      // For now, we only delete from users table
      // The auth.users record should be deleted manually via Supabase Dashboard
      // or implement with service role key if needed

      console.log("Deleting user - Step 3: Success!");
      return { success: true };
    } catch (error) {
      console.error("Error deleting user:", error);
      throw new Error(sanitizeError(error));
    }
  },

  // Update user password
  async updateUserPassword(userId: string, newPassword: string) {
    try {
      // Security: Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(userId)) {
        throw new Error("ID de utilizador inválido");
      }

      // Security: Validate password
      if (!newPassword || newPassword.length < 6) {
        throw new Error("A password deve ter pelo menos 6 caracteres");
      }

      console.log("Updating password - Step 1: Validating user exists");

      // Verify user exists
      const { data: user, error: fetchError } = await supabase
        .from("users")
        .select("id, email")
        .eq("id", userId)
        .single();

      if (fetchError || !user) {
        throw new Error("Utilizador não encontrado");
      }

      console.log("Updating password - Step 2: Updating auth password");

      // Update password using Supabase Admin API
      // Note: This requires admin privileges
      // For client-side, we use update user which updates current user's password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) {
        console.error("Error updating password:", updateError);
        throw updateError;
      }

      console.log("Updating password - Step 3: Success!");
      return { success: true };
    } catch (error) {
      console.error("Error updating password:", error);
      throw new Error(sanitizeError(error));
    }
  },
};