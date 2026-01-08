import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { paymentService } from "@/services/paymentService";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";

export default function SincronizarPagamentos() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    synced: number;
    skipped: number;
    errors: number;
  } | null>(null);

  const handleSync = async () => {
    setLoading(true);
    setResult(null);

    try {
      const syncResult = await paymentService.syncPaymentsToRevenues();
      setResult(syncResult);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : "Erro desconhecido",
        synced: 0,
        skipped: 0,
        errors: 0,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <ProtectedAdminPage>
      <AdminLayout>
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Sincronizar Pagamentos</h1>
            <p className="text-muted-foreground mt-2">
              Migrar pagamentos existentes para receitas
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Migração de Dados</CardTitle>
              <CardDescription>
                Esta ferramenta irá sincronizar todos os pagamentos já confirmados com a tabela de receitas.
                Os pagamentos que já tiverem receitas associadas serão ignorados.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Explanation */}
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>O que esta ferramenta faz:</strong>
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Encontra todos os pagamentos marcados como "completados"</li>
                    <li>Verifica se já existe uma receita associada</li>
                    <li>Cria receitas automaticamente para os pagamentos sem receita</li>
                    <li>Preserva todas as informações (data, método, conta bancária, notas)</li>
                    <li>Categoriza como "Mensalidades" ou "Cauções"</li>
                  </ul>
                </AlertDescription>
              </Alert>

              {/* Sync Button */}
              <div className="flex justify-center">
                <Button
                  onClick={handleSync}
                  disabled={loading}
                  size="lg"
                  className="w-full max-w-md"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      A sincronizar...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-5 w-5" />
                      Sincronizar Pagamentos
                    </>
                  )}
                </Button>
              </div>

              {/* Results */}
              {result && (
                <Alert className={result.success ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}>
                  {result.success ? (
                    <CheckCircle2 className="h-4 w-4 text-green-600" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-600" />
                  )}
                  <AlertDescription>
                    <div className="space-y-2">
                      <p className="font-semibold">{result.message}</p>
                      <div className="grid grid-cols-3 gap-4 mt-3">
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-2xl font-bold text-green-600">{result.synced}</div>
                          <div className="text-sm text-muted-foreground">Sincronizados</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-2xl font-bold text-blue-600">{result.skipped}</div>
                          <div className="text-sm text-muted-foreground">Ignorados</div>
                        </div>
                        <div className="text-center p-3 bg-white rounded-lg border">
                          <div className="text-2xl font-bold text-red-600">{result.errors}</div>
                          <div className="text-sm text-muted-foreground">Erros</div>
                        </div>
                      </div>
                      {result.synced > 0 && (
                        <p className="text-sm mt-3 text-green-700">
                          ✅ As receitas foram criadas e já aparecem em /admin/receitas, /admin/financeiro e /admin/relatorios
                        </p>
                      )}
                    </div>
                  </AlertDescription>
                </Alert>
              )}

              {/* Info */}
              <div className="text-sm text-muted-foreground space-y-2">
                <p><strong>Nota:</strong> Esta operação é segura e pode ser executada múltiplas vezes.</p>
                <p>Pagamentos que já tiverem receitas não serão duplicados.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminPage>
  );
}