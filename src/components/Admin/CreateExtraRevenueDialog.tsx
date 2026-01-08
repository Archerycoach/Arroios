import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface CreateExtraRevenueDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editRevenue?: any;
}

export function CreateExtraRevenueDialog({ open, onOpenChange, onSuccess, editRevenue }: CreateExtraRevenueDialogProps) {
  const [formData, setFormData] = useState({
    type: "other",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    booking_id: "",
    payment_method: "credit_card",
  });
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState<any[]>([]);
  
  // Track if we've already loaded data for current editRevenue
  const lastEditRevenueId = useRef<string | null>(null);

  const loadBookings = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_number,
          guests (
            full_name
          ),
          rooms (
            room_number
          )
        `)
        .order("created_at", { ascending: false })
        .limit(50);

      if (error) throw error;
      setBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  }, []);

  // Load bookings only when dialog opens
  useEffect(() => {
    if (open) {
      loadBookings();
    }
  }, [open, loadBookings]);

  // Load edit data only when editRevenue changes
  useEffect(() => {
    if (!open) {
      // Reset tracking when dialog closes
      lastEditRevenueId.current = null;
      return;
    }

    const currentEditId = editRevenue?.id || null;
    
    // Only update if this is a new edit or switching from edit to create
    if (lastEditRevenueId.current !== currentEditId) {
      lastEditRevenueId.current = currentEditId;
      
      if (editRevenue) {
        // Load edit data
        setFormData({
          type: editRevenue.type || "other",
          description: editRevenue.description || "",
          amount: editRevenue.amount?.toString() || "",
          date: editRevenue.date || new Date().toISOString().split("T")[0],
          booking_id: editRevenue.booking_id || "",
          payment_method: editRevenue.payment_method || "credit_card",
        });
      } else {
        // Reset form for create mode
        setFormData({
          type: "other",
          description: "",
          amount: "",
          date: new Date().toISOString().split("T")[0],
          booking_id: "",
          payment_method: "credit_card",
        });
      }
    }
  }, [open, editRevenue]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const revenueData = {
        type: formData.type,
        description: formData.description,
        amount: parseFloat(formData.amount),
        date: formData.date,
        booking_id: formData.booking_id || null,
      };

      if (editRevenue) {
        // Update existing revenue
        const { error } = await supabase
          .from("extra_revenues")
          .update(revenueData)
          .eq("id", editRevenue.id);

        if (error) throw error;
      } else {
        // Create new revenue
        const { error } = await supabase
          .from("extra_revenues")
          .insert([revenueData]);

        if (error) throw error;
      }

      onSuccess();
      onOpenChange(false);

      // Reset form
      setFormData({
        type: "other",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        booking_id: "",
        payment_method: "credit_card",
      });
      lastEditRevenueId.current = null;
    } catch (error) {
      console.error("Error saving extra revenue:", error);
      alert(`Erro ao ${editRevenue ? "atualizar" : "criar"} receita extra`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editRevenue ? "Editar" : "Nova"} Receita Extra</DialogTitle>
          <DialogDescription>
            {editRevenue ? "Atualize" : "Adicione"} uma receita que não seja de reserva de quarto
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo de Receita *</Label>
            <Select 
              value={formData.type} 
              onValueChange={(value) => setFormData({ ...formData, type: value })}
            >
              <SelectTrigger id="type">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="breakfast">🍽️ Pequeno-almoço</SelectItem>
                <SelectItem value="cleaning">🧹 Limpeza Extra</SelectItem>
                <SelectItem value="laundry">🧺 Lavandaria</SelectItem>
                <SelectItem value="transfer">🚗 Transfer</SelectItem>
                <SelectItem value="extra_bed">🛏️ Cama Extra</SelectItem>
                <SelectItem value="crib">🍼 Berço</SelectItem>
                <SelectItem value="late_checkout">🕐 Late Check-out</SelectItem>
                <SelectItem value="early_checkin">🕐 Early Check-in</SelectItem>
                <SelectItem value="minibar">📦 Minibar</SelectItem>
                <SelectItem value="parking">🅿️ Estacionamento</SelectItem>
                <SelectItem value="pet_fee">🐕 Pet Fee</SelectItem>
                <SelectItem value="other">💰 Outras</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Descrição *</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Descreva a receita extra..."
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="amount">Valor (€) *</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0"
              value={formData.amount}
              onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
              placeholder="0.00"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">Data *</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="booking_id">Reserva Associada (Opcional)</Label>
            <Select value={formData.booking_id} onValueChange={(value) => setFormData({ ...formData, booking_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Nenhuma" />
              </SelectTrigger>
              <SelectContent>
                {bookings.map((booking) => (
                  <SelectItem key={booking.id} value={booking.id}>
                    #{booking.booking_number} - {booking.guests?.full_name} (Quarto {booking.rooms?.room_number})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="payment_method">Método de Pagamento</Label>
            <Select value={formData.payment_method} onValueChange={(value) => setFormData({ ...formData, payment_method: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o método" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="credit_card">💳 Cartão de Crédito</SelectItem>
                <SelectItem value="debit_card">💳 Cartão de Débito</SelectItem>
                <SelectItem value="cash">💵 Dinheiro</SelectItem>
                <SelectItem value="bank_transfer">🏦 Transferência</SelectItem>
                <SelectItem value="other">🔧 Outro</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editRevenue ? "Atualizar" : "Criar"} Receita
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}