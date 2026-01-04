import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type User = Database["public"]["Tables"]["users"]["Row"];
type UserRole = Database["public"]["Enums"]["user_role"];

// Security: Sanitize error messages
const sanitizeError = (error: any): string => {
  if (error.message?.includes("duplicate key")) {
    return "Este email já está em uso";
  }
  if (error.message?.includes("permission denied") || error.message?.includes("insufficient_privilege")) {
    return "Sem permissões suficientes para esta operação";
  }
  return "Ocorreu um erro. Por favor, tente novamente.";
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

      // Create auth user
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

      if (authError) throw authError;
      if (!authData.user) throw new Error("Falha ao criar utilizador");

      // Update user role in users table
      const { data: user, error: updateError } = await supabase
        .from("users")
        .update({ 
          role: userData.role,
          full_name: userData.full_name,
          phone: userData.phone,
        })
        .eq("id", authData.user.id)
        .select()
        .single();

      if (updateError) throw updateError;
      return user;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error creating user:", error);
      }
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
        .select()
        .single();

      if (error) throw error;
      return data;
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
        .select()
        .single();

      if (error) throw error;
      return data;
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
        .select()
        .single();

      if (error) throw error;
      return data;
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
};