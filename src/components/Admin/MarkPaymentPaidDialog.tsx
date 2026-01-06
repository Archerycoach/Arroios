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
import type { Database } from "@/integrations/supabase/types";

type BookingPayment = Database["public"]["Tables"]["booking_payments"]["Row"];

interface MarkPaymentPaidDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  payment: BookingPayment;
  onSuccess: () => void;
}

export function MarkPaymentPaidDialog({
  open,
  onOpenChange,
  payment,
  onSuccess,
}: MarkPaymentPaidDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    paid_date: new Date().toISOString().split("T")[0],
    payment_method: "cash" as string,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await paymentService.markPaymentAsPaid(
      payment.id,
      formData.paid_date,
      formData.payment_method,
      formData.notes || undefined
    );

    if (result.success) {
      toast({
        title: "Pagamento registado",
        description: "O pagamento foi marcado como pago com sucesso.",
      });
      onSuccess();
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível registar o pagamento.",
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
      default:
        return type;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Registar Pagamento</DialogTitle>
          <DialogDescription>
            Marcar {getPaymentTypeLabel(payment.payment_type)} de €{payment.amount.toFixed(2)} como pago
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
                  <SelectItem value="transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="card">Cartão</SelectItem>
                  <SelectItem value="mbway">MBWay</SelectItem>
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
              {loading ? "A registar..." : "Registar Pagamento"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}