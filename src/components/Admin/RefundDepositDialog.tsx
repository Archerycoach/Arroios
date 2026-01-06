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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { paymentService } from "@/services/paymentService";
import { AlertCircle } from "lucide-react";

interface RefundDepositDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bookingId: string;
  depositAmount: number;
  onSuccess: () => void;
}

export function RefundDepositDialog({
  open,
  onOpenChange,
  bookingId,
  depositAmount,
  onSuccess,
}: RefundDepositDialogProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    refund_date: new Date().toISOString().split("T")[0],
    refund_method: "cash" as string,
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const result = await paymentService.refundDeposit(
      bookingId,
      formData.refund_date,
      formData.refund_method,
      formData.notes || undefined
    );

    if (result.success) {
      toast({
        title: "Caução devolvida",
        description: "A caução de segurança foi devolvida com sucesso.",
      });
      onSuccess();
    } else {
      toast({
        title: "Erro",
        description: result.error || "Não foi possível devolver a caução.",
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Devolver Caução de Segurança</DialogTitle>
          <DialogDescription>
            Registar devolução de €{depositAmount.toFixed(2)} ao cliente
          </DialogDescription>
        </DialogHeader>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Esta ação marca a caução como devolvida e cria um registo de devolução.
            Certifique-se de que o quarto foi inspecionado e não há danos.
          </AlertDescription>
        </Alert>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            {/* Refund Date */}
            <div className="space-y-2">
              <Label htmlFor="refund_date">Data da Devolução *</Label>
              <Input
                id="refund_date"
                type="date"
                value={formData.refund_date}
                onChange={(e) =>
                  setFormData({ ...formData, refund_date: e.target.value })
                }
                required
              />
            </div>

            {/* Refund Method */}
            <div className="space-y-2">
              <Label htmlFor="refund_method">Método de Devolução *</Label>
              <Select
                value={formData.refund_method}
                onValueChange={(value) =>
                  setFormData({ ...formData, refund_method: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Dinheiro</SelectItem>
                  <SelectItem value="transfer">Transferência Bancária</SelectItem>
                  <SelectItem value="mbway">MBWay</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label htmlFor="notes">Notas sobre o Estado do Quarto *</Label>
              <Textarea
                id="notes"
                placeholder="Ex: Quarto em perfeito estado, sem danos. Caução devolvida na íntegra."
                value={formData.notes}
                onChange={(e) =>
                  setFormData({ ...formData, notes: e.target.value })
                }
                rows={4}
                required
              />
              <p className="text-sm text-muted-foreground">
                Descreva o estado do quarto e se houve deduções da caução
              </p>
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
              {loading ? "A processar..." : "Confirmar Devolução"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}