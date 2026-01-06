import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Edit, Trash2, Building2, CreditCard, CheckCircle, XCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { bankAccountService } from "@/services/bankAccountService";
import { CreateBankAccountDialog } from "@/components/Admin/CreateBankAccountDialog";
import type { Database } from "@/integrations/supabase/types";

type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];

export default function ContasBancarias() {
  const { toast } = useToast();
  const [accounts, setAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await bankAccountService.getAll();
      setAccounts(data);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar contas bancárias",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: string, currentStatus: boolean) => {
    try {
      await bankAccountService.toggleActive(id, !currentStatus);
      toast({
        title: "Estado alterado",
        description: `Conta ${!currentStatus ? "ativada" : "desativada"} com sucesso`,
      });
      loadAccounts();
    } catch (error) {
      console.error("Error toggling account status:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao alterar estado da conta",
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Tem certeza que deseja deletar a conta "${name}"?`)) {
      return;
    }

    try {
      await bankAccountService.delete(id);
      toast({
        title: "Conta deletada",
        description: "Conta bancária deletada com sucesso",
      });
      loadAccounts();
    } catch (error) {
      console.error("Error deleting bank account:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao deletar conta. Verifique se não existem quartos ou pagamentos associados.",
      });
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Contas Bancárias</h1>
            <p className="text-muted-foreground">
              Gerir contas bancárias para associar aos quartos e pagamentos
            </p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nova Conta
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">A carregar contas...</p>
          </div>
        ) : accounts.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Building2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhuma conta bancária</h3>
              <p className="text-muted-foreground mb-4">
                Comece por criar uma conta bancária para associar aos quartos
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar Primeira Conta
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {accounts.map((account) => (
              <Card key={account.id} className={!account.is_active ? "opacity-60" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      <Building2 className="h-5 w-5" />
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                    </div>
                    {account.is_active ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <XCircle className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                  {account.bank_name && (
                    <CardDescription>{account.bank_name}</CardDescription>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {account.iban && (
                    <div className="flex items-center gap-2 text-sm">
                      <CreditCard className="h-4 w-4 text-muted-foreground" />
                      <span className="font-mono">{account.iban}</span>
                    </div>
                  )}

                  {account.swift_bic && (
                    <div className="text-sm text-muted-foreground">
                      SWIFT: {account.swift_bic}
                    </div>
                  )}

                  {account.account_holder && (
                    <div className="text-sm text-muted-foreground">
                      Titular: {account.account_holder}
                    </div>
                  )}

                  {account.notes && (
                    <div className="text-sm text-muted-foreground border-t pt-2 mt-2">
                      {account.notes}
                    </div>
                  )}

                  <div className="flex gap-2 pt-2">
                    <Button
                      variant={account.is_active ? "outline" : "default"}
                      size="sm"
                      onClick={() => handleToggleActive(account.id, account.is_active || false)}
                      className="flex-1"
                    >
                      {account.is_active ? "Desativar" : "Ativar"}
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDelete(account.id, account.name)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <CreateBankAccountDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onSuccess={loadAccounts}
      />
    </AdminLayout>
  );
}