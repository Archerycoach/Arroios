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
import { Loader2, LogIn } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!loginEmail || !loginPassword) {
      toast({
        title: "Erro",
        description: "Por favor preencha todos os campos",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoginLoading(true);

    try {
      const { user, error } = await authService.signIn(loginEmail, loginPassword);

      if (error) {
        console.error("🔴 Login error:", error);
        toast({
          title: "Erro no Login",
          description: error.message || "Credenciais inválidas",
          variant: "destructive",
        });
        setIsLoginLoading(false);
        return;
      }

      if (user) {
        console.log("🟢 Login successful, calling login() from AuthContext");
        login(user);
        
        toast({
          title: "Login bem-sucedido!",
          description: `Bem-vindo de volta, ${user.full_name}!`,
        });

        if (user.role === "admin" || user.role === "staff") {
          console.log("🔵 Redirecting to /admin");
          router.push("/admin");
        } else {
          console.log("🔵 Redirecting to /my-bookings");
          router.push("/my-bookings");
        }
      }
    } catch (error: any) {
      console.error("🔴 Login error:", error);
      toast({
        title: "Erro no Login",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsLoginLoading(false);
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
                Bem-vindo
              </h1>
              <p className="text-gray-600">
                Entre na sua conta para continuar
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              <form onSubmit={handleLogin} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    value={loginEmail}
                    onChange={(e) => setLoginEmail(e.target.value)}
                    required
                    disabled={isLoginLoading}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="login-password">Password</Label>
                    <Link
                      href="/recuperar-senha"
                      className="text-sm text-blue-600 hover:underline"
                    >
                      Esqueceu a password?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    required
                    disabled={isLoginLoading}
                    className="w-full"
                  />
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoginLoading}
                >
                  {isLoginLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A entrar...
                    </>
                  ) : (
                    <>
                      <LogIn className="mr-2 h-4 w-4" />
                      Entrar
                    </>
                  )}
                </Button>
              </form>

              <div className="mt-6 p-4 bg-blue-50 rounded-lg text-sm text-gray-700">
                <p className="font-semibold mb-2">ℹ️ Informação:</p>
                <ul className="space-y-1 list-disc list-inside text-xs">
                  <li>Não tem conta? Contacte o administrador do sistema</li>
                  <li>Apenas administradores podem criar novos utilizadores</li>
                  <li>Se esqueceu a password, use o link "Esqueceu a password?"</li>
                </ul>
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