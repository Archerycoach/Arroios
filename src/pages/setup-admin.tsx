import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/integrations/supabase/client";
import SEO from "@/components/SEO";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle, XCircle, AlertTriangle, User, Copy } from "lucide-react";

interface DiagnosticResult {
  step: string;
  status: "success" | "error" | "warning" | "pending";
  message: string;
  details?: string;
}

export default function SetupAdminPage() {
  const { toast } = useToast();
  const [diagnostics, setDiagnostics] = useState<DiagnosticResult[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [adminCreated, setAdminCreated] = useState(false);
  const [adminCredentials, setAdminCredentials] = useState<{ email: string; password: string } | null>(null);
  
  const [testEmail, setTestEmail] = useState("admin@arroios.com");
  const [testPassword, setTestPassword] = useState("Admin123!");
  const [isTesting, setIsTesting] = useState(false);

  const addDiagnostic = (diagnostic: DiagnosticResult) => {
    setDiagnostics(prev => [...prev, diagnostic]);
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "✅ Copiado!",
      description: `${label} copiado para a área de transferência`,
    });
  };

  const runDiagnostics = async () => {
    setIsRunning(true);
    setDiagnostics([]);
    setAdminCreated(false);
    setAdminCredentials(null);

    try {
      // Step 1: Check Supabase connection
      addDiagnostic({
        step: "1. Conexão Supabase",
        status: "pending",
        message: "Verificando conexão...",
      });

      const { data: connectionTest, error: connectionError } = await supabase
        .from("users")
        .select("count")
        .limit(1);

      if (connectionError) {
        addDiagnostic({
          step: "1. Conexão Supabase",
          status: "error",
          message: "❌ Falha na conexão com Supabase",
          details: connectionError.message,
        });
        setIsRunning(false);
        return;
      }

      addDiagnostic({
        step: "1. Conexão Supabase",
        status: "success",
        message: "✅ Conexão estabelecida",
      });

      // Step 2: Check for existing users
      addDiagnostic({
        step: "2. Verificar utilizadores existentes",
        status: "pending",
        message: "Procurando utilizadores...",
      });

      const { data: existingUsers, error: usersError } = await supabase
        .from("users")
        .select("id, email, full_name, role")
        .order("created_at", { ascending: false });

      if (usersError) {
        addDiagnostic({
          step: "2. Verificar utilizadores existentes",
          status: "error",
          message: "❌ Erro ao consultar utilizadores",
          details: usersError.message,
        });
      } else {
        const adminCount = existingUsers?.filter(u => u.role === "admin").length || 0;
        addDiagnostic({
          step: "2. Verificar utilizadores existentes",
          status: existingUsers && existingUsers.length > 0 ? "success" : "warning",
          message: `${existingUsers?.length || 0} utilizadores encontrados (${adminCount} admins)`,
          details: existingUsers && existingUsers.length > 0 
            ? existingUsers.map(u => `${u.email} (${u.role})`).join(", ")
            : "Nenhum utilizador encontrado",
        });
      }

      // Step 3: Check if admin@arroios.com exists
      addDiagnostic({
        step: "3. Verificar admin@arroios.com",
        status: "pending",
        message: "Procurando admin padrão...",
      });

      const { data: existingAdmin } = await supabase
        .from("users")
        .select("*")
        .eq("email", "admin@arroios.com")
        .maybeSingle();

      if (existingAdmin) {
        addDiagnostic({
          step: "3. Verificar admin@arroios.com",
          status: "success",
          message: "✅ Admin encontrado",
          details: `Nome: ${existingAdmin.full_name}, Role: ${existingAdmin.role}`,
        });

        // Try to login with default password
        addDiagnostic({
          step: "4. Testar password padrão",
          status: "pending",
          message: "Testando Admin123!...",
        });

        const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
          email: "admin@arroios.com",
          password: "Admin123!",
        });

        if (loginError) {
          addDiagnostic({
            step: "4. Testar password padrão",
            status: "warning",
            message: "⚠️ Password padrão não funciona",
            details: `Erro: ${loginError.message}. Use 'Testar Login' abaixo com a password correta.`,
          });
        } else {
          await supabase.auth.signOut();
          addDiagnostic({
            step: "4. Testar password padrão",
            status: "success",
            message: "✅ Login bem-sucedido!",
            details: "As credenciais padrão funcionam corretamente",
          });
          setAdminCreated(true);
          setAdminCredentials({ email: "admin@arroios.com", password: "Admin123!" });
        }
      } else {
        addDiagnostic({
          step: "3. Verificar admin@arroios.com",
          status: "warning",
          message: "⚠️ Admin não existe",
          details: "Será criado agora usando SQL",
        });

        // Step 4: Create admin using SQL (more reliable)
        addDiagnostic({
          step: "4. Criar admin via SQL",
          status: "pending",
          message: "Criando utilizador admin...",
        });

        // First, try to create via signUp (simpler method)
        const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
          email: "admin@arroios.com",
          password: "Admin123!",
          options: {
            data: {
              full_name: "Administrador",
            },
            emailRedirectTo: undefined,
          },
        });

        if (signUpError) {
          addDiagnostic({
            step: "4. Criar admin via SQL",
            status: "error",
            message: "❌ Erro ao criar no Auth",
            details: signUpError.message,
          });
          setIsRunning(false);
          return;
        }

        if (!signUpData.user) {
          addDiagnostic({
            step: "4. Criar admin via SQL",
            status: "error",
            message: "❌ SignUp não retornou utilizador",
            details: "Possível problema com configurações do Supabase Auth",
          });
          setIsRunning(false);
          return;
        }

        // Create user record in users table
        const { error: userRecordError } = await supabase
          .from("users")
          .insert({
            id: signUpData.user.id,
            email: "admin@arroios.com",
            full_name: "Administrador",
            role: "admin",
          });

        if (userRecordError) {
          addDiagnostic({
            step: "4. Criar admin via SQL",
            status: "error",
            message: "❌ Erro ao criar registo na tabela users",
            details: userRecordError.message,
          });
        } else {
          addDiagnostic({
            step: "4. Criar admin via SQL",
            status: "success",
            message: "✅ Admin criado com sucesso!",
            details: "Utilizador criado no Auth e na tabela users",
          });

          // Now test the login
          addDiagnostic({
            step: "5. Verificar login do novo admin",
            status: "pending",
            message: "Testando credenciais...",
          });

          // Wait a bit for Supabase to process
          await new Promise(resolve => setTimeout(resolve, 2000));

          const { data: testLoginData, error: testLoginError } = await supabase.auth.signInWithPassword({
            email: "admin@arroios.com",
            password: "Admin123!",
          });

          if (testLoginError) {
            addDiagnostic({
              step: "5. Verificar login do novo admin",
              status: "warning",
              message: "⚠️ Admin criado mas login falhou",
              details: `${testLoginError.message}. Isto pode ser problema de confirmação de email. Verifique Supabase Dashboard > Authentication > Settings > Disable email confirmations`,
            });
          } else {
            await supabase.auth.signOut();
            addDiagnostic({
              step: "5. Verificar login do novo admin",
              status: "success",
              message: "✅ Login testado com sucesso!",
              details: "Credenciais verificadas e funcionando",
            });
            setAdminCreated(true);
            setAdminCredentials({ email: "admin@arroios.com", password: "Admin123!" });
          }
        }
      }
    } catch (error: any) {
      addDiagnostic({
        step: "Erro Geral",
        status: "error",
        message: "❌ Erro inesperado",
        details: error.message,
      });
    } finally {
      setIsRunning(false);
    }
  };

  const testLogin = async () => {
    setIsTesting(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: testEmail,
        password: testPassword,
      });

      if (error) {
        toast({
          title: "❌ Erro no Login",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data.user) {
        toast({
          title: "✅ Login bem-sucedido!",
          description: `Autenticado como ${data.user.email}`,
        });
        
        await supabase.auth.signOut();
      }
    } catch (error: any) {
      toast({
        title: "❌ Erro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: DiagnosticResult["status"]) => {
    switch (status) {
      case "success":
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case "error":
        return <XCircle className="h-5 w-5 text-red-600" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case "pending":
        return <Loader2 className="h-5 w-5 text-blue-600 animate-spin" />;
    }
  };

  return (
    <>
      <SEO
        title="Setup Admin | Gestão Arroios"
        description="Configuração inicial de administrador"
      />
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-12 px-4">
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                🔧 Setup Administrador
              </h1>
              <p className="text-gray-600">
                Diagnóstico e criação de utilizador administrador
              </p>
            </div>

            {/* Diagnostic Card */}
            <Card>
              <CardHeader>
                <CardTitle>Diagnóstico do Sistema</CardTitle>
                <CardDescription>
                  Verifica configuração e cria admin automaticamente se necessário
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={runDiagnostics}
                  disabled={isRunning}
                  className="w-full"
                  size="lg"
                >
                  {isRunning ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      A executar diagnóstico...
                    </>
                  ) : (
                    <>
                      <User className="mr-2 h-5 w-5" />
                      Executar Diagnóstico
                    </>
                  )}
                </Button>

                {diagnostics.length > 0 && (
                  <div className="space-y-3 mt-6">
                    {diagnostics.map((diagnostic, index) => (
                      <Alert
                        key={index}
                        variant={
                          diagnostic.status === "error"
                            ? "destructive"
                            : "default"
                        }
                        className={
                          diagnostic.status === "success"
                            ? "border-green-200 bg-green-50"
                            : diagnostic.status === "warning"
                            ? "border-yellow-200 bg-yellow-50"
                            : ""
                        }
                      >
                        <div className="flex items-start gap-3">
                          {getStatusIcon(diagnostic.status)}
                          <div className="flex-1">
                            <div className="font-semibold">{diagnostic.step}</div>
                            <AlertDescription>
                              {diagnostic.message}
                              {diagnostic.details && (
                                <div className="mt-1 text-xs opacity-80">
                                  {diagnostic.details}
                                </div>
                              )}
                            </AlertDescription>
                          </div>
                        </div>
                      </Alert>
                    ))}
                  </div>
                )}

                {adminCreated && adminCredentials && (
                  <Alert className="bg-green-50 border-green-200 mt-6">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <AlertDescription className="ml-2">
                      <div className="font-semibold text-green-900 text-lg mb-3">
                        ✅ Sistema pronto para usar!
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                          <div>
                            <div className="text-xs text-green-700 font-medium">📧 Email:</div>
                            <code className="text-sm font-mono text-green-900">{adminCredentials.email}</code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(adminCredentials.email, "Email")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="flex items-center justify-between bg-white p-3 rounded border border-green-200">
                          <div>
                            <div className="text-xs text-green-700 font-medium">🔑 Password:</div>
                            <code className="text-sm font-mono text-green-900">{adminCredentials.password}</code>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => copyToClipboard(adminCredentials.password, "Password")}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="mt-4 pt-4 border-t border-green-200">
                          <Link
                            href="/login"
                            className="inline-block w-full text-center bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors"
                          >
                            → Ir para página de login
                          </Link>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>

            {/* Test Login Card */}
            <Card>
              <CardHeader>
                <CardTitle>Testar Login</CardTitle>
                <CardDescription>
                  Teste credenciais de login diretamente aqui
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="test-email">Email</Label>
                  <Input
                    id="test-email"
                    type="email"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                    disabled={isTesting}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="test-password">Password</Label>
                  <Input
                    id="test-password"
                    type="password"
                    value={testPassword}
                    onChange={(e) => setTestPassword(e.target.value)}
                    disabled={isTesting}
                  />
                </div>

                <Button
                  onClick={testLogin}
                  disabled={isTesting}
                  className="w-full"
                  variant="secondary"
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      A testar...
                    </>
                  ) : (
                    "Testar Login"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Instructions Card */}
            <Card>
              <CardHeader>
                <CardTitle>📋 Instruções & Troubleshooting</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4 text-sm">
                <div>
                  <div className="font-semibold mb-2 text-base">🚀 Passos Rápidos:</div>
                  <ol className="list-decimal list-inside space-y-1 text-gray-600">
                    <li>Clique em "Executar Diagnóstico"</li>
                    <li>Aguarde a conclusão (todos os passos com ✅)</li>
                    <li>Use o botão "Copiar" para copiar email e password</li>
                    <li>Clique em "Ir para página de login"</li>
                    <li>Cole as credenciais e faça login</li>
                  </ol>
                </div>

                <div className="border-t pt-4">
                  <div className="font-semibold mb-2 text-base text-amber-700">⚠️ Se o login falhar:</div>
                  <div className="space-y-2 text-gray-600">
                    <div>
                      <span className="font-medium">1. Verificar Email Confirmation:</span>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Aceder Supabase Dashboard</li>
                        <li>Authentication → Settings</li>
                        <li>Scroll até "Email Auth"</li>
                        <li>DESATIVAR "Enable email confirmations"</li>
                        <li>Salvar e tentar novamente</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium">2. Verificar no Dashboard:</span>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Authentication → Users</li>
                        <li>Procurar admin@arroios.com</li>
                        <li>Se não aparecer, executar diagnóstico novamente</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <span className="font-medium">3. Usar "Testar Login":</span>
                      <ul className="list-disc list-inside ml-4 mt-1">
                        <li>Inserir email e password no formulário acima</li>
                        <li>Ver mensagem de erro detalhada</li>
                        <li>Partilhar erro comigo para ajudar</li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <div className="font-semibold mb-2 text-base text-blue-700">💡 Dicas:</div>
                  <ul className="list-disc list-inside space-y-1 text-gray-600">
                    <li>Credenciais padrão: admin@arroios.com / Admin123!</li>
                    <li>Após login, pode alterar a password em Configurações</li>
                    <li>Pode criar mais admins em /admin/utilizadores</li>
                    <li>Esta página pode ser removida após setup inicial</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </MainLayout>
    </>
  );
}