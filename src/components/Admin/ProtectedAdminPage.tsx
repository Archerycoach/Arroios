import { useEffect } from "react";
import { useRouter } from "next/router";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedAdminPageProps {
  children: React.ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedAdminPage({ children, requireAdmin = false }: ProtectedAdminPageProps) {
  const router = useRouter();
  const { isAuthenticated, isAdmin, isStaff, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      // Not authenticated at all - redirect to login
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }

      // Not staff or admin - redirect to home
      if (!isStaff && !isAdmin) {
        router.push("/");
        return;
      }

      // Staff trying to access admin-only page - redirect to dashboard
      if (requireAdmin && !isAdmin) {
        router.push("/admin");
        return;
      }
    }
  }, [isAuthenticated, isAdmin, isStaff, isLoading, requireAdmin, router]);

  // Show loading state while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Show nothing while redirecting
  if (!isAuthenticated || !isStaff || (requireAdmin && !isAdmin)) {
    return null;
  }

  return <>{children}</>;
}