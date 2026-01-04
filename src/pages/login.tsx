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
import { Loader2, LogIn, UserPlus } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const { toast } = useToast();

  const [isRegister, setIsRegister] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [isLoginLoading, setIsLoginLoading] = useState(false);

  const [registerName, setRegisterName] = useState("");
  const [registerEmail, setRegisterEmail] = useState("");
  const [registerPassword, setRegisterPassword] = useState("");
  const [registerConfirmPassword, setRegisterConfirmPassword] = useState("");
  const [isRegisterLoading, setIsRegisterLoading] = useState(false);

  console.log("🟢 Login page mounted and ready!");

  const handleLogin = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🔵 handleLogin called!");
    console.log("🔵 Login form submitted", { email: loginEmail });
    
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
      console.log("🔵 Calling authService.signIn...");
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

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    
    console.log("🔵 handleRegister called!");
    console.log("🔵 Register form submitted", { email: registerEmail, name: registerName });

    if (registerPassword !== registerConfirmPassword) {
      toast({
        title: "Erro",
        description: "As passwords não coincidem",
        variant: "destructive",
      });
      return;
    }

    if (registerPassword.length < 6) {
      toast({
        title: "Erro",
        description: "A password deve ter pelo menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    setIsRegisterLoading(true);

    try {
      console.log("🔵 Calling authService.signUp...");
      const { user, error } = await authService.signUp(registerEmail, registerPassword, registerName);

      if (error) {
        console.error("🔴 Register error:", error);
        toast({
          title: "Erro no Registo",
          description: error.message || "Não foi possível criar a conta",
          variant: "destructive",
        });
        setIsRegisterLoading(false);
        return;
      }

      if (user) {
        console.log("🟢 Registration successful!");
        toast({
          title: "Conta criada com sucesso!",
          description: "Pode agora fazer login com as suas credenciais.",
        });

        setIsRegister(false);
        setLoginEmail(registerEmail);
        
        setRegisterName("");
        setRegisterEmail("");
        setRegisterPassword("");
        setRegisterConfirmPassword("");
      }
    } catch (error: any) {
      console.error("🔴 Register error:", error);
      toast({
        title: "Erro no Registo",
        description: error.message || "Ocorreu um erro inesperado",
        variant: "destructive",
      });
    } finally {
      setIsRegisterLoading(false);
    }
  };

  const handleButtonClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    console.log("🟡 Button clicked!");
    console.log("Button type:", e.currentTarget.type);
    console.log("Form will submit:", e.currentTarget.form ? "YES" : "NO");
  };

  return (
    <>
      <SEO
        title="Login | Gestão Arroios"
        description="Aceda à sua conta ou crie uma nova conta"
      />
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-md mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {isRegister ? "Criar Conta" : "Bem-vindo"}
              </h1>
              <p className="text-gray-600">
                {isRegister
                  ? "Preencha os seus dados para criar uma conta"
                  : "Entre na sua conta para continuar"}
              </p>
            </div>

            <div className="flex gap-2 mb-6 bg-gray-100 p-1 rounded-lg">
              <button
                type="button"
                onClick={() => {
                  console.log("🔄 Switching to Login");
                  setIsRegister(false);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  !isRegister
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <LogIn className="inline-block w-4 h-4 mr-2" />
                Login
              </button>
              <button
                type="button"
                onClick={() => {
                  console.log("🔄 Switching to Register");
                  setIsRegister(true);
                }}
                className={`flex-1 py-2 px-4 rounded-md font-medium transition-all ${
                  isRegister
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900"
                }`}
              >
                <UserPlus className="inline-block w-4 h-4 mr-2" />
                Registo
              </button>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-8">
              {!isRegister ? (
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
                    <Label htmlFor="login-password">Password</Label>
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
                    onClick={handleButtonClick}
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

                  <div className="text-center text-sm text-gray-600">
                    Não tem conta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegister(true)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Criar conta
                    </button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleRegister} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="register-name">Nome Completo</Label>
                    <Input
                      id="register-name"
                      type="text"
                      placeholder="João Silva"
                      value={registerName}
                      onChange={(e) => setRegisterName(e.target.value)}
                      required
                      disabled={isRegisterLoading}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-email">Email</Label>
                    <Input
                      id="register-email"
                      type="email"
                      placeholder="seu@email.com"
                      value={registerEmail}
                      onChange={(e) => setRegisterEmail(e.target.value)}
                      required
                      disabled={isRegisterLoading}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-password">Password</Label>
                    <Input
                      id="register-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerPassword}
                      onChange={(e) => setRegisterPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isRegisterLoading}
                      className="w-full"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="register-confirm-password">Confirmar Password</Label>
                    <Input
                      id="register-confirm-password"
                      type="password"
                      placeholder="••••••••"
                      value={registerConfirmPassword}
                      onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      disabled={isRegisterLoading}
                      className="w-full"
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isRegisterLoading}
                    onClick={handleButtonClick}
                  >
                    {isRegisterLoading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        A criar conta...
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Criar Conta
                      </>
                    )}
                  </Button>

                  <div className="text-center text-sm text-gray-600">
                    Já tem conta?{" "}
                    <button
                      type="button"
                      onClick={() => setIsRegister(false)}
                      className="text-blue-600 hover:underline font-medium"
                    >
                      Fazer login
                    </button>
                  </div>
                </form>
              )}

              <div className="mt-6 p-4 bg-gray-50 rounded-lg text-xs text-gray-600">
                <p className="font-semibold mb-2">ℹ️ Informação:</p>
                <ul className="space-y-1 list-disc list-inside">
                  <li>Após criar conta, promova a admin via SQL</li>
                  <li>Consulte o README.md para instruções detalhadas</li>
                  <li>Abra o console (F12) para ver logs de debug</li>
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