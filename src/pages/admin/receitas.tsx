import { useState, useEffect, useCallback, useMemo } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { CreateExtraRevenueDialog } from "@/components/Admin/CreateExtraRevenueDialog";
import { EditPaymentDialog } from "@/components/Admin/EditPaymentDialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, Plus, TrendingUp, DollarSign, Sparkles, Hotel, Loader2, Download, Edit2, Trash2, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths, parseISO, startOfMonth, endOfMonth } from "date-fns";
import { pt } from "date-fns/locale";
import { exportToExcel, revenueExportColumns } from "@/lib/exportUtils";

export default function ReceitasPage() {
  const [bookingPayments, setBookingPayments] = useState<any[]>([]);
  const [extraRevenues, setExtraRevenues] = useState<any[]>([]);
  const [bankAccounts, setBankAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExtraDialog, setShowExtraDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [period, setPeriod] = useState<1 | 3 | 6 | 12>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMonth, setSelectedMonth] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date_desc");
  const [editingExtraRevenue, setEditingExtraRevenue] = useState<any>(null);
  const [editingPayment, setEditingPayment] = useState<any>(null);
  const [showPaymentEditDialog, setShowPaymentEditDialog] = useState(false);

  const loadBookingPayments = useCallback(async () => {
    try {
      const cutoffDate = subMonths(new Date(), period);
      const { data, error } = await supabase
        .from("payments")
        .select(`
          *,
          bookings (
            booking_number,
            check_in_date,
            check_out_date,
            guests (full_name),
            rooms (room_number)
          )
        `)
        .eq("status", "completed")
        .gte("paid_at", cutoffDate.toISOString())
        .order("paid_at", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading booking payments:", error);
      return [];
    }
  }, [period]);

  const loadExtraRevenues = useCallback(async () => {
    try {
      const cutoffDate = subMonths(new Date(), period);
      const { data, error } = await supabase
        .from("extra_revenues")
        .select(`
          *,
          bookings (
            booking_number,
            guests (full_name),
            rooms (room_number)
          ),
          bank_accounts (
            name,
            bank_name
          )
        `)
        .not("type", "in", '("Mensalidades","Cauções")')
        .gte("date", cutoffDate.toISOString())
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading extra revenues:", error);
      return [];
    }
  }, [period]);

  const loadBankAccounts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("bank_accounts")
        .select("*")
        .eq("is_active", true)
        .order("name");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading bank accounts:", error);
      return [];
    }
  }, []);

  const loadRevenues = useCallback(async () => {
    try {
      setLoading(true);
      const [paymentsData, extrasData, bankAccountsData] = await Promise.all([
        loadBookingPayments(),
        loadExtraRevenues(),
        loadBankAccounts(),
      ]);
      setBookingPayments(paymentsData);
      setExtraRevenues(extrasData);
      setBankAccounts(bankAccountsData);
    } catch (error) {
      console.error("Error loading revenues:", error);
    } finally {
      setLoading(false);
    }
  }, [loadBookingPayments, loadExtraRevenues, loadBankAccounts]);

  useEffect(() => {
    loadRevenues();
  }, [loadRevenues]);

  const handleExtraRevenueSuccess = useCallback(() => {
    loadRevenues();
    setEditingExtraRevenue(null);
  }, [loadRevenues]);

  const handleEditExtraRevenue = useCallback((revenue: any) => {
    setEditingExtraRevenue(revenue);
    setShowExtraDialog(true);
  }, []);

  const handleEditPayment = useCallback((paymentId: string) => {
    const payment = bookingPayments.find(p => p.id === paymentId);
    if (payment) {
      setEditingPayment(payment);
      setShowPaymentEditDialog(true);
    }
  }, [bookingPayments]);

  const handlePaymentUpdateSuccess = useCallback(() => {
    loadRevenues();
    setEditingPayment(null);
  }, [loadRevenues]);

  const handleDeleteExtraRevenue = useCallback(async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta receita extra?")) return;

    try {
      const { error } = await supabase
        .from("extra_revenues")
        .delete()
        .eq("id", id);

      if (error) throw error;
      await loadRevenues();
    } catch (error) {
      console.error("Error deleting extra revenue:", error);
      alert("Erro ao eliminar receita extra");
    }
  }, [loadRevenues]);

  const handleExportToExcel = useCallback(() => {
    const exportData = filteredRevenues.map(revenue => ({
      date: revenue.date,
      type: revenue.type === "booking" ? "Pagamento de Reserva" : "Receita Extra",
      customer: revenue.customer,
      room: revenue.room,
      description: revenue.description,
      amount: revenue.amount,
      bank_account: revenue.bank_account,
    }));

    const periodLabel = period === 1 ? "1mes" : period === 3 ? "3meses" : period === 6 ? "6meses" : "12meses";
    const monthLabel = selectedMonth !== "all" ? `_${selectedMonth}` : "";
    exportToExcel(exportData, revenueExportColumns, `receitas_${periodLabel}${monthLabel}`);
  }, [period, selectedMonth]);

  const handlePeriodChange = useCallback((v: string) => {
    setPeriod(Number(v) as 1 | 3 | 6 | 12);
  }, []);

  const handleSearchChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  }, []);

  const handleShowExtraDialog = useCallback(() => {
    setShowExtraDialog(true);
  }, []);

  const handleCloseExtraDialog = useCallback((open: boolean) => {
    setShowExtraDialog(open);
    if (!open) setEditingExtraRevenue(null);
  }, []);

  const totalBookingPayments = useMemo(() => 
    bookingPayments.reduce((sum, p) => sum + p.amount, 0),
    [bookingPayments]
  );

  const totalExtraRevenue = useMemo(() => 
    extraRevenues.reduce((sum, e) => sum + e.amount, 0),
    [extraRevenues]
  );

  const totalRevenue = useMemo(() => 
    totalBookingPayments + totalExtraRevenue,
    [totalBookingPayments, totalExtraRevenue]
  );

  const availableMonths = useMemo(() => {
    const months = new Set<string>();
    
    bookingPayments.forEach(p => {
      if (p.paid_at) {
        const monthKey = format(parseISO(p.paid_at), "yyyy-MM");
        months.add(monthKey);
      }
    });
    
    extraRevenues.forEach(e => {
      const monthKey = format(parseISO(e.date), "yyyy-MM");
      months.add(monthKey);
    });
    
    return Array.from(months).sort().reverse();
  }, [bookingPayments, extraRevenues]);

  const monthOptions = useMemo(() => {
    return availableMonths.map(month => ({
      value: month,
      label: format(parseISO(month + "-01"), "MMMM yyyy", { locale: pt })
        .replace(/^\w/, (c) => c.toUpperCase())
    }));
  }, [availableMonths]);

  const allRevenues = useMemo(() => {
    const combined = [
      ...bookingPayments.map((p) => {
        const paymentTypeLabel = p.payment_type === "deposit" 
          ? "Caução" 
          : p.payment_type === "monthly" 
          ? "Mensalidade" 
          : "Pagamento";
        
        return {
          id: p.id,
          type: "booking" as const,
          date: p.paid_at || p.due_date,
          description: `${paymentTypeLabel} #${p.bookings?.booking_number || p.id.slice(0, 8)}`,
          customer: p.bookings?.guests?.full_name || "N/A",
          room: p.bookings?.rooms?.room_number || "N/A",
          amount: p.amount,
          bank_account: "-",
        };
      }),
      ...extraRevenues.map((e) => ({
        id: e.id,
        type: "extra" as const,
        date: e.date,
        description: e.description,
        customer: e.bookings?.guests?.full_name || "-",
        room: e.bookings?.rooms?.room_number || "-",
        amount: e.amount,
        bank_account: e.bank_accounts?.name || "-",
      })),
    ];
    return combined;
  }, [bookingPayments, extraRevenues]);

  const filteredRevenues = useMemo(() => {
    const filtered = allRevenues.filter((revenue) => {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        revenue.description.toLowerCase().includes(query) ||
        revenue.customer.toLowerCase().includes(query) ||
        revenue.room.toString().toLowerCase().includes(query);

      const matchesMonth = selectedMonth === "all" || 
        format(parseISO(revenue.date), "yyyy-MM") === selectedMonth;

      const matchesTab = 
        activeTab === "all" ||
        (activeTab === "bookings" && revenue.type === "booking") ||
        (activeTab === "extras" && revenue.type === "extra");

      return matchesSearch && matchesMonth && matchesTab;
    });

    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "date_asc":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "date_desc":
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        case "amount_asc":
          return a.amount - b.amount;
        case "amount_desc":
          return b.amount - a.amount;
        case "guest_asc":
          return a.customer.localeCompare(b.customer);
        case "guest_desc":
          return b.customer.localeCompare(a.customer);
        case "room_asc":
          return a.room.toString().localeCompare(b.room.toString(), undefined, { numeric: true });
        case "room_desc":
          return b.room.toString().localeCompare(a.room.toString(), undefined, { numeric: true });
        default:
          return 0;
      }
    });
  }, [allRevenues, searchQuery, selectedMonth, activeTab, sortBy]);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar receitas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Receitas</h1>
            <p className="text-muted-foreground mt-2">Análise de pagamentos recebidos e receitas extras</p>
          </div>
          <div className="flex gap-2">
            <Select value={period.toString()} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último Mês</SelectItem>
                <SelectItem value="3">Últimos 3 Meses</SelectItem>
                <SelectItem value="6">Últimos 6 Meses</SelectItem>
                <SelectItem value="12">Últimos 12 Meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={handleShowExtraDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Receita Extra
            </Button>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total (Paga)</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Valores efetivamente recebidos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Pagamentos de Reservas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalBookingPayments.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{bookingPayments.length} pagamentos recebidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receitas Extra</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalExtraRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{extraRevenues.length} receitas extras</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-muted-foreground" />
              <CardTitle>Filtros</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Pesquisar</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Cliente, descrição ou quarto..."
                    value={searchQuery}
                    onChange={handleSearchChange}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="month-filter">Filtrar por Mês</Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger id="month-filter" className="w-[200px]">
                    <SelectValue placeholder="Selecionar mês" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os meses</SelectItem>
                    {monthOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="sort-filter">Ordenar por</Label>
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger id="sort-filter" className="w-[200px]">
                    <SelectValue placeholder="Ordenar por..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="date_desc">Data (Mais recente)</SelectItem>
                    <SelectItem value="date_asc">Data (Mais antiga)</SelectItem>
                    <SelectItem value="amount_desc">Valor (Maior)</SelectItem>
                    <SelectItem value="amount_asc">Valor (Menor)</SelectItem>
                    <SelectItem value="guest_asc">Hóspede (A-Z)</SelectItem>
                    <SelectItem value="guest_desc">Hóspede (Z-A)</SelectItem>
                    <SelectItem value="room_asc">Quarto (Crescente)</SelectItem>
                    <SelectItem value="room_desc">Quarto (Decrescente)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Receitas ({filteredRevenues.length})</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="bookings">Pagamentos de Reservas</TabsTrigger>
                  <TabsTrigger value="extras">Receitas Extras</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Cliente</TableHead>
                  <TableHead>Quarto</TableHead>
                  <TableHead>Descrição</TableHead>
                  <TableHead>Conta Bancária</TableHead>
                  <TableHead className="text-right">Valor Pago</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRevenues.map((revenue) => (
                  <TableRow key={`${revenue.type}-${revenue.id}`}>
                    <TableCell>{format(parseISO(revenue.date), "dd MMM yyyy", { locale: pt })}</TableCell>
                    <TableCell>
                      <Badge variant={revenue.type === "booking" ? "default" : "secondary"}>
                        {revenue.type === "booking" ? "Pagamento" : "Extra"}
                      </Badge>
                    </TableCell>
                    <TableCell>{revenue.customer}</TableCell>
                    <TableCell>{revenue.room}</TableCell>
                    <TableCell>{revenue.description}</TableCell>
                    <TableCell>{revenue.bank_account}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      €{revenue.amount.toFixed(2)}
                    </TableCell>
                    <TableCell className="text-right">
                      {revenue.type === "extra" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditExtraRevenue(extraRevenues.find(e => e.id === revenue.id))}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteExtraRevenue(revenue.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {revenue.type === "booking" && (
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditPayment(revenue.id)}
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredRevenues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      Nenhuma receita encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <CreateExtraRevenueDialog 
          open={showExtraDialog} 
          onOpenChange={handleCloseExtraDialog} 
          onSuccess={handleExtraRevenueSuccess}
          editRevenue={editingExtraRevenue}
          bankAccounts={bankAccounts}
        />

        {editingPayment && (
          <EditPaymentDialog
            open={showPaymentEditDialog}
            onOpenChange={setShowPaymentEditDialog}
            payment={editingPayment}
            onSuccess={handlePaymentUpdateSuccess}
          />
        )}
      </div>
    </AdminLayout>
  );
}