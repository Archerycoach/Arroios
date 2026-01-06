import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { format, parseISO, isWithinInterval, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { UserPlus, AlertCircle, Calculator } from "lucide-react";
import { Room, Guest, PaymentType } from "@/types";
import { roomService } from "@/services/roomService";
import { guestService } from "@/services/guestService";
import { bookingService, BookingWithDetails } from "@/services/bookingService";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

export function CreateBookingDialog({ open, onOpenChange, onSuccess }: CreateBookingDialogProps) {
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [allBookings, setAllBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [dateConflictError, setDateConflictError] = useState<string>("");
  
  const [formData, setFormData] = useState({
    guest_id: "",
    room_id: "",
    check_in_date: "",
    check_out_date: "",
    payment_type: "daily" as PaymentType,
    custom_price: "",
    status: "confirmed" as const,
    special_requests: "",
  });

  const [newGuest, setNewGuest] = useState({
    full_name: "",
    email: "",
    phone: "",
    address: "",
    date_of_birth: "",
    nationality: "",
    tax_id: "",
  });

  useEffect(() => {
    if (open) {
      loadData();
      setDateConflictError("");
    }
  }, [open]);

  // Validate dates whenever room or dates change
  useEffect(() => {
    if (formData.room_id && formData.check_in_date && formData.check_out_date) {
      validateDates(formData.room_id, formData.check_in_date, formData.check_out_date);
    } else {
      setDateConflictError("");
    }
  }, [formData.room_id, formData.check_in_date, formData.check_out_date]);

  // Calculate price when room, dates, or payment type changes
  useEffect(() => {
    if (formData.room_id && formData.check_in_date && formData.check_out_date) {
      const calculatedPrice = calculatePrice();
      if (calculatedPrice > 0 && !formData.custom_price) {
        setFormData(prev => ({ ...prev, custom_price: calculatedPrice.toFixed(2) }));
      }
    }
  }, [formData.room_id, formData.check_in_date, formData.check_out_date, formData.payment_type]);

  const loadData = async () => {
    try {
      const [roomsData, guestsData, bookingsData] = await Promise.all([
        roomService.getAll(),
        guestService.getAll(),
        bookingService.getAll(),
      ]);
      setRooms(roomsData);
      setGuests(guestsData);
      setAllBookings(bookingsData.filter(b => b.status !== "cancelled"));
    } catch (error) {
      console.error("Error loading data:", error);
    }
  };

  const validateDates = (roomId: string, checkInStr: string, checkOutStr: string) => {
    if (!checkInStr || !checkOutStr) {
      setDateConflictError("");
      return;
    }

    const checkIn = new Date(checkInStr);
    const checkOut = new Date(checkOutStr);

    const roomBookings = allBookings.filter(
      booking => booking.room_id === roomId && booking.status !== "cancelled"
    );

    const hasConflict = roomBookings.some(booking => {
      if (!booking.check_in_date || !booking.check_out_date) return false;
      
      const existingCheckIn = parseISO(booking.check_in_date);
      const existingCheckOut = parseISO(booking.check_out_date);

      const newCheckInOverlaps = isWithinInterval(checkIn, {
        start: existingCheckIn,
        end: existingCheckOut
      });

      const newCheckOutOverlaps = isWithinInterval(checkOut, {
        start: existingCheckIn,
        end: existingCheckOut
      });

      const existingCheckInOverlaps = isWithinInterval(existingCheckIn, {
        start: checkIn,
        end: checkOut
      });

      return newCheckInOverlaps || newCheckOutOverlaps || existingCheckInOverlaps;
    });

    if (hasConflict) {
      setDateConflictError("As datas selecionadas sobrepõem-se a uma reserva existente neste quarto.");
    } else {
      setDateConflictError("");
    }
  };

  const calculatePrice = (): number => {
    const selectedRoom = rooms.find(r => r.id === formData.room_id);
    if (!selectedRoom || !formData.check_in_date || !formData.check_out_date) return 0;

    const checkIn = new Date(formData.check_in_date);
    const checkOut = new Date(formData.check_out_date);
    const days = differenceInDays(checkOut, checkIn);

    switch (formData.payment_type) {
      case "daily":
        return selectedRoom.base_price * days;
      case "biweekly":
        const biweeks = Math.ceil(days / 14);
        return selectedRoom.base_price * 14 * biweeks;
      case "monthly":
        const months = Math.ceil(days / 30);
        return selectedRoom.base_price * 30 * months;
      default:
        return selectedRoom.base_price * days;
    }
  };

  const handleRecalculate = () => {
    const calculatedPrice = calculatePrice();
    if (calculatedPrice > 0) {
      setFormData(prev => ({ ...prev, custom_price: calculatedPrice.toFixed(2) }));
    }
  };

  const handleCreateGuest = async () => {
    if (!newGuest.full_name || !newGuest.email) {
      alert("Nome e email são obrigatórios");
      return;
    }

    try {
      const createdGuest = await guestService.create(newGuest);
      setGuests([...guests, createdGuest]);
      setFormData({ ...formData, guest_id: createdGuest.id });
      setShowNewGuestForm(false);
      setNewGuest({
        full_name: "",
        email: "",
        phone: "",
        address: "",
        date_of_birth: "",
        nationality: "",
        tax_id: "",
      });
    } catch (error) {
      console.error("Error creating guest:", error);
      alert("Erro ao criar cliente");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.room_id || !formData.guest_id) {
      alert("Por favor, selecione o quarto e o cliente");
      return;
    }

    if (!formData.check_in_date || !formData.check_out_date) {
      alert("Por favor, selecione as datas de check-in e check-out");
      return;
    }

    if (!formData.custom_price || parseFloat(formData.custom_price) <= 0) {
      alert("Por favor, defina um valor válido para a reserva");
      return;
    }

    if (dateConflictError) {
      alert("Não é possível criar a reserva devido a conflito de datas");
      return;
    }

    try {
      setLoading(true);

      const selectedRoom = rooms.find(r => r.id === formData.room_id);
      if (!selectedRoom) return;

      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);

      const nights = Math.ceil(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalAmount = parseFloat(formData.custom_price);

      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;

      const bookingData = {
        room_id: formData.room_id,
        guest_id: formData.guest_id,
        check_in_date: checkIn.toISOString(),
        check_out_date: checkOut.toISOString(),
        booking_number: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: "pending" as const,
        room_price: selectedRoom?.base_price || 0,
        total_amount: totalAmount,
        num_nights: nights,
        payment_type: formData.payment_type,
        custom_price: totalAmount,
        special_requests: formData.special_requests || "",
        user_id: userId,
      };

      await bookingService.create(bookingData);
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error creating booking:", error);
      alert("Erro ao criar reserva");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setFormData({
      room_id: "",
      guest_id: "",
      check_in_date: "",
      check_out_date: "",
      payment_type: "daily",
      custom_price: "",
      status: "confirmed",
      special_requests: "",
    });
    setDateConflictError("");
  };

  const selectedRoom = rooms.find(r => r.id === formData.room_id);
  const days = formData.check_out_date && formData.check_in_date
    ? differenceInDays(new Date(formData.check_out_date), new Date(formData.check_in_date))
    : 0;
  const calculatedPrice = calculatePrice();
  const finalPrice = formData.custom_price ? parseFloat(formData.custom_price) : calculatedPrice;

  const getPaymentTypeLabel = (type: PaymentType) => {
    switch (type) {
      case "daily": return "Diária";
      case "biweekly": return "Quinzenal";
      case "monthly": return "Mensal";
    }
  };

  const getPeriodInfo = () => {
    if (!selectedRoom || days <= 0) return null;
    
    switch (formData.payment_type) {
      case "daily":
        return `${days} dias × €${selectedRoom.base_price}/dia`;
      case "biweekly":
        const biweeks = Math.ceil(days / 14);
        return `${biweeks} quinzena(s) × €${(selectedRoom.base_price * 14).toFixed(2)}/quinzena (${days} dias)`;
      case "monthly":
        const months = Math.ceil(days / 30);
        return `${months} mês(es) × €${(selectedRoom.base_price * 30).toFixed(2)}/mês (${days} dias)`;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Reserva</DialogTitle>
          <DialogDescription>
            Criar uma nova reserva no sistema
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room_id">
              Quarto <span className="text-destructive">*</span>
            </Label>
            <Select value={formData.room_id} onValueChange={(value) => setFormData({ ...formData, room_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o quarto" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Quarto {room.room_number || room.name} - {room.room_type} (€{room.base_price}/dia)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Guest Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="guest_id">
                Cliente <span className="text-destructive">*</span>
              </Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setShowNewGuestForm(!showNewGuestForm)}
              >
                <UserPlus className="h-4 w-4 mr-2" />
                {showNewGuestForm ? "Cancelar" : "Novo Cliente"}
              </Button>
            </div>

            {!showNewGuestForm ? (
              <Select value={formData.guest_id} onValueChange={(value) => setFormData({ ...formData, guest_id: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o cliente" />
                </SelectTrigger>
                <SelectContent>
                  {guests.map((guest) => (
                    <SelectItem key={guest.id} value={guest.id}>
                      {guest.full_name} ({guest.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : (
              <div className="border rounded-lg p-4 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label>Nome Completo *</Label>
                    <Input
                      value={newGuest.full_name}
                      onChange={(e) => setNewGuest({ ...newGuest, full_name: e.target.value })}
                      placeholder="Nome completo"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Email *</Label>
                    <Input
                      type="email"
                      value={newGuest.email}
                      onChange={(e) => setNewGuest({ ...newGuest, email: e.target.value })}
                      placeholder="email@exemplo.com"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Telefone</Label>
                    <Input
                      value={newGuest.phone}
                      onChange={(e) => setNewGuest({ ...newGuest, phone: e.target.value })}
                      placeholder="+351 912 345 678"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Data de Nascimento</Label>
                    <Input
                      type="date"
                      value={newGuest.date_of_birth}
                      onChange={(e) => setNewGuest({ ...newGuest, date_of_birth: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Nacionalidade</Label>
                    <Input
                      value={newGuest.nationality}
                      onChange={(e) => setNewGuest({ ...newGuest, nationality: e.target.value })}
                      placeholder="Portugal"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>NIF</Label>
                    <Input
                      value={newGuest.tax_id}
                      onChange={(e) => setNewGuest({ ...newGuest, tax_id: e.target.value })}
                      placeholder="123456789"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Morada</Label>
                  <Input
                    value={newGuest.address}
                    onChange={(e) => setNewGuest({ ...newGuest, address: e.target.value })}
                    placeholder="Morada completa"
                  />
                </div>
                <Button type="button" onClick={handleCreateGuest} size="sm">
                  Criar Cliente
                </Button>
              </div>
            )}
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="check_in_date">Check-in *</Label>
              <Input
                type="date"
                id="check_in_date"
                value={formData.check_in_date}
                onChange={(e) => setFormData({ ...formData, check_in_date: e.target.value })}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="check_out_date">Check-out *</Label>
              <Input
                type="date"
                id="check_out_date"
                value={formData.check_out_date}
                onChange={(e) => setFormData({ ...formData, check_out_date: e.target.value })}
                required
              />
            </div>
          </div>

          {/* Date Conflict Alert */}
          {dateConflictError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dateConflictError}</AlertDescription>
            </Alert>
          )}

          {/* Payment Type Selection */}
          <div className="space-y-2">
            <Label htmlFor="payment_type">
              Tipo de Cobrança <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.payment_type} 
              onValueChange={(value: PaymentType) => setFormData({ ...formData, payment_type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">Diária (por dia)</SelectItem>
                <SelectItem value="biweekly">Quinzenal (14 dias)</SelectItem>
                <SelectItem value="monthly">Mensal (30 dias)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Price Calculation */}
          {selectedRoom && days > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm font-medium">Tipo de Cobrança</div>
                  <div className="text-sm text-muted-foreground">{getPaymentTypeLabel(formData.payment_type)}</div>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleRecalculate}
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Recalcular
                </Button>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <div className="text-sm text-muted-foreground">
                  {getPeriodInfo()}
                </div>
                <div className="text-sm font-medium">
                  Valor Calculado: €{calculatedPrice.toFixed(2)}
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t">
                <Label htmlFor="custom_price">
                  Valor Final <span className="text-destructive">*</span>
                  <span className="text-xs text-muted-foreground ml-2">(ajustável)</span>
                </Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                  <Input
                    id="custom_price"
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.custom_price}
                    onChange={(e) => setFormData({ ...formData, custom_price: e.target.value })}
                    placeholder="0.00"
                    className="pl-7"
                    required
                  />
                </div>
              </div>

              {formData.custom_price && parseFloat(formData.custom_price) !== calculatedPrice && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Valor ajustado manualmente (diferença: €{(parseFloat(formData.custom_price) - calculatedPrice).toFixed(2)})
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}

          {/* Special Requests */}
          <div className="space-y-2">
            <Label>Pedidos Especiais</Label>
            <Textarea
              rows={3}
              value={formData.special_requests}
              onChange={(e) => setFormData({ ...formData, special_requests: e.target.value })}
              placeholder="Cama extra, berço, late check-in..."
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading || !!dateConflictError}>
              {loading ? "A criar..." : "Criar Reserva"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}