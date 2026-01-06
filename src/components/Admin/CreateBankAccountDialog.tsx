import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { bankAccountService } from "@/services/bankAccountService";

interface CreateBankAccountDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBankAccountDialog({ open, onOpenChange, onSuccess }: CreateBankAccountDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    bank_name: "",
    iban: "",
    swift_bic: "",
    account_holder: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name.trim()) {
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Nome da conta é obrigatório",
      });
      return;
    }

    try {
      setLoading(true);
      await bankAccountService.create({
        ...formData,
        is_active: true,
      });

      toast({
        title: "Conta criada",
        description: "Conta bancária criada com sucesso",
      });

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating bank account:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao criar conta bancária",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      bank_name: "",
      iban: "",
      swift_bic: "",
      account_holder: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Nova Conta Bancária</DialogTitle>
          <DialogDescription>
            Adicionar uma nova conta bancária ao sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">
              Nome da Conta <span className="text-destructive">*</span>
            </Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Conta Principal, Conta Quartos, etc."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="bank_name">Banco</Label>
            <Input
              id="bank_name"
              value={formData.bank_name}
              onChange={(e) => setFormData({ ...formData, bank_name: e.target.value })}
              placeholder="Ex: Millennium BCP, Santander, etc."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="iban">IBAN</Label>
            <Input
              id="iban"
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              placeholder="PT50 0000 0000 0000 0000 0000 0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="swift_bic">SWIFT/BIC</Label>
            <Input
              id="swift_bic"
              value={formData.swift_bic}
              onChange={(e) => setFormData({ ...formData, swift_bic: e.target.value })}
              placeholder="Ex: BCOMPTPL"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="account_holder">Titular da Conta</Label>
            <Input
              id="account_holder"
              value={formData.account_holder}
              onChange={(e) => setFormData({ ...formData, account_holder: e.target.value })}
              placeholder="Nome do titular"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Notas</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Informações adicionais sobre a conta"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A criar..." : "Criar Conta"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}