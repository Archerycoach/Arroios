import React, { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { paymentService } from "@/services/paymentService";
import type { Database } from "@/integrations/supabase/types";
import { CheckCircle2, Clock, RefreshCw, Euro, Download } from "lucide-react";
import { MarkPaymentPaidDialog } from "./MarkPaymentPaidDialog";
import { RefundDepositDialog } from "./RefundDepositDialog";
import * as XLSX from "xlsx";

type BookingPayment = Database["public"]["Tables"]["booking_payments"]["Row"];

interface BookingPaymentsListProps {
  bookingId: string;
  onPaymentUpdate?: () => void;
}

export function BookingPaymentsList({ bookingId, onPaymentUpdate }: BookingPaymentsListProps) {
  const [payments, setPayments] = useState<BookingPayment[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayment, setSelectedPayment] = useState<BookingPayment | null>(null);
  const [showMarkPaidDialog, setShowMarkPaidDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [stats, setStats] = useState({ total: 0, paid: 0, pending: 0, depositStatus: null as string | null });

  const loadPayments = async () => {
    setLoading(true);
    const data = await paymentService.getBookingPayments(bookingId);
    const statistics = await paymentService.getPaymentStats(bookingId);
    setPayments(data);
    setStats(statistics);
    setLoading(false);
  };

  useEffect(() => {
    loadPayments();
  }, [bookingId]);

  const handlePaymentMarkedPaid = () => {
    loadPayments();
    setShowMarkPaidDialog(false);
    setSelectedPayment(null);
    onPaymentUpdate?.();
  };

  const handleDepositRefunded = () => {
    loadPayments();
    setShowRefundDialog(false);
    onPaymentUpdate?.();
  };

  const getStatusBadge = (payment: BookingPayment) => {
    if (payment.status === "paid") {
      return <Badge className="bg-green-500"><CheckCircle2 className="w-3 h-3 mr-1" />Pago</Badge>;
    }
    if (payment.status === "refunded") {
      return <Badge className="bg-blue-500"><RefreshCw className="w-3 h-3 mr-1" />Devolvido</Badge>;
    }
    
    const dueDate = new Date(payment.due_date);
    const today = new Date();
    const isOverdue = dueDate < today;
    
    return (
      <Badge variant={isOverdue ? "destructive" : "secondary"}>
        <Clock className="w-3 h-3 mr-1" />
        {isOverdue ? "Atrasado" : "Pendente"}
      </Badge>
    );
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "monthly":
        return "Mensalidade";
      case "deposit":
        return "Caução de Segurança";
      case "deposit_refund":
        return "Devolução de Caução";
      default:
        return type;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("pt-PT", { day: "2-digit", month: "2-digit", year: "numeric" });
  };

  const depositPayment = payments.find((p) => p.payment_type === "deposit");

  const handleExportToExcel = () => {
    if (payments.length === 0) {
      alert("Nenhum pagamento para exportar");
      return;
    }

    const exportData = payments.map((payment) => ({
      "Tipo": getPaymentTypeLabel(payment.payment_type),
      "Valor": `€${payment.amount.toFixed(2)}`,
      "Vencimento": formatDate(payment.due_date),
      "Status": payment.status === "paid" ? "Pago" : payment.status === "refunded" ? "Devolvido" : "Pendente",
      "Data Pagamento": payment.paid_date ? formatDate(payment.paid_date) : "-",
      "Método": payment.payment_method || "-",
      "Notas": payment.notes || "-",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");
    XLSX.writeFile(wb, `pagamentos_reserva_${bookingId.substring(0, 8)}.xlsx`);
  };

  if (loading) {
    return <div className="text-center py-8">A carregar pagamentos...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Pagamentos da Reserva</span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportToExcel}
                disabled={payments.length === 0}
              >
                <Download className="w-4 h-4 mr-2" />
                Exportar Excel
              </Button>
              <Badge variant="outline" className="text-lg">
                <Euro className="w-4 h-4 mr-1" />
                Pago: €{stats.paid.toFixed(2)}
              </Badge>
              <Badge variant="outline" className="text-lg">
                <Clock className="w-4 h-4 mr-1" />
                Pendente: €{stats.pending.toFixed(2)}
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {payments.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">
                Nenhum pagamento registado para esta reserva.
              </p>
            ) : (
              <>
                {/* Monthly Payments Section */}
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm text-muted-foreground">Pagamentos Mensais</h3>
                  {payments
                    .filter((p) => p.payment_type === "monthly")
                    .map((payment) => (
                      <div
                        key={payment.id}
                        className="flex items-center justify-between p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium">{getPaymentTypeLabel(payment.payment_type)}</span>
                            {getStatusBadge(payment)}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <span>Vencimento: {formatDate(payment.due_date)}</span>
                            {payment.paid_date && (
                              <span className="ml-4">
                                Pago em: {formatDate(payment.paid_date)}
                                {payment.payment_method && ` (${payment.payment_method})`}
                              </span>
                            )}
                          </div>
                          {payment.notes && (
                            <div className="text-sm text-muted-foreground mt-1 italic">
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-lg font-semibold">€{payment.amount.toFixed(2)}</span>
                          {payment.status === "pending" && (
                            <Button
                              size="sm"
                              onClick={() => {
                                setSelectedPayment(payment);
                                setShowMarkPaidDialog(true);
                              }}
                            >
                              Marcar como Pago
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                {/* Security Deposit Section */}
                {depositPayment && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-semibold text-sm text-muted-foreground">Caução de Segurança</h3>
                    <div className="flex items-center justify-between p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{getPaymentTypeLabel(depositPayment.payment_type)}</span>
                          {getStatusBadge(depositPayment)}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          <span>Vencimento: {formatDate(depositPayment.due_date)}</span>
                          {depositPayment.paid_date && (
                            <span className="ml-4">
                              Pago em: {formatDate(depositPayment.paid_date)}
                              {depositPayment.payment_method && ` (${depositPayment.payment_method})`}
                            </span>
                          )}
                        </div>
                        {depositPayment.notes && (
                          <div className="text-sm text-muted-foreground mt-1 italic">
                            {depositPayment.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-lg font-semibold">€{depositPayment.amount.toFixed(2)}</span>
                        {depositPayment.status === "pending" && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setShowRefundDialog(true)}
                          >
                            Devolver Caução
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {/* Refund Records */}
                {payments.filter((p) => p.payment_type === "deposit_refund").length > 0 && (
                  <div className="space-y-2 pt-4 border-t">
                    <h3 className="font-semibold text-sm text-muted-foreground">Devoluções</h3>
                    {payments
                      .filter((p) => p.payment_type === "deposit_refund")
                      .map((payment) => (
                        <div
                          key={payment.id}
                          className="flex items-center justify-between p-4 border rounded-lg bg-green-50 dark:bg-green-950/20"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium">{getPaymentTypeLabel(payment.payment_type)}</span>
                              {getStatusBadge(payment)}
                            </div>
                            <div className="text-sm text-muted-foreground">
                              <span>Data: {formatDate(payment.paid_date || payment.due_date)}</span>
                              {payment.payment_method && (
                                <span className="ml-4">Método: {payment.payment_method}</span>
                              )}
                            </div>
                            {payment.notes && (
                              <div className="text-sm text-muted-foreground mt-1 italic">
                                {payment.notes}
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-lg font-semibold text-green-600">
                              €{Math.abs(payment.amount).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </>
            )}
          </div>

          {/* Summary */}
          <div className="mt-6 pt-6 border-t">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total da Reserva:</span>
              <span>€{stats.total.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground mt-1">
              <span>Já pago:</span>
              <span className="text-green-600 font-medium">€{stats.paid.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm text-muted-foreground">
              <span>Por pagar:</span>
              <span className="text-orange-600 font-medium">€{stats.pending.toFixed(2)}</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Mark Payment as Paid Dialog */}
      {selectedPayment && (
        <MarkPaymentPaidDialog
          open={showMarkPaidDialog}
          onOpenChange={setShowMarkPaidDialog}
          payment={selectedPayment}
          onSuccess={handlePaymentMarkedPaid}
        />
      )}

      {/* Refund Deposit Dialog */}
      {depositPayment && (
        <RefundDepositDialog
          open={showRefundDialog}
          onOpenChange={setShowRefundDialog}
          bookingId={bookingId}
          depositAmount={depositPayment.amount}
          onSuccess={handleDepositRefunded}
        />
      )}
    </>
  );
}