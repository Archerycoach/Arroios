import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface ProtectedAdminPageProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedAdminPage({ 
  children, 
  requireAdmin = false 
}: ProtectedAdminPageProps) {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    const checkAuth = async () => {
      // Force session check on every page load
      const { data: { session }, error } = await supabase.auth.getSession();
      
      if (error || !session) {
        console.log("No valid session, redirecting to login");
        router.replace("/login");
        return;
      }

      // Check if user has required role
      if (!user) {
        router.replace("/login");
        return;
      }

      // Guests cannot access admin area
      if (user.role === "guest") {
        console.log("Guest attempted to access admin area");
        router.replace("/");
        return;
      }

      // Check admin-only pages
      if (requireAdmin && user.role !== "admin") {
        console.log("Non-admin attempted to access admin-only page");
        router.replace("/admin");
        return;
      }
    };

    if (!isLoading) {
      checkAuth();
    }
  }, [user, isLoading, router, requireAdmin]);

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">A verificar autenticação...</p>
        </div>
      </div>
    );
  }

  // Don't render content until auth is verified
  if (!user || user.role === "guest" || (requireAdmin && user.role !== "admin")) {
    return null;
  }

  return <>{children}</>;
}