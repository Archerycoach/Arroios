import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { roomService } from "@/services/roomService";
import { propertyService } from "@/services/propertyService";
import { Euro } from "lucide-react";
import { RoomType } from "@/types";

interface CreateRoomDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editRoom?: any;
}

export function CreateRoomDialog({ open, onOpenChange, onSuccess, editRoom }: CreateRoomDialogProps) {
  const [propertyId, setPropertyId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    room_number: "",
    name: "",
    description: "",
    room_type: "Standard" as RoomType,
    daily_price: 0,
    biweekly_price: 0,
    monthly_price: 0,
    max_guests: 1,
    floor: 0,
    is_available: true,
    amenities: [] as string[],
  });

  // Fetch property_id on mount
  useEffect(() => {
    const fetchPropertyId = async () => {
      try {
        const properties = await propertyService.getAll();
        if (properties && properties.length > 0) {
          setPropertyId(properties[0].id);
        } else {
          // Fallback to known property ID if no properties found
          setPropertyId("ea17138c-f8ac-42d9-a62a-173ca0c61f50");
        }
      } catch (error) {
        console.error("Error fetching property:", error);
        // Use fallback property ID
        setPropertyId("ea17138c-f8ac-42d9-a62a-173ca0c61f50");
      }
    };
    
    fetchPropertyId();
  }, []);

  useEffect(() => {
    if (editRoom) {
      setFormData({
        room_number: editRoom.room_number || "",
        name: editRoom.name || "",
        description: editRoom.description || "",
        room_type: editRoom.room_type as RoomType,
        daily_price: editRoom.daily_price || editRoom.base_price || 0,
        biweekly_price: editRoom.biweekly_price || 0,
        monthly_price: editRoom.monthly_price || 0,
        max_guests: editRoom.max_guests,
        floor: editRoom.floor || 0,
        is_available: editRoom.is_available,
        amenities: editRoom.amenities || [],
      });
    } else {
      setFormData({
        room_number: "",
        name: "",
        description: "",
        room_type: "Standard",
        daily_price: 0,
        biweekly_price: 0,
        monthly_price: 0,
        max_guests: 1,
        floor: 0,
        is_available: true,
        amenities: [],
      });
    }
  }, [editRoom, open]);

  const resetForm = () => {
    setFormData({
      name: "",
      room_number: "",
      room_type: "Standard",
      floor: 0,
      daily_price: 0,
      biweekly_price: 0,
      monthly_price: 0,
      max_guests: 1,
      is_available: true,
      amenities: [],
      description: "",
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.room_number) {
      alert("Por favor, preencha todos os campos obrigatórios");
      return;
    }

    // Validate that at least one price is provided
    if (!formData.daily_price && !formData.biweekly_price && !formData.monthly_price) {
      alert("Por favor, preencha pelo menos um dos preços (diário, quinzenal ou mensal)");
      return;
    }

    // Validate that property_id is available
    if (!propertyId) {
      alert("Erro: Não foi possível obter o ID da propriedade. Por favor, contacte o suporte.");
      return;
    }

    try {
      const roomData = {
        property_id: propertyId,  // ✅ Use dynamic property_id
        room_number: formData.room_number,
        name: formData.name,
        description: formData.description || undefined,
        room_type: formData.room_type,
        daily_price: formData.daily_price,
        biweekly_price: formData.biweekly_price || null,
        monthly_price: formData.monthly_price || null,
        base_price: formData.daily_price, // Keep for backward compatibility
        max_guests: formData.max_guests,
        floor: formData.floor,
        is_available: formData.is_available,
        amenities: formData.amenities,
        images: editRoom?.images || [],
      };

      if (editRoom) {
        await roomService.update(editRoom.id, roomData);
      } else {
        await roomService.create(roomData);
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving room:", error);
      alert("Erro ao guardar quarto");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{editRoom ? "Editar" : "Novo"} Quarto</DialogTitle>
          <DialogDescription>
            {editRoom ? "Atualize" : "Adicione"} os detalhes do quarto
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="name">Nome do Quarto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Ex: Quarto 101"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="room_number">Número do Quarto *</Label>
                <Input
                  id="room_number"
                  value={formData.room_number}
                  onChange={(e) => setFormData({ ...formData, room_number: e.target.value })}
                  placeholder="Ex: 101"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="room_type">Tipo de Quarto *</Label>
                <Select 
                  value={formData.room_type} 
                  onValueChange={(value: RoomType) => setFormData({ ...formData, room_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Standard">Standard</SelectItem>
                    <SelectItem value="Suite">Suite</SelectItem>
                    <SelectItem value="Large">Large</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="floor">Piso *</Label>
                <Input
                  id="floor"
                  type="number"
                  value={formData.floor}
                  onChange={(e) => setFormData({ ...formData, floor: parseInt(e.target.value) || 0 })}
                  placeholder="Ex: 1"
                  required
                />
              </div>
            </div>

            {/* Pricing Section */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">Preços *</Label>
              <p className="text-sm text-muted-foreground">
                Defina pelo menos um tipo de preço. Os restantes serão calculados automaticamente se não forem preenchidos.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="daily_price">Preço Diário</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="daily_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.daily_price}
                      onChange={(e) =>
                        setFormData({ ...formData, daily_price: parseFloat(e.target.value) || 0 })
                      }
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Por noite</p>
                </div>

                <div>
                  <Label htmlFor="biweekly_price">Preço Quinzenal</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="biweekly_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.biweekly_price}
                      onChange={(e) =>
                        setFormData({ ...formData, biweekly_price: parseFloat(e.target.value) || 0 })
                      }
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">15 dias</p>
                </div>

                <div>
                  <Label htmlFor="monthly_price">Preço Mensal</Label>
                  <div className="relative">
                    <Euro className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="monthly_price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.monthly_price}
                      onChange={(e) =>
                        setFormData({ ...formData, monthly_price: parseFloat(e.target.value) || 0 })
                      }
                      className="pl-9"
                      placeholder="0.00"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">30 dias</p>
                </div>
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="max_guests">Capacidade Máxima *</Label>
              <Input
                id="max_guests"
                type="number"
                min="1"
                value={formData.max_guests}
                onChange={(e) => setFormData({ ...formData, max_guests: parseInt(e.target.value) || 1 })}
                placeholder="Ex: 1"
                required
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="description">Descrição</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Descrição do quarto, amenities, etc..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit">
              {editRoom ? "Guardar" : "Criar"} Quarto
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}