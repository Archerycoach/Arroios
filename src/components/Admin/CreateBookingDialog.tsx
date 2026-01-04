import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, parseISO, isWithinInterval } from "date-fns";
import { pt } from "date-fns/locale";
import { CalendarIcon, UserPlus, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Room, Guest } from "@/types";
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
  const [checkInOpen, setCheckInOpen] = useState(false);
  const [checkOutOpen, setCheckOutOpen] = useState(false);
  const [dateConflictError, setDateConflictError] = useState<string>("");
  
  const [formData, setFormData] = useState({
    guest_id: "",
    room_id: "",
    check_in_date: undefined as Date | undefined,
    check_out_date: undefined as Date | undefined,
    total_price: "",
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

  const validateDates = (roomId: string, checkIn: Date, checkOut: Date) => {
    const roomBookings = allBookings.filter(
      booking => booking.room_id === roomId && booking.status !== "cancelled"
    );

    const hasConflict = roomBookings.some(booking => {
      if (!booking.check_in_date || !booking.check_out_date) return false;
      
      const existingCheckIn = parseISO(booking.check_in_date);
      const existingCheckOut = parseISO(booking.check_out_date);

      // Check if new dates overlap with existing booking
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

  const handleCheckInSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, check_in_date: date }));
    setCheckInOpen(false);
  };

  const handleCheckOutSelect = (date: Date | undefined) => {
    setFormData(prev => ({ ...prev, check_out_date: date }));
    setCheckOutOpen(false);
  };

  const disabledCheckInDates = (date: Date) => {
    return date < new Date(new Date().setHours(0, 0, 0, 0));
  };

  const disabledCheckOutDates = (date: Date) => {
    const today = new Date(new Date().setHours(0, 0, 0, 0));
    if (date < today) return true;
    if (formData.check_in_date) {
      const nextDay = new Date(formData.check_in_date);
      nextDay.setDate(nextDay.getDate() + 1);
      return date < nextDay;
    }
    return false;
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

    if (dateConflictError) {
      alert("Não é possível criar a reserva devido a conflito de datas");
      return;
    }

    try {
      setLoading(true);

      const selectedRoom = rooms.find(r => r.id === formData.room_id);
      if (!selectedRoom) return;

      const nights = Math.ceil(
        (formData.check_out_date!.getTime() - formData.check_in_date!.getTime()) / (1000 * 60 * 60 * 24)
      );

      const totalAmount = (selectedRoom?.base_price || 0) * nights;

      const userResponse = await supabase.auth.getUser();
      const userId = userResponse.data.user?.id;

      const bookingData = {
        room_id: formData.room_id,
        guest_id: formData.guest_id,
        check_in_date: formData.check_in_date!.toISOString(),
        check_out_date: formData.check_out_date!.toISOString(),
        booking_number: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: "pending" as const,
        room_price: selectedRoom?.base_price || 0,
        total_amount: totalAmount,
        num_nights: nights,
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
      check_in_date: undefined,
      check_out_date: undefined,
      total_price: "",
      status: "confirmed",
      special_requests: "",
    });
    setCheckInOpen(false);
    setCheckOutOpen(false);
    setDateConflictError("");
  };

  const selectedRoom = rooms.find(r => r.id === formData.room_id);
  const nights = formData.check_out_date && formData.check_in_date
    ? Math.ceil((formData.check_out_date.getTime() - formData.check_in_date.getTime()) / (1000 * 60 * 60 * 24))
    : 0;
  const totalPrice = selectedRoom ? selectedRoom.base_price * nights : 0;

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
                    Quarto {room.room_number || room.name} - {room.room_type} (€{room.base_price}/noite)
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
              <Label>Check-in *</Label>
              <Popover open={checkInOpen} onOpenChange={setCheckInOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.check_in_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.check_in_date ? (
                      format(formData.check_in_date, "PPP", { locale: pt })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.check_in_date}
                    onSelect={handleCheckInSelect}
                    disabled={disabledCheckInDates}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label>Check-out *</Label>
              <Popover open={checkOutOpen} onOpenChange={setCheckOutOpen}>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !formData.check_out_date && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {formData.check_out_date ? (
                      format(formData.check_out_date, "PPP", { locale: pt })
                    ) : (
                      <span>Selecione a data</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={formData.check_out_date}
                    onSelect={handleCheckOutSelect}
                    disabled={disabledCheckOutDates}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Date Conflict Alert */}
          {dateConflictError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{dateConflictError}</AlertDescription>
            </Alert>
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

          {/* Price Summary */}
          {selectedRoom && nights > 0 && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span>€{selectedRoom.base_price}/noite × {nights} noites</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span>Total</span>
                <span>€{totalPrice.toFixed(2)}</span>
              </div>
            </div>
          )}

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