import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
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
import { paymentService } from "@/services/paymentService";
import { supabase } from "@/integrations/supabase/client";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CreateBookingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
  editBooking?: BookingWithDetails | null;
}

export function CreateBookingDialog({ open, onOpenChange, onSuccess, editBooking }: CreateBookingDialogProps) {
  const { toast } = useToast();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [allBookings, setAllBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(false);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [dateConflictError, setDateConflictError] = useState<string>("");
  const [includeDeposit, setIncludeDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  
  const [formData, setFormData] = useState({
    guest_id: "",
    room_id: "",
    check_in_date: "",
    check_out_date: "",
    custom_price: "",
    pricing_mode: "monthly" as "monthly" | "biweekly" | "manual",
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
      
      if (editBooking) {
        // Preencher formulário com dados da reserva existente
        setFormData({
          guest_id: editBooking.guest_id,
          room_id: editBooking.room_id,
          check_in_date: editBooking.check_in_date.split('T')[0],
          check_out_date: editBooking.check_out_date.split('T')[0],
          custom_price: editBooking.total_amount?.toString() || "",
          pricing_mode: editBooking.payment_type === "monthly" || editBooking.payment_type === "biweekly" 
            ? editBooking.payment_type 
            : "manual",
          status: "confirmed", // Mantém estado ou usa confirmed como base
          special_requests: editBooking.special_notes || "",
        });
        setIncludeDeposit(false); // Edição normalmente não re-aciona depósito
      } else {
        resetForm();
      }
    }
  }, [open, editBooking]);

  // Validate dates whenever room or dates change
  useEffect(() => {
    if (formData.room_id && formData.check_in_date && formData.check_out_date) {
      validateDates(formData.room_id, formData.check_in_date, formData.check_out_date);
    } else {
      setDateConflictError("");
    }
  }, [formData.room_id, formData.check_in_date, formData.check_out_date]);

  // Calculate price when room, dates, or pricing mode change
  useEffect(() => {
    if (formData.room_id && formData.check_in_date && formData.check_out_date && formData.pricing_mode !== "manual") {
      const selectedRoom = rooms.find(r => r.id === formData.room_id);
      if (!selectedRoom) return;

      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);
      const days = differenceInDays(checkOut, checkIn);

      if (days <= 0) return;

      let calculatedPrice = 0;
      
      if (formData.pricing_mode === "monthly") {
        // Calculate complete 15-day periods
        const complete15DayPeriods = Math.floor(days / 15);
        const completeMonths = Math.floor(complete15DayPeriods / 2);
        const remaining15DayPeriods = complete15DayPeriods % 2;
        const biweeklyPrice = selectedRoom.monthly_price / 2;
        
        calculatedPrice = (completeMonths * selectedRoom.monthly_price) + (remaining15DayPeriods * biweeklyPrice);
      } else if (formData.pricing_mode === "biweekly") {
        const biweeklyPrice = selectedRoom.monthly_price / 2;
        const complete15DayPeriods = Math.floor(days / 15);
        calculatedPrice = complete15DayPeriods * biweeklyPrice;
      }

      setFormData(prev => ({ ...prev, custom_price: calculatedPrice.toFixed(2) }));
    }
  }, [formData.room_id, formData.check_in_date, formData.check_out_date, formData.pricing_mode, rooms]);

  // Initialize deposit amount when room is selected
  useEffect(() => {
    if (formData.room_id && !editBooking) {
      const selectedRoom = rooms.find(r => r.id === formData.room_id);
      if (selectedRoom) {
        setDepositAmount(selectedRoom.monthly_price.toFixed(2));
      }
    }
  }, [formData.room_id, rooms, editBooking]);

  const loadData = async () => {
    try {
      const [roomsData, guestsData, bookingsData] = await Promise.all([
        roomService.getAll(),
        guestService.getAll(),
        bookingService.getAll(),
      ]);
      setRooms(roomsData);
      setGuests(guestsData);
      setAllBookings(bookingsData.filter(b => b.status !== "cancelled" && b.id !== editBooking?.id));
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

    // Filter out current booking if editing
    const roomBookings = allBookings.filter(
      booking => booking.room_id === roomId && booking.status !== "cancelled" && booking.id !== editBooking?.id
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
      
      let paymentType: PaymentType;
      if (formData.pricing_mode === "monthly") {
        paymentType = "monthly";
      } else if (formData.pricing_mode === "biweekly") {
        paymentType = "biweekly";
      } else {
        paymentType = nights >= 30 ? "monthly" : (nights >= 15 ? "biweekly" : "daily");
      }

      const bookingData = {
        room_id: formData.room_id,
        guest_id: formData.guest_id,
        check_in_date: checkIn.toISOString(),
        check_out_date: checkOut.toISOString(),
        status: editBooking ? editBooking.status : "pending",
        room_price: selectedRoom?.monthly_price || 0,
        total_amount: totalAmount,
        num_nights: nights,
        payment_type: paymentType,
        custom_price: totalAmount,
        special_notes: formData.special_requests || "",
      };

      if (editBooking) {
        // UPDATE
        await bookingService.update(editBooking.id, bookingData);
        toast({
          title: "Reserva atualizada",
          description: "A reserva foi atualizada com sucesso.",
        });
      } else {
        // CREATE
        const userResponse = await supabase.auth.getUser();
        const userId = userResponse.data.user?.id;
        
        const newBookingData = {
          ...bookingData,
          booking_number: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          user_id: userId,
        };

        const createdBooking = await bookingService.create(newBookingData);

        if (createdBooking && createdBooking.id) {
           // Só gera pagamentos se for nova reserva e tiver caução selecionada
           if (includeDeposit) { // Note: variable name kept as includeDeposit based on previous code, but logic inside generates payments
            const days = differenceInDays(checkOut, checkIn);
            // Calculate number of 15-day periods
            const complete15DayPeriods = Math.floor(days / 15);
            // Each month = 2 periods of 15 days, so number of payments = (periods / 2) rounded up
            const numberOfInstallments = Math.ceil(complete15DayPeriods / 2);
            
            // Each monthly installment should be the total divided by number of months
            const monthlyAmount = numberOfInstallments > 0 ? totalAmount / numberOfInstallments : totalAmount;

            // Generate payments with proper monthly amounts
            await paymentService.generatePaymentsForBooking(
              createdBooking.id,
              monthlyAmount,
              numberOfInstallments,
              formData.check_in_date,
              includeDeposit, // This passes the boolean to include a separate deposit payment
              depositAmount ? parseFloat(depositAmount) : 0
            );
           }
        }
        
        toast({
          title: "Reserva criada",
          description: "A reserva foi criada com sucesso.",
        });
      }

      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error("Error saving booking:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao guardar reserva. Tente novamente."
      });
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
      custom_price: "",
      pricing_mode: "monthly",
      status: "confirmed",
      special_requests: "",
    });
    setDateConflictError("");
    setIncludeDeposit(true);
    setDepositAmount("");
  };

  const selectedRoom = rooms.find(r => r.id === formData.room_id);
  const days = formData.check_out_date && formData.check_in_date
    ? differenceInDays(new Date(formData.check_out_date), new Date(formData.check_in_date))
    : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editBooking ? "Editar Reserva" : "Nova Reserva"}</DialogTitle>
          <DialogDescription>
            {editBooking ? `Editar reserva #${editBooking.booking_number}` : "Criar uma nova reserva no sistema"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Room Selection */}
          <div className="space-y-2">
            <Label htmlFor="room_id">
              Quarto <span className="text-destructive">*</span>
            </Label>
            <Select 
              value={formData.room_id} 
              onValueChange={(value) => setFormData({ ...formData, room_id: value })}
              disabled={!!editBooking}
            >
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
            {editBooking && <p className="text-xs text-muted-foreground">O quarto não pode ser alterado na edição.</p>}
          </div>

          {/* Guest Selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="guest_id">
                Cliente <span className="text-destructive">*</span>
              </Label>
              {!editBooking && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowNewGuestForm(!showNewGuestForm)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {showNewGuestForm ? "Cancelar" : "Novo Cliente"}
                </Button>
              )}
            </div>

            {!showNewGuestForm ? (
              <Select 
                value={formData.guest_id} 
                onValueChange={(value) => setFormData({ ...formData, guest_id: value })}
                disabled={!!editBooking}
              >
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

          {/* Price Section */}
          {selectedRoom && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-4">
              {/* Pricing Mode Selection */}
              <div className="space-y-3">
                <Label>Tipo de Cobrança</Label>
                <div className="space-y-2">
                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_mode"
                      value="monthly"
                      checked={formData.pricing_mode === "monthly"}
                      onChange={(e) => setFormData({ ...formData, pricing_mode: "monthly" })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Mensal</div>
                      <div className="text-sm text-muted-foreground">
                        Baseado em €{selectedRoom.monthly_price.toFixed(2)}/mês (€{(selectedRoom.monthly_price / 30).toFixed(2)}/dia)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_mode"
                      value="biweekly"
                      checked={formData.pricing_mode === "biweekly"}
                      onChange={(e) => setFormData({ ...formData, pricing_mode: "biweekly" })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Quinzenal</div>
                      <div className="text-sm text-muted-foreground">
                        Baseado em €{(selectedRoom.monthly_price / 2).toFixed(2)}/quinzena (€{(selectedRoom.monthly_price / 60).toFixed(2)}/dia)
                      </div>
                    </div>
                  </label>

                  <label className="flex items-center space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="pricing_mode"
                      value="manual"
                      checked={formData.pricing_mode === "manual"}
                      onChange={(e) => setFormData({ ...formData, pricing_mode: "manual" })}
                      className="w-4 h-4"
                    />
                    <div className="flex-1">
                      <div className="font-medium">Valor Manual</div>
                      <div className="text-sm text-muted-foreground">
                        Definir valor personalizado para esta reserva
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              {/* Price Breakdown */}
              {formData.pricing_mode !== "manual" && days > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm text-muted-foreground">
                    Duração: {days} dia{days !== 1 ? 's' : ''}
                  </div>
                  {formData.pricing_mode === "monthly" && (() => {
                    const complete15DayPeriods = Math.floor(days / 15);
                    const completeMonths = Math.floor(complete15DayPeriods / 2);
                    const remaining15DayPeriods = complete15DayPeriods % 2;
                    const biweeklyPrice = selectedRoom.monthly_price / 2;
                    
                    return (
                      <div className="text-sm space-y-1">
                        <div>• {days} dias ÷ 15 = {complete15DayPeriods} períodos completos de 15 dias</div>
                        {completeMonths > 0 && (
                          <div>• {completeMonths} mês(es) × €{selectedRoom.monthly_price.toFixed(2)} = €{(completeMonths * selectedRoom.monthly_price).toFixed(2)}</div>
                        )}
                        {remaining15DayPeriods > 0 && (
                          <div>• {remaining15DayPeriods} período(s) de 15 dias × €{biweeklyPrice.toFixed(2)} = €{(remaining15DayPeriods * biweeklyPrice).toFixed(2)}</div>
                        )}
                        {complete15DayPeriods === 0 && (
                          <div className="text-amber-600">⚠️ Menos de 15 dias - considere ajustar o período</div>
                        )}
                      </div>
                    );
                  })()}
                  {formData.pricing_mode === "biweekly" && (() => {
                    const biweeklyPrice = selectedRoom.monthly_price / 2;
                    const complete15DayPeriods = Math.floor(days / 15);
                    
                    return (
                      <div className="text-sm space-y-1">
                        <div>• {days} dias ÷ 15 = {complete15DayPeriods} períodos de 15 dias</div>
                        {complete15DayPeriods > 0 && (
                          <div>• {complete15DayPeriods} × €{biweeklyPrice.toFixed(2)} = €{(complete15DayPeriods * biweeklyPrice).toFixed(2)}</div>
                        )}
                        {complete15DayPeriods === 0 && (
                          <div className="text-amber-600">⚠️ Menos de 15 dias - considere ajustar o período</div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}

              {/* Final Price Input */}
              <div className="space-y-2 pt-3 border-t">
                <Label htmlFor="custom_price">
                  Valor Final <span className="text-destructive">*</span>
                  {formData.pricing_mode !== "manual" && (
                    <span className="text-xs text-muted-foreground ml-2">(ajustável)</span>
                  )}
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

              {/* Manual adjustment warning */}
              {formData.pricing_mode !== "manual" && formData.custom_price && days > 0 && (() => {
                const currentValue = parseFloat(formData.custom_price);
                let expectedValue = 0;
                
                if (formData.pricing_mode === "monthly") {
                  if (days >= 30) {
                    const mesesCompletos = Math.floor(days / 30);
                    expectedValue = mesesCompletos * selectedRoom.monthly_price;
                  } else if (days >= 15) {
                    expectedValue = selectedRoom.monthly_price;
                  } else {
                    expectedValue = selectedRoom.monthly_price / 2;
                  }
                } else if (formData.pricing_mode === "biweekly") {
                  const biweeklyPrice = selectedRoom.monthly_price / 2;
                  if (days >= 15) {
                    const quinzenasCompletas = Math.floor(days / 15);
                    expectedValue = quinzenasCompletas * biweeklyPrice;
                  } else {
                    expectedValue = biweeklyPrice;
                  }
                }
                
                const difference = currentValue - expectedValue;
                
                if (Math.abs(difference) > 0.01) {
                  return (
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        Valor ajustado manualmente ({difference > 0 ? '+' : ''}€{difference.toFixed(2)})
                      </AlertDescription>
                    </Alert>
                  );
                }
                return null;
              })()}
            </div>
          )}

          {/* Security Deposit Section - ONLY FOR NEW BOOKINGS */}
          {selectedRoom && !editBooking && (
            <div className="rounded-lg border bg-muted/50 p-4 space-y-3">
              <div className="flex items-start space-x-3">
                <input
                  type="checkbox"
                  id="include_deposit"
                  checked={includeDeposit}
                  onChange={(e) => setIncludeDeposit(e.target.checked)}
                  className="w-4 h-4 mt-1 cursor-pointer"
                />
                <div className="flex-1">
                  <Label htmlFor="include_deposit" className="cursor-pointer font-medium">
                    Incluir caução de segurança
                  </Label>
                  <p className="text-sm text-muted-foreground mt-1">
                    A caução será cobrada no dia do check-in
                  </p>
                </div>
              </div>

              {includeDeposit && (
                <div className="space-y-2">
                  <Label htmlFor="deposit_amount">Valor da Caução</Label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                    <Input
                      id="deposit_amount"
                      type="number"
                      step="0.01"
                      min="0"
                      value={depositAmount}
                      onChange={(e) => setDepositAmount(e.target.value)}
                      placeholder="0.00"
                      className="pl-7"
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Special Requests */}
          <div className="space-y-2">
            <Label>Notas / Observações</Label>
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
              {loading ? (editBooking ? "A guardar..." : "A criar...") : (editBooking ? "Guardar Alterações" : "Criar Reserva")}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}