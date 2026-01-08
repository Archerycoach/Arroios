import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Calendar, CheckCircle2, Circle, Euro, Plus } from "lucide-react";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { paymentService } from "@/services/paymentService";
import { BookingWithDetails } from "@/services/bookingService";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { MarkPaymentPaidDialog } from "./MarkPaymentPaidDialog";
import type { Database } from "@/integrations/supabase/types";

type Payment = Database["public"]["Tables"]["payments"]["Row"];

interface BookingPaymentsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  booking: BookingWithDetails | null;
  onSuccess: () => void;
}

export function BookingPaymentsDialog({ open, onOpenChange, booking, onSuccess }: BookingPaymentsDialogProps) {
  const { toast } = useToast();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [markPaidDialogOpen, setMarkPaidDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);

  useEffect(() => {
    if (open && booking) {
      loadPayments();
    }
  }, [open, booking]);

  const loadPayments = async () => {
    if (!booking) return;
    
    try {
      setLoading(true);
      const paymentsData = await paymentService.getByBookingId(booking.id);
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error loading payments:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao carregar pagamentos"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAsPaid = (payment: Payment) => {
    setSelectedPayment(payment);
    setMarkPaidDialogOpen(true);
  };

  const handlePaymentMarked = () => {
    loadPayments();
    onSuccess();
    setMarkPaidDialogOpen(false);
    setSelectedPayment(null);
  };

  const handleGeneratePayments = async () => {
    if (!booking) return;
    
    try {
      setLoading(true);
      
      // Calculate period information
      const checkIn = new Date(booking.check_in_date);
      const checkOut = new Date(booking.check_out_date);
      const days = differenceInDays(checkOut, checkIn);
      const complete15DayPeriods = Math.floor(days / 15);
      const numberOfMonths = Math.ceil(complete15DayPeriods / 2); // Round up to ensure full coverage
      
      // Calculate monthly amount (divide total by number of months)
      const monthlyAmount = booking.total_amount / numberOfMonths;
      
      // Generate payments (no deposit here, as it should be handled separately)
      const result = await paymentService.generatePaymentsForBooking(
        booking.id,
        monthlyAmount,
        numberOfMonths,
        booking.check_in_date,
        false, // Don't include deposit
        0
      );
      
      if (result.success) {
        toast({
          title: "Sucesso",
          description: `${numberOfMonths} mensalidade${numberOfMonths > 1 ? 's' : ''} gerada${numberOfMonths > 1 ? 's' : ''} com sucesso`
        });
        loadPayments();
        onSuccess();
      } else {
        toast({
          variant: "destructive",
          title: "Erro",
          description: result.error || "Erro ao gerar pagamentos"
        });
      }
    } catch (error) {
      console.error("Error generating payments:", error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao gerar pagamentos"
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500">Pago</Badge>;
      case "pending":
        return <Badge variant="outline" className="border-yellow-500 text-yellow-700">Pendente</Badge>;
      case "failed":
        return <Badge variant="destructive">Falhado</Badge>;
      case "refunded":
        return <Badge variant="secondary">Reembolsado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const calculatePeriodInfo = () => {
    if (!booking) return null;
    
    const checkIn = new Date(booking.check_in_date);
    const checkOut = new Date(booking.check_out_date);
    const days = differenceInDays(checkOut, checkIn);
    const complete15DayPeriods = Math.floor(days / 15);
    const completeMonths = Math.floor(complete15DayPeriods / 2);
    const remaining15DayPeriods = complete15DayPeriods % 2;
    
    return {
      days,
      complete15DayPeriods,
      completeMonths,
      remaining15DayPeriods
    };
  };

  const periodInfo = calculatePeriodInfo();
  const totalPaid = payments.filter(p => p.status === "completed").reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments.filter(p => p.status === "pending").reduce((sum, p) => sum + p.amount, 0);

  if (!booking) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Pagamentos da Reserva #{booking.booking_number}</DialogTitle>
            <DialogDescription>
              Gerir pagamentos mensais e confirmar recebimentos
            </DialogDescription>
          </DialogHeader>

          {/* Booking Summary */}
          <div className="rounded-lg border bg-muted/50 p-4 space-y-2">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-muted-foreground">Hóspede:</span>
                <div className="font-medium">{booking.guest.full_name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Quarto:</span>
                <div className="font-medium">{booking.room.name}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Check-in:</span>
                <div className="font-medium">{format(new Date(booking.check_in_date), "dd/MM/yyyy", { locale: pt })}</div>
              </div>
              <div>
                <span className="text-muted-foreground">Check-out:</span>
                <div className="font-medium">{format(new Date(booking.check_out_date), "dd/MM/yyyy", { locale: pt })}</div>
              </div>
            </div>
            
            {periodInfo && (
              <Alert className="mt-3">
                <Calendar className="h-4 w-4" />
                <AlertDescription>
                  <div className="space-y-1">
                    <div><strong>Duração:</strong> {periodInfo.days} dias = {periodInfo.complete15DayPeriods} períodos de 15 dias</div>
                    {periodInfo.completeMonths > 0 && (
                      <div><strong>Meses completos:</strong> {periodInfo.completeMonths}</div>
                    )}
                    {periodInfo.remaining15DayPeriods > 0 && (
                      <div><strong>Períodos de 15 dias:</strong> {periodInfo.remaining15DayPeriods}</div>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}
          </div>

          {/* Payment Summary Cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="rounded-lg border p-4">
              <div className="text-sm text-muted-foreground mb-1">Total da Reserva</div>
              <div className="text-2xl font-bold">€{booking.total_amount.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-4 bg-green-50">
              <div className="text-sm text-muted-foreground mb-1">Total Pago</div>
              <div className="text-2xl font-bold text-green-600">€{totalPaid.toFixed(2)}</div>
            </div>
            <div className="rounded-lg border p-4 bg-yellow-50">
              <div className="text-sm text-muted-foreground mb-1">Por Pagar</div>
              <div className="text-2xl font-bold text-yellow-600">€{totalPending.toFixed(2)}</div>
            </div>
          </div>

          {/* Payments List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Pagamentos Programados</h3>
              {payments.length === 0 && (
                <Button size="sm" variant="outline" onClick={handleGeneratePayments} disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  Gerar Pagamentos
                </Button>
              )}
            </div>

            {loading ? (
              <div className="text-center py-8 text-muted-foreground">
                A carregar pagamentos...
              </div>
            ) : payments.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Circle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                <p>Nenhum pagamento registado</p>
                <p className="text-sm">Gere os pagamentos mensais para esta reserva</p>
              </div>
            ) : (
              <div className="space-y-2">
                {payments.map((payment, index) => {
                  const isPending = payment.status === "pending";
                  const isCompleted = payment.status === "completed";
                  
                  return (
                    <div
                      key={payment.id}
                      className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                        isPending ? 'bg-yellow-50 border-yellow-200' : 'hover:bg-muted/50'
                      }`}
                    >
                      <div className="flex items-center gap-4 flex-1">
                        {isCompleted ? (
                          <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                        ) : (
                          <Circle className="h-5 w-5 text-yellow-500 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <div className="font-medium">
                            {payment.payment_type === "deposit" ? "Caução" : `Mensalidade ${index + 1}`}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            Vencimento: {format(new Date(payment.due_date), "dd/MM/yyyy", { locale: pt })}
                          </div>
                          {payment.paid_at && (
                            <div className="text-sm text-green-600">
                              Pago em: {format(new Date(payment.paid_at), "dd/MM/yyyy", { locale: pt })}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold">€{payment.amount.toFixed(2)}</div>
                          {getStatusBadge(payment.status)}
                        </div>
                        
                        {isPending && (
                          <Button
                            size="sm"
                            onClick={() => handleMarkAsPaid(payment)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Euro className="h-4 w-4 mr-2" />
                            Confirmar Pagamento
                          </Button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Mark Payment as Paid Dialog */}
      {selectedPayment && (
        <MarkPaymentPaidDialog
          open={markPaidDialogOpen}
          onOpenChange={setMarkPaidDialogOpen}
          payment={selectedPayment}
          onSuccess={handlePaymentMarked}
        />
      )}
    </>
  );
}