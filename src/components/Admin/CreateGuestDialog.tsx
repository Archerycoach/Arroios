import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { guestService } from "@/services/guestService";

interface CreateGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editGuest?: any;
}

export function CreateGuestDialog({ open, onOpenChange, onSuccess, editGuest }: CreateGuestDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    nationality: "",
    tax_id: "",
    document_type: "passport",
    document_number: "",
    city: "",
    postal_code: "",
    country: "",
    notes: "",
  });

  // Load guest data when editGuest changes
  useEffect(() => {
    if (editGuest) {
      setFormData({
        full_name: editGuest.full_name || "",
        email: editGuest.email || "",
        phone: editGuest.phone || "",
        address: editGuest.address || "",
        date_of_birth: editGuest.date_of_birth || "",
        nationality: editGuest.nationality || "",
        tax_id: editGuest.tax_id || "",
        document_type: editGuest.document_type || "passport",
        document_number: editGuest.document_number || "",
        city: editGuest.city || "",
        postal_code: editGuest.postal_code || "",
        country: editGuest.country || "",
        notes: editGuest.notes || "",
      });
    } else {
      resetForm();
    }
  }, [editGuest, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // Prepare data - empty strings will be converted to null by sanitizeForDatabase
      const guestData = {
        full_name: formData.full_name,
        email: formData.email,
        phone: formData.phone,
        document_type: formData.document_type as any,
        document_number: formData.document_number,
        date_of_birth: formData.date_of_birth,
        nationality: formData.nationality,
        address: formData.address,
        city: formData.city,
        postal_code: formData.postal_code,
        country: formData.country,
        tax_id: formData.tax_id,
        notes: formData.notes,
      };

      if (editGuest) {
        await guestService.update(editGuest.id, guestData);
      } else {
        await guestService.create(guestData);
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving guest:", error);
      alert("Erro ao guardar cliente. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "",
      address: "",
      date_of_birth: "",
      nationality: "",
      tax_id: "",
      document_type: "passport",
      document_number: "",
      city: "",
      postal_code: "",
      country: "",
      notes: "",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editGuest ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          <DialogDescription>
            {editGuest ? "Atualizar informações do cliente" : "Adicionar um novo cliente ao sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* Full Name */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="full_name">
                Nome Completo <span className="text-destructive">*</span>
              </Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                placeholder="João Silva"
                required
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">
                Email <span className="text-destructive">*</span>
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="joao@email.com"
                required
              />
            </div>

            {/* Phone */}
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+351 912 345 678"
              />
            </div>

            {/* Date of Birth */}
            <div className="space-y-2">
              <Label htmlFor="date_of_birth">Data de Nascimento</Label>
              <Input
                type="date"
                id="date_of_birth"
                value={formData.date_of_birth}
                onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
              />
            </div>

            {/* Nationality */}
            <div className="space-y-2">
              <Label htmlFor="nationality">Nacionalidade</Label>
              <Input
                id="nationality"
                value={formData.nationality}
                onChange={(e) => setFormData({ ...formData, nationality: e.target.value })}
                placeholder="Portugal"
              />
            </div>

            {/* Tax ID (NIF) */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="tax_id">Nº de Contribuinte (NIF)</Label>
              <Input
                id="tax_id"
                value={formData.tax_id}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
                placeholder="123456789"
              />
            </div>

            {/* Document Type */}
            <div className="space-y-2">
              <Label htmlFor="document_type">Tipo de Documento</Label>
              <select
                id="document_type"
                value={formData.document_type}
                onChange={(e) => setFormData({ ...formData, document_type: e.target.value })}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <option value="passport">Passaporte</option>
                <option value="id_card">Cartão de Cidadão</option>
                <option value="drivers_license">Carta de Condução</option>
              </select>
            </div>

            {/* Document Number */}
            <div className="space-y-2">
              <Label htmlFor="document_number">Número do Documento</Label>
              <Input
                id="document_number"
                value={formData.document_number}
                onChange={(e) => setFormData({ ...formData, document_number: e.target.value })}
                placeholder="AB123456"
              />
            </div>

            {/* Address */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="address">Morada</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Rua das Flores, 123"
              />
            </div>

            {/* City */}
            <div className="space-y-2">
              <Label htmlFor="city">Cidade</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Lisboa"
              />
            </div>

            {/* Postal Code */}
            <div className="space-y-2">
              <Label htmlFor="postal_code">Código Postal</Label>
              <Input
                id="postal_code"
                value={formData.postal_code}
                onChange={(e) => setFormData({ ...formData, postal_code: e.target.value })}
                placeholder="1150-055"
              />
            </div>

            {/* Country */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="country">País</Label>
              <Input
                id="country"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                placeholder="Portugal"
              />
            </div>

            {/* Notes */}
            <div className="space-y-2 col-span-2">
              <Label htmlFor="notes">Notas</Label>
              <Input
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Observações sobre o cliente..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (editGuest ? "A atualizar..." : "A criar...") : (editGuest ? "Atualizar Cliente" : "Criar Cliente")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}