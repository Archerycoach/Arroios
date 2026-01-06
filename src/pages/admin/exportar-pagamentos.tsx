import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Download, Filter, Calendar, Home, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { paymentService } from "@/services/paymentService";
import { roomService } from "@/services/roomService";
import * as XLSX from "xlsx";

type PaymentStatus = "all" | "pending" | "paid" | "overdue";

interface PaymentWithDetails {
  id: string;
  booking_id: string;
  payment_type: "monthly" | "deposit" | "deposit_refund";
  amount: number;
  due_date: string;
  paid_date: string | null;
  status: "pending" | "paid" | "refunded";
  payment_method: string | null;
  notes: string | null;
  booking: {
    room: {
      number: string;
      name: string;
    };
    guest: {
      full_name: string;
      tax_id: string | null;
      email: string;
    };
  };
}

export default function ExportarPagamentosPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [payments, setPayments] = useState<PaymentWithDetails[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<PaymentWithDetails[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  // Filters
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [selectedRoom, setSelectedRoom] = useState<string>("all");
  const [selectedStatus, setSelectedStatus] = useState<PaymentStatus>("all");

  // Stats
  const [stats, setStats] = useState({
    total: 0,
    totalAmount: 0,
    paidAmount: 0,
    pendingAmount: 0,
  });

  // Generate month options (current month + 24 months)
  const monthOptions = Array.from({ length: 24 }, (_, i) => {
    const date = new Date();
    date.setMonth(date.getMonth() + i);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    return {
      value: `${year}-${String(month).padStart(2, "0")}`,
      label: date.toLocaleDateString("pt-PT", { month: "long", year: "numeric" }),
    };
  });

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [selectedMonth, selectedRoom, selectedStatus, payments]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load all payments with details
      const allPayments = await paymentService.getAllPaymentsWithDetails();
      // Cast to correct type since DB returns string for enum
      setPayments(allPayments as unknown as PaymentWithDetails[]);

      // Load rooms for filter
      const roomsData = await roomService.getAll();
      setRooms(roomsData);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Falha ao carregar dados de pagamentos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...payments];

    // Filter by month
    if (selectedMonth !== "all") {
      filtered = filtered.filter((p) => {
        const paymentMonth = p.due_date.substring(0, 7); // YYYY-MM
        return paymentMonth === selectedMonth;
      });
    }

    // Filter by room
    if (selectedRoom !== "all") {
      filtered = filtered.filter((p) => p.booking.room.number === selectedRoom);
    }

    // Filter by status
    if (selectedStatus !== "all") {
      filtered = filtered.filter((p) => {
        if (selectedStatus === "paid") return p.status === "paid";
        if (selectedStatus === "pending") return p.status === "pending";
        if (selectedStatus === "overdue") {
          return p.status === "pending" && new Date(p.due_date) < new Date();
        }
        return true;
      });
    }

    setFilteredPayments(filtered);

    // Calculate stats
    const totalAmount = filtered.reduce((sum, p) => sum + p.amount, 0);
    const paidAmount = filtered
      .filter((p) => p.status === "paid")
      .reduce((sum, p) => sum + p.amount, 0);
    const pendingAmount = filtered
      .filter((p) => p.status === "pending")
      .reduce((sum, p) => sum + p.amount, 0);

    setStats({
      total: filtered.length,
      totalAmount,
      paidAmount,
      pendingAmount,
    });
  };

  const handleExportToExcel = () => {
    if (filteredPayments.length === 0) {
      toast({
        title: "Aviso",
        description: "Não há pagamentos para exportar com os filtros selecionados.",
        variant: "destructive",
      });
      return;
    }

    // Prepare data for Excel
    const excelData = filteredPayments.map((payment) => ({
      Quarto: payment.booking.room.number,
      "Nome do Quarto": payment.booking.room.name,
      Hóspede: payment.booking.guest.full_name,
      NIF: payment.booking.guest.tax_id || "N/A",
      Email: payment.booking.guest.email,
      Tipo: getPaymentTypeLabel(payment.payment_type),
      Valor: `€${payment.amount.toFixed(2)}`,
      Vencimento: new Date(payment.due_date).toLocaleDateString("pt-PT"),
      Status: getStatusLabel(payment),
      "Data Pagamento": payment.paid_date
        ? new Date(payment.paid_date).toLocaleDateString("pt-PT")
        : "-",
      Método: payment.payment_method || "-",
      Notas: payment.notes || "-",
    }));

    // Create workbook
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Pagamentos");

    // Auto-size columns
    const maxWidth = 20;
    const wscols = Object.keys(excelData[0] || {}).map(() => ({ wch: maxWidth }));
    ws["!cols"] = wscols;

    // Generate filename
    let filename = "pagamentos";
    if (selectedMonth !== "all") {
      const monthLabel = monthOptions.find((m) => m.value === selectedMonth)?.label || "";
      filename += `_${monthLabel.replace(" ", "_")}`;
    }
    if (selectedRoom !== "all") {
      filename += `_quarto_${selectedRoom}`;
    }
    filename += `.xlsx`;

    // Download
    XLSX.writeFile(wb, filename);

    toast({
      title: "Sucesso",
      description: `Exportados ${filteredPayments.length} pagamentos para Excel.`,
    });
  };

  const getPaymentTypeLabel = (type: string) => {
    switch (type) {
      case "monthly":
        return "Mensalidade";
      case "deposit":
        return "Caução";
      case "deposit_refund":
        return "Devolução Caução";
      default:
        return type;
    }
  };

  const getStatusLabel = (payment: PaymentWithDetails) => {
    if (payment.status === "paid") return "Pago";
    if (payment.status === "refunded") return "Devolvido";
    if (payment.status === "pending") {
      const isOverdue = new Date(payment.due_date) < new Date();
      return isOverdue ? "Atrasado" : "Pendente";
    }
    return payment.status;
  };

  const getStatusBadge = (payment: PaymentWithDetails) => {
    if (payment.status === "paid") {
      return <Badge className="bg-green-500">✅ Pago</Badge>;
    }
    if (payment.status === "refunded") {
      return <Badge className="bg-blue-500">🔄 Devolvido</Badge>;
    }
    if (payment.status === "pending") {
      const isOverdue = new Date(payment.due_date) < new Date();
      return isOverdue ? (
        <Badge className="bg-red-500">🔴 Atrasado</Badge>
      ) : (
        <Badge className="bg-yellow-500">⏰ Pendente</Badge>
      );
    }
    return null;
  };

  return (
    <ProtectedAdminPage>
      <AdminLayout>
        <div className="container mx-auto py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold">📊 Exportar Pagamentos</h1>
            <p className="text-muted-foreground mt-2">
              Filtre e exporte pagamentos para Excel com informações detalhadas
            </p>
          </div>

          {/* Filters Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Month Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Filtrar por Mês
                  </label>
                  <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar mês" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Meses</SelectItem>
                      {monthOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Room Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Home className="h-4 w-4" />
                    Filtrar por Quarto
                  </label>
                  <Select value={selectedRoom} onValueChange={setSelectedRoom}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar quarto" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os Quartos</SelectItem>
                      {rooms.map((room) => (
                        <SelectItem key={room.id} value={room.number}>
                          {room.number} - {room.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Status Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Filtrar por Status
                  </label>
                  <Select
                    value={selectedStatus}
                    onValueChange={(value) => setSelectedStatus(value as PaymentStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecionar status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="pending">⏰ Pendentes</SelectItem>
                      <SelectItem value="paid">✅ Pagos</SelectItem>
                      <SelectItem value="overdue">🔴 Atrasados</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Statistics Card */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>📊 Estatísticas</span>
                <Button onClick={handleExportToExcel} disabled={filteredPayments.length === 0}>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar para Excel
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Total de Pagamentos</div>
                  <div className="text-2xl font-bold">{stats.total}</div>
                </div>
                <div className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Valor Total</div>
                  <div className="text-2xl font-bold">€{stats.totalAmount.toFixed(2)}</div>
                </div>
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Já Pago</div>
                  <div className="text-2xl font-bold text-green-600">
                    €{stats.paidAmount.toFixed(2)}
                  </div>
                </div>
                <div className="p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-sm text-muted-foreground">Por Pagar</div>
                  <div className="text-2xl font-bold text-orange-600">
                    €{stats.pendingAmount.toFixed(2)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Payments Table */}
          <Card>
            <CardHeader>
              <CardTitle>📋 Preview dos Pagamentos</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">Carregando...</div>
              ) : filteredPayments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhum pagamento encontrado com os filtros selecionados.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quarto</TableHead>
                        <TableHead>Hóspede</TableHead>
                        <TableHead>NIF</TableHead>
                        <TableHead>Tipo</TableHead>
                        <TableHead>Valor</TableHead>
                        <TableHead>Vencimento</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Pago Em</TableHead>
                        <TableHead>Método</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPayments.map((payment) => (
                        <TableRow key={payment.id}>
                          <TableCell className="font-medium">
                            {payment.booking.room.number}
                          </TableCell>
                          <TableCell>{payment.booking.guest.full_name}</TableCell>
                          <TableCell>{payment.booking.guest.tax_id || "N/A"}</TableCell>
                          <TableCell>{getPaymentTypeLabel(payment.payment_type)}</TableCell>
                          <TableCell>€{payment.amount.toFixed(2)}</TableCell>
                          <TableCell>
                            {new Date(payment.due_date).toLocaleDateString("pt-PT")}
                          </TableCell>
                          <TableCell>{getStatusBadge(payment)}</TableCell>
                          <TableCell>
                            {payment.paid_date
                              ? new Date(payment.paid_date).toLocaleDateString("pt-PT")
                              : "-"}
                          </TableCell>
                          <TableCell>{payment.payment_method || "-"}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </AdminLayout>
    </ProtectedAdminPage>
  );
}