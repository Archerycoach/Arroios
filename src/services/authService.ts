import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

type UserRole = Database["public"]["Enums"]["user_role"];

export interface AuthUser {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string | null;
  phone?: string | null;
  created_at?: string;
}

export interface AuthError {
  message: string;
}

export interface AuthResponse {
  user: AuthUser | null;
  error: AuthError | null;
}

// Dynamic redirect URL helper
const getRedirectURL = () => {
  if (typeof window !== "undefined") {
    return `${window.location.origin}/auth/callback`;
  }
  return "http://localhost:3000/auth/callback";
};

// Security: Sanitize error messages to prevent information disclosure
const sanitizeError = (error: any): string => {
  // Don't expose detailed database errors to users
  if (error.message?.includes("duplicate key")) {
    return "Este email já está registado";
  }
  if (error.message?.includes("invalid") || error.message?.includes("Invalid")) {
    return "Credenciais inválidas";
  }
  return "Ocorreu um erro. Por favor, tente novamente.";
};

export const authService = {
  // Sign up new user
  async signUp(email: string, password: string, fullName: string): Promise<AuthResponse> {
    try {
      // Security: Validate input
      if (!email || !password || !fullName) {
        return { user: null, error: { message: "Todos os campos são obrigatórios" } };
      }

      if (password.length < 6) {
        return { user: null, error: { message: "A password deve ter pelo menos 6 caracteres" } };
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName,
          },
        },
      });

      if (error) {
        return { user: null, error: { message: sanitizeError(error) } };
      }

      if (!data.user) {
        return { user: null, error: { message: "Falha ao criar utilizador" } };
      }

      // Create user record with guest role by default
      const { error: userError } = await supabase
        .from("users")
        .insert({
          id: data.user.id,
          email: data.user.email!,
          full_name: fullName,
          role: "guest" as UserRole,
        });

      if (userError) {
        // Security: Don't log sensitive user data in production
        if (process.env.NODE_ENV === "development") {
          console.error("Error creating user record:", userError);
        }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          full_name: fullName,
          role: "guest" as UserRole,
        },
        error: null,
      };
    } catch (error: any) {
      return { user: null, error: { message: sanitizeError(error) } };
    }
  },

  // Sign in existing user
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      // Security: Validate input
      if (!email || !password) {
        return { user: null, error: { message: "Email e password são obrigatórios" } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { user: null, error: { message: sanitizeError(error) } };
      }

      if (!data.user) {
        return { user: null, error: { message: "Falha na autenticação" } };
      }

      // Get user record with role
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", data.user.id)
        .single();

      if (userError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching user record:", userError);
        }
      }

      return {
        user: {
          id: data.user.id,
          email: data.user.email || "",
          full_name: userRecord?.full_name || "",
          role: (userRecord?.role as UserRole) || "guest",
        },
        error: null,
      };
    } catch (error: any) {
      return { user: null, error: { message: sanitizeError(error) } };
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error signing out:", error);
      }
      throw error;
    }
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        return null;
      }

      // Get user record with role
      const { data: userRecord, error: userError } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

      if (userError) {
        if (process.env.NODE_ENV === "development") {
          console.error("Error fetching user record:", userError);
        }
      }

      return {
        id: user.id,
        email: user.email || "",
        full_name: userRecord?.full_name || "",
        role: (userRecord?.role as UserRole) || "guest",
      };
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error getting current user:", error);
      }
      return null;
    }
  },

  // OAuth sign in (Google, Facebook, etc.)
  async signInWithOAuth(provider: "google" | "facebook" | "github") {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: getRedirectURL(),
      },
    });

    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("OAuth sign in error:", error);
      }
      return { error: { message: sanitizeError(error) } };
    }

    return { data, error: null };
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Request password reset
  async requestPasswordReset(email: string) {
    // Security: Validate email format
    if (!email || !email.includes("@")) {
      return { error: { message: "Email inválido" } };
    }

    const redirectUrl = typeof window !== "undefined" 
      ? `${window.location.origin}/redefinir-senha`
      : "http://localhost:3000/redefinir-senha";

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: redirectUrl,
    });

    if (error) {
      // Security: Don't reveal if email exists or not
      return { error: { message: "Se o email existir, receberá instruções para recuperação" } };
    }

    return { error: null };
  },

  // Reset password (update user password)
  async resetPassword(password: string) {
    // Security: Validate password strength
    if (!password || password.length < 6) {
      return { error: { message: "A password deve ter pelo menos 6 caracteres" } };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      return { error: { message: sanitizeError(error) } };
    }

    return { data, error: null };
  },

  // Get session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("Error getting session:", error);
      }
      return null;
    }
    return session;
  },
};