import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { paymentService } from "@/services/paymentService";
import { bankAccountService } from "@/services/bankAccountService";
import type { Database } from "@/integrations/supabase/types";

type BookingPayment = Database["public"]["Tables"]["payments"]["Row"];
type BankAccount = Database["public"]["Tables"]["bank_accounts"]["Row"];

interface EditPaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: BookingPayment;
  onSuccess: () => void;
}

export function EditPaymentDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: EditPaymentDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [formData, setFormData] = useState({
    paid_date: payment.paid_at ? new Date(payment.paid_at).toISOString().split("T")[0] : "",
    payment_method: payment.payment_method || "cash",
    bank_account_id: payment.bank_account_id || "",
    notes: payment.notes || "",
  });

  // Load bank accounts when dialog opens
  React.useEffect(() => {
    if (open) {
      loadBankAccounts();
      // Reset form data when dialog opens
      setFormData({
        paid_date: payment.paid_at ? new Date(payment.paid_at).toISOString().split("T")[0] : "",
        payment_method: payment.payment_method || "cash",
        bank_account_id: payment.bank_account_id || "",
        notes: payment.notes || "",
      });
    }
  }, [open, payment]);

  const loadBankAccounts = async () => {
    try {
      const accounts = await bankAccountService.getActive();
      setBankAccounts(accounts);
    } catch (error) {
      console.error("Error loading bank accounts:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Explicitly type the payment method to satisfy TypeScript
    // We use 'as any' here because the service expects a specific union type but the form string is compatible at runtime
    const result = await paymentService.updatePayment(
      payment.id,
      payment.amount,
      payment.status as "completed" | "refunded" | "pending",
      formData.paid_date,
      formData.payment_method as any, 
      formData.notes || undefined,
      formData.bank_account_id || undefined
    );

    if (result.success) {
      toast({
        title: "Pagamento atualizado",
        description: "O pagamento foi atualizado com sucesso.",
      });
      onSuccess();
      onOpenChange(false);
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível atualizar o pagamento.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "monthly":
        return "Mensalidade";
      case "deposit":
        return "Caução de Segurança";
      case "deposit_refund":
        return "Devolução de Caução";
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Pagamento</DialogTitle>
          <DialogDescription>
            Editar {getPaymentTypeLabel(payment.payment_type || "")} de €{payment.amount.toFixed(2)}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Payment Date */}
            <div className="space-y-2">
              <Label htmlFor="paid_date">Data do Pagamento *</Label>
              <Input
                id="paid_date"
                type="date"
                value={formData.paid_date}
                onChange={(e) =>
                  setFormData({ ...formData, paid_date: e.target.value })
                }
                required
              />
            </div>

            {/* Payment Method */}
            <div className="space-y-2">
              <Label htmlFor="payment_method">Método de Pagamento *</Label>
              <Select
                value={formData.payment_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, payment_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="bank_transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="credit_card">Cartão de Crédito</SelectItem>
                  <SelectItem value="debit_card">Cartão de Débito</SelectItem>
                  <SelectItem value="mbway">MB WAY</SelectItem>
                  <SelectItem value="other">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Bank Account */}
            <div className="space-y-2">
              <Label htmlFor="bank_account_id">Conta Bancária</Label>
              <Select
                value={formData.bank_account_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, bank_account_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a conta bancária" />
                </SelectTrigger>
                <SelectContent>
                  {bankAccounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name} ({account.bank_name})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas (opcional)</Label>
              <Textarea
                id="notes"
                placeholder="Adicione notas sobre este pagamento..."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "A atualizar..." : "Atualizar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}