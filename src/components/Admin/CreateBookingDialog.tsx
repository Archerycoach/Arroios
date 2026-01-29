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
import { calculateBookingPeriods } from "@/lib/dataUtils";

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
  const [dataLoaded, setDataLoaded] = useState(false);
  const [showNewGuestForm, setShowNewGuestForm] = useState(false);
  const [dateConflictError, setDateConflictError] = useState<string>("");
  const [includeDeposit, setIncludeDeposit] = useState(true);
  const [depositAmount, setDepositAmount] = useState("");
  const [monthlyValue, setMonthlyValue] = useState("");
  const [numberOfMonths, setNumberOfMonths] = useState(0);
  const [priceBreakdown, setPriceBreakdown] = useState<string[]>([]);
  const [paymentStats, setPaymentStats] = useState({ paid: 0, pendingMonthlyCount: 0, otherPending: 0 });
  
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

  // Load initial data when dialog opens
  useEffect(() => {
    if (open) {
      setDataLoaded(false);
      loadData().then(() => {
        setDataLoaded(true);
      });
      setDateConflictError("");
      setShowNewGuestForm(false);
    }
  }, [open]);

  // Fill form with edit data AFTER data is loaded
  useEffect(() => {
    if (open && dataLoaded && editBooking) {
      console.log("Loading edit booking data:", editBooking);
      
      setFormData({
        guest_id: editBooking.guest_id,
        room_id: editBooking.room_id,
        check_in_date: editBooking.check_in_date.split("T")[0],
        check_out_date: editBooking.check_out_date.split("T")[0],
        custom_price: editBooking.total_amount?.toString() || "",
        pricing_mode: editBooking.payment_type === "monthly" || editBooking.payment_type === "biweekly" 
          ? editBooking.payment_type 
          : "manual",
        status: "confirmed",
        special_requests: editBooking.special_notes || "",
      });
      
      setIncludeDeposit(false);
      
      // Load payment stats and calculate values
      loadPaymentStats(editBooking.id).then((actualMonthlyAmount) => {
        const selectedRoom = rooms.find(r => r.id === editBooking.room_id);
        
        if (selectedRoom) {
          const checkIn = new Date(editBooking.check_in_date);
          const checkOut = new Date(editBooking.check_out_date);
          const calculation = calculateBookingPeriods(checkIn, checkOut, selectedRoom.monthly_price);
          
          setNumberOfMonths(calculation.monthlyEquivalent);
          setPriceBreakdown(calculation.breakdown);
          
          if (actualMonthlyAmount) {
            setMonthlyValue(actualMonthlyAmount.toFixed(2));
          } else {
            setMonthlyValue(selectedRoom.monthly_price.toFixed(2));
          }
        }
      });
    } else if (open && dataLoaded && !editBooking) {
      resetForm();
    }
  }, [open, dataLoaded, editBooking?.id, rooms]);

  // Validate dates whenever room or dates change
  useEffect(() => {
    if (formData.room_id && formData.check_in_date && formData.check_out_date) {
      validateDates(formData.room_id, formData.check_in_date, formData.check_out_date);
    } else {
      setDateConflictError("");
    }
  }, [formData.room_id, formData.check_in_date, formData.check_out_date, allBookings]);

  // Calculate price when room, dates, or pricing mode change
  useEffect(() => {
    if (formData.room_id && formData.check_in_date && formData.check_out_date && formData.pricing_mode !== "manual") {
      const selectedRoom = rooms.find(r => r.id === formData.room_id);
      if (!selectedRoom) return;

      const checkIn = new Date(formData.check_in_date);
      const checkOut = new Date(formData.check_out_date);

      if (checkOut <= checkIn) return;

      const calculation = calculateBookingPeriods(checkIn, checkOut, selectedRoom.monthly_price);
      
      setFormData(prev => ({ ...prev, custom_price: calculation.totalPrice.toFixed(2) }));
      setPriceBreakdown(calculation.breakdown);
      
      if (!editBooking && calculation.monthlyEquivalent > 0) {
        setMonthlyValue((calculation.totalPrice / calculation.monthlyEquivalent).toFixed(2));
        setNumberOfMonths(calculation.monthlyEquivalent);
      }
    }
  }, [formData.room_id, formData.check_in_date, formData.check_out_date, formData.pricing_mode, rooms, editBooking]);

  // Update total price when monthly value changes (for editing)
  useEffect(() => {
    if (editBooking && monthlyValue) {
      const monthly = parseFloat(monthlyValue);
      
      if (!isNaN(monthly)) {
        let newTotal: number;
        
        if (paymentStats.pendingMonthlyCount > 0) {
           newTotal = paymentStats.paid + paymentStats.otherPending + (monthly * paymentStats.pendingMonthlyCount);
        } else if (numberOfMonths > 0) {
           newTotal = monthly * numberOfMonths;
        } else {
          return;
        }
        
        const newTotalString = newTotal.toFixed(2);
        
        if (formData.custom_price !== newTotalString) {
          setFormData(prev => ({ ...prev, custom_price: newTotalString }));
        }
      }
    }
  }, [monthlyValue, paymentStats.pendingMonthlyCount, paymentStats.paid, paymentStats.otherPending, numberOfMonths, editBooking]);

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

  const loadPaymentStats = async (bookingId: string) => {
    try {
      const { data: payments, error } = await supabase
        .from("payments")
        .select("amount, status, payment_type")
        .eq("booking_id", bookingId);

      if (error) throw error;

      if (payments) {
        const paid = payments
          .filter(p => p.status === "completed")
          .reduce((sum, p) => sum + p.amount, 0);

        const pendingMonthly = payments
          .filter(p => p.status === "pending" && p.payment_type === "monthly");

        const otherPending = payments
          .filter(p => p.status === "pending" && p.payment_type !== "monthly")
          .reduce((sum, p) => sum + p.amount, 0);

        setPaymentStats({
          paid,
          pendingMonthlyCount: pendingMonthly.length,
          otherPending
        });
        
        if (pendingMonthly.length > 0) {
          return pendingMonthly[0].amount;
        }
      }
      return null;
    } catch (error) {
      console.error("Error loading payment stats:", error);
      return null;
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
        await bookingService.update(editBooking.id, bookingData);
        
        if (monthlyValue && parseFloat(monthlyValue) > 0 && numberOfMonths > 0) {
          const newMonthlyAmount = parseFloat(monthlyValue);
          const regenerated = await paymentService.regeneratePendingPayments(
            editBooking.id,
            newMonthlyAmount,
            numberOfMonths,
            formData.check_in_date
          );
          
          toast({
            title: "Reserva atualizada",
            description: `A reserva foi atualizada. ${regenerated.regenerated} pagamento(s) foram regenerados.`,
          });
        } else {
          toast({
            title: "Reserva atualizada",
            description: "A reserva foi atualizada com sucesso.",
          });
        }
      } else {
        const userResponse = await supabase.auth.getUser();
        const userId = userResponse.data.user?.id;
        
        const newBookingData = {
          ...bookingData,
          booking_number: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
          user_id: userId,
        };

        const createdBooking = await bookingService.create(newBookingData);

        if (createdBooking && createdBooking.id) {
           if (includeDeposit || numberOfMonths > 0) {
            const monthlyAmount = numberOfMonths > 0 ? totalAmount / numberOfMonths : totalAmount;

            await paymentService.generatePaymentsForBooking(
              createdBooking.id,
              monthlyAmount,
              numberOfMonths,
              formData.check_in_date,
              includeDeposit,
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
    setMonthlyValue("");
    setNumberOfMonths(0);
    setPriceBreakdown([]);
    setPaymentStats({ paid: 0, pendingMonthlyCount: 0, otherPending: 0 });
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
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o quarto" />
              </SelectTrigger>
              <SelectContent>
                {rooms.map((room) => (
                  <SelectItem key={room.id} value={room.id}>
                    Quarto {room.room_number || room.name} - {room.room_type} (€{room.monthly_price}/mês)
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
          {selectedRoom && formData.check_in_date && formData.check_out_date && (
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
                      <div className="font-medium">Automático (Recomendado)</div>
                      <div className="text-sm text-muted-foreground">
                        Cálculo baseado no calendário: dias 1-15 = quinzena (€{(selectedRoom.monthly_price / 2).toFixed(2)}), dias 16-31 = mês (€{selectedRoom.monthly_price.toFixed(2)})
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
              {formData.pricing_mode !== "manual" && priceBreakdown.length > 0 && (
                <div className="pt-3 border-t space-y-2">
                  <div className="text-sm font-medium">Cálculo Detalhado:</div>
                  <div className="text-sm space-y-1">
                    {priceBreakdown.map((line, index) => (
                      <div key={index}>• {line}</div>
                    ))}
                  </div>
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

          {/* Monthly Value Adjustment - ONLY FOR EDITING */}
          {editBooking && (
            <div className="rounded-lg border bg-blue-50 dark:bg-blue-950/20 p-4 space-y-4">
              <div className="flex items-start space-x-3">
                <Calculator className="h-5 w-5 text-blue-600 mt-0.5" />
                <div className="flex-1 space-y-3">
                  <div>
                    <Label className="text-blue-900 dark:text-blue-100 font-semibold">
                      Ajustar Valor Mensal
                    </Label>
                    <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
                      Altere o valor mensal para recalcular o total da reserva e atualizar os pagamentos pendentes
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="monthly_value" className="text-sm">
                        Valor Mensal
                      </Label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        <Input
                          id="monthly_value"
                          type="number"
                          step="0.01"
                          min="0"
                          value={monthlyValue}
                          onChange={(e) => setMonthlyValue(e.target.value)}
                          placeholder="0.00"
                          className="pl-7 bg-white dark:bg-gray-900"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm">Número de Meses</Label>
                      <div className="h-10 px-3 py-2 rounded-md border bg-muted flex items-center">
                        <span className="font-medium">{numberOfMonths > 0 ? numberOfMonths : "N/A"}</span>
                      </div>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-blue-200 dark:border-blue-800">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-blue-700 dark:text-blue-300">
                        Novo Valor Total:
                      </span>
                      <span className="text-lg font-bold text-blue-900 dark:text-blue-100">
                        €{formData.custom_price || "0.00"}
                      </span>
                    </div>
                    {numberOfMonths > 0 ? (
                      <p className="text-xs text-blue-600 dark:text-blue-400 mt-2">
                        💡 Os pagamentos pendentes serão atualizados automaticamente com o novo valor mensal
                      </p>
                    ) : (
                      <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                        ⚠️ Altere o valor total diretamente ou ajuste as datas para recalcular
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

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