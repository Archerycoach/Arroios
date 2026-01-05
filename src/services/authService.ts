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

export const authService = {
  // Sign in - SIMPLIFIED AND RELIABLE
  async signIn(email: string, password: string): Promise<AuthResponse> {
    try {
      console.log("🔵 [authService] Starting signIn for:", email);
      
      // Step 1: Authenticate with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: password,
      });

      if (authError) {
        console.error("🔴 [authService] Auth error:", authError);
        return { 
          user: null, 
          error: { message: authError.message }
        };
      }

      if (!authData.user) {
        console.error("🔴 [authService] No user returned from auth");
        return { 
          user: null, 
          error: { message: "Falha na autenticação" }
        };
      }

      console.log("🟢 [authService] Auth successful, user ID:", authData.user.id);

      // Step 2: Get user profile from users table
      const { data: userProfile, error: profileError } = await supabase
        .from("users")
        .select("*")
        .eq("id", authData.user.id)
        .maybeSingle();

      if (profileError) {
        console.error("🔴 [authService] Profile fetch error:", profileError);
      }

      if (!userProfile) {
        console.warn("⚠️ [authService] No profile found, creating one...");
        
        // Create profile if it doesn't exist
        const { data: newProfile, error: createError } = await supabase
          .from("users")
          .insert({
            id: authData.user.id,
            email: authData.user.email!,
            full_name: authData.user.user_metadata?.full_name || "Utilizador",
            role: "guest" as UserRole,
          })
          .select()
          .single();

        if (createError) {
          console.error("🔴 [authService] Failed to create profile:", createError);
          return {
            user: {
              id: authData.user.id,
              email: authData.user.email || "",
              full_name: "Utilizador",
              role: "guest" as UserRole,
            },
            error: null,
          };
        }

        console.log("🟢 [authService] Profile created:", newProfile);
        
        return {
          user: {
            id: newProfile.id,
            email: newProfile.email,
            full_name: newProfile.full_name || "Utilizador",
            role: newProfile.role as UserRole,
            avatar_url: newProfile.avatar_url,
            phone: newProfile.phone,
            created_at: newProfile.created_at,
          },
          error: null,
        };
      }

      console.log("🟢 [authService] Profile found:", userProfile);

      return {
        user: {
          id: userProfile.id,
          email: userProfile.email,
          full_name: userProfile.full_name || "Utilizador",
          role: userProfile.role as UserRole,
          avatar_url: userProfile.avatar_url,
          phone: userProfile.phone,
          created_at: userProfile.created_at,
        },
        error: null,
      };
    } catch (error: any) {
      console.error("🔴 [authService] Unexpected error:", error);
      return { 
        user: null, 
        error: { message: error.message || "Erro inesperado" }
      };
    }
  },

  // Sign out
  async signOut(): Promise<void> {
    console.log("🔵 [authService] Signing out...");
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("🔴 [authService] Sign out error:", error);
      throw error;
    }
    console.log("🟢 [authService] Signed out successfully");
  },

  // Get current user
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      console.log("🔵 [authService] Getting current user...");
      
      const { data: { user }, error } = await supabase.auth.getUser();

      if (error || !user) {
        console.log("⚪ [authService] No current user");
        return null;
      }

      const { data: userProfile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (!userProfile) {
        console.warn("⚠️ [authService] User authenticated but no profile found");
        return {
          id: user.id,
          email: user.email || "",
          full_name: "Utilizador",
          role: "guest" as UserRole,
        };
      }

      console.log("🟢 [authService] Current user:", userProfile.email);

      return {
        id: userProfile.id,
        email: userProfile.email,
        full_name: userProfile.full_name || "Utilizador",
        role: userProfile.role as UserRole,
        avatar_url: userProfile.avatar_url,
        phone: userProfile.phone,
        created_at: userProfile.created_at,
      };
    } catch (error) {
      console.error("🔴 [authService] Error getting current user:", error);
      return null;
    }
  },

  // Check if user is authenticated
  async isAuthenticated(): Promise<boolean> {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session;
  },

  // Get session
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) {
      console.error("🔴 [authService] Error getting session:", error);
      return null;
    }
    return session;
  },

  // Request password reset
  async requestPasswordReset(email: string) {
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
      return { error: { message: "Se o email existir, receberá instruções para recuperação" } };
    }

    return { error: null };
  },

  // Reset password
  async resetPassword(password: string) {
    if (!password || password.length < 6) {
      return { error: { message: "A password deve ter pelo menos 6 caracteres" } };
    }

    const { data, error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { data, error: null };
  },
};