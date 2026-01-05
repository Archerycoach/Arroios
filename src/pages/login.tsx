import { useState, FormEvent } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { authService } from "@/services/authService";
import SEO from "@/components/SEO";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Loader2, LogIn, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    
    console.log("🔵 [LoginPage] Form submitted");
    console.log("🔵 [LoginPage] Email:", email);
    
    if (!email || !password) {
      setError("Por favor preencha todos os campos");
      return;
    }
    
    setIsLoading(true);

    try {
      console.log("🔵 [LoginPage] Calling authService.signIn...");
      const { user, error: authError } = await authService.signIn(email, password);

      if (authError || !user) {
        console.error("🔴 [LoginPage] Login failed:", authError?.message);
        setError(authError?.message || "Erro ao fazer login");
        setIsLoading(false);
        return;
      }

      console.log("🟢 [LoginPage] Login successful!");
      console.log("🟢 [LoginPage] User:", user.email, "Role:", user.role);
      
      // Update auth context
      login(user);
      
      // Show success message
      toast({
        title: "✅ Login bem-sucedido!",
        description: `Bem-vindo, ${user.full_name}!`,
      });

      // Redirect based on role
      if (user.role === "admin" || user.role === "staff") {
        console.log("🔵 [LoginPage] Redirecting to /admin");
        await router.push("/admin");
      } else {
        console.log("🔵 [LoginPage] Redirecting to /my-bookings");
        await router.push("/my-bookings");
      }
    } catch (err: any) {
      console.error("🔴 [LoginPage] Unexpected error:", err);
      setError(err.message || "Erro inesperado");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <SEO
        title="Login | Gestão Arroios"
        description="Aceda à sua conta"
      />
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Bem-vindo de volta
              </h1>
              <p className="text-gray-600">
                Entre na sua conta para continuar
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleSubmit} className="space-y-6">
                {error && (
                  <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full"
                    autoComplete="email"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    <Link
                      href="/recuperar-senha"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Esqueceu a password?
                    </Link>
                  </div>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={isLoading}
                    className="w-full"
                    autoComplete="current-password"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  size="lg"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      A entrar...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-5 w-5" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 rounded-lg p-4 space-y-2">
                  <p className="text-sm font-semibold text-blue-900">
                    💡 Primeiro acesso?
                  </p>
                  <p className="text-xs text-blue-700">
                    Se ainda não tem credenciais, contacte o administrador do sistema ou{" "}
                    <Link href="/setup-admin" className="underline font-semibold">
                      configure o primeiro admin aqui
                    </Link>
                  </p>
                </div>
              </div>
            </div>

            <div className="text-center mt-6">
              <Link
                href="/"
                className="text-sm text-gray-600 hover:text-gray-900 hover:underline"
              >
                ← Voltar à página inicial
              </Link>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}