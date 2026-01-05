import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { authService, AuthUser } from "@/services/authService";
import { supabase } from "@/integrations/supabase/client";

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
    console.log("🔵 [AuthContext] Initializing...");
    
    // Check initial session
    const initializeAuth = async () => {
      try {
        const currentUser = await authService.getCurrentUser();
        if (currentUser) {
          console.log("🟢 [AuthContext] Initial user found:", currentUser.email);
          setUser(currentUser);
        } else {
          console.log("⚪ [AuthContext] No initial user");
        }
      } catch (error) {
        console.error("🔴 [AuthContext] Initialization error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔵 [AuthContext] Auth state changed:", event);
        
        if (event === "SIGNED_OUT" || !session) {
          console.log("⚪ [AuthContext] User signed out");
          setUser(null);
          return;
        }

        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED" || event === "USER_UPDATED") {
          console.log("🟢 [AuthContext] User authenticated, fetching profile...");
          const currentUser = await authService.getCurrentUser();
          if (currentUser) {
            console.log("🟢 [AuthContext] Profile loaded:", currentUser.email);
            setUser(currentUser);
          }
        }
      }
    );

    return () => {
      console.log("🔵 [AuthContext] Cleanup");
      subscription.unsubscribe();
    };
  }, []);

  const login = (userData: AuthUser) => {
    console.log("🟢 [AuthContext] Login called for:", userData.email);
    setUser(userData);
  };

  const logout = async () => {
    console.log("🔵 [AuthContext] Logout called");
    await authService.signOut();
    setUser(null);
  };

  const isAdmin = user?.role === "admin";
  const isStaff = user?.role === "staff" || user?.role === "admin";

  console.log("🔵 [AuthContext] Current state:", {
    hasUser: !!user,
    email: user?.email,
    role: user?.role,
    isAdmin,
    isStaff,
    isLoading
  });

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