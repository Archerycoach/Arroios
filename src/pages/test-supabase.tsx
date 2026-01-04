import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";

export default function TestSupabasePage() {
  const [status, setStatus] = useState<{
    connection: "loading" | "success" | "error";
    auth: "loading" | "success" | "error";
    database: "loading" | "success" | "error";
    errors: string[];
  }>({
    connection: "loading",
    auth: "loading",
    database: "loading",
    errors: [],
  });

  useEffect(() => {
    testConnection();
  }, []);

  const testConnection = async () => {
    const errors: string[] = [];

    // Test 1: Check if Supabase client is initialized
    console.log("🔵 Testing Supabase connection...");
    try {
      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }
      console.log("✅ Supabase client initialized");
      setStatus((prev) => ({ ...prev, connection: "success" }));
    } catch (error: any) {
      console.error("❌ Supabase client error:", error);
      errors.push(`Connection: ${error.message}`);
      setStatus((prev) => ({ ...prev, connection: "error" }));
    }

    // Test 2: Check Auth
    console.log("🔵 Testing Supabase Auth...");
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      console.log("✅ Supabase Auth working:", data);
      setStatus((prev) => ({ ...prev, auth: "success" }));
    } catch (error: any) {
      console.error("❌ Supabase Auth error:", error);
      errors.push(`Auth: ${error.message}`);
      setStatus((prev) => ({ ...prev, auth: "error" }));
    }

    // Test 3: Check Database
    console.log("🔵 Testing Supabase Database...");
    try {
      const { data, error } = await supabase.from("properties").select("id").limit(1);
      if (error) throw error;
      console.log("✅ Supabase Database working:", data);
      setStatus((prev) => ({ ...prev, database: "success" }));
    } catch (error: any) {
      console.error("❌ Supabase Database error:", error);
      errors.push(`Database: ${error.message}`);
      setStatus((prev) => ({ ...prev, database: "error" }));
    }

    setStatus((prev) => ({ ...prev, errors }));
  };

  const StatusIcon = ({ status }: { status: "loading" | "success" | "error" }) => {
    if (status === "loading") return <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />;
    if (status === "success") return <CheckCircle className="w-5 h-5 text-green-500" />;
    return <XCircle className="w-5 h-5 text-red-500" />;
  };

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8">Teste de Conexão Supabase</h1>

          <Card>
            <CardHeader>
              <CardTitle>Status da Conexão</CardTitle>
              <CardDescription>
                Verificando conectividade com o Supabase
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Cliente Supabase</p>
                  <p className="text-sm text-muted-foreground">Inicialização do cliente</p>
                </div>
                <StatusIcon status={status.connection} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Supabase Auth</p>
                  <p className="text-sm text-muted-foreground">Sistema de autenticação</p>
                </div>
                <StatusIcon status={status.auth} />
              </div>

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <p className="font-medium">Base de Dados</p>
                  <p className="text-sm text-muted-foreground">Acesso às tabelas</p>
                </div>
                <StatusIcon status={status.database} />
              </div>

              {status.errors.length > 0 && (
                <div className="p-4 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="font-medium text-red-900 dark:text-red-100 mb-2">Erros Detectados:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {status.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-800 dark:text-red-200">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button onClick={testConnection} className="w-full">
                Testar Novamente
              </Button>

              <div className="p-4 bg-muted rounded-lg">
                <p className="text-sm font-medium mb-2">Configuração Atual:</p>
                <div className="text-xs space-y-1 font-mono">
                  <p>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL || "Não configurado"}</p>
                  <p>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? "✓ Configurado" : "✗ Não configurado"}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-8 p-4 bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg">
            <p className="text-sm text-blue-900 dark:text-blue-100">
              <strong>Nota:</strong> Se todos os testes passarem, o Supabase está configurado corretamente. 
              Se houver erros, verifique o ficheiro <code className="bg-blue-100 dark:bg-blue-900 px-1 rounded">.env.local</code> 
              e certifique-se de que as variáveis de ambiente estão corretas.
            </p>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}