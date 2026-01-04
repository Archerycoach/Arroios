import { createContext, useContext, useState, useEffect, ReactNode, useMemo } from "react";
import { authService, AuthUser } from "@/services/authService";
import type { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";

type UserRole = Database["public"]["Enums"]["user_role"];

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (user: AuthUser) => void;
  logout: () => void;
  isAdmin: boolean;
  isStaff: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check initial session
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error checking session:", error);
          setUser(null);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          // Fetch user profile to get role
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email || "",
              full_name: profile.full_name || "",
              role: profile.role || "guest",
              avatar_url: profile.avatar_url,
              phone: profile.phone,
              created_at: profile.created_at || undefined,
            });
          }
        } else {
          setUser(null);
        }
      } catch (error) {
        console.error("Session check error:", error);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    checkSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event);
        
        if (event === "SIGNED_OUT" || !session) {
          setUser(null);
          return;
        }

        if (session?.user && (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED")) {
          // Fetch updated profile
          const { data: profile } = await supabase
            .from("users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (profile) {
            setUser({
              id: profile.id,
              email: profile.email || "",
              full_name: profile.full_name || "",
              role: profile.role || "guest",
              avatar_url: profile.avatar_url,
              phone: profile.phone,
              created_at: profile.created_at || undefined,
            });
          }
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: AuthUser) => {
    setUser(userData);
  };

  const logout = async () => {
    await authService.signOut();
    setUser(null);
  };

  // Use useMemo to ensure isAdmin and isStaff are recalculated when user changes
  const isAdmin = useMemo(() => user?.role === "admin", [user]);
  const isStaff = useMemo(() => user?.role === "staff" || user?.role === "admin", [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        isAdmin,
        isStaff,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}