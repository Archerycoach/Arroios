import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { CreateExtraRevenueDialog } from "@/components/Admin/CreateExtraRevenueDialog";
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
import { Search, Plus, TrendingUp, DollarSign, Sparkles, Hotel, Loader2, Download } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { supabase } from "@/integrations/supabase/client";
import { format, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { exportToExcel, revenueExportColumns } from "@/lib/exportUtils";

export default function ReceitasPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [extraRevenues, setExtraRevenues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showExtraDialog, setShowExtraDialog] = useState(false);
  const [showBookingRevenueDialog, setShowBookingRevenueDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [period, setPeriod] = useState<1 | 3 | 6 | 12>(1);

  // Form data for booking revenue
  const [bookingRevenueForm, setBookingRevenueForm] = useState({
    booking_id: "",
    description: "",
    amount: "",
    date: new Date().toISOString().split("T")[0],
    payment_method: "card",
  });
  const [availableBookings, setAvailableBookings] = useState<any[]>([]);
  const [savingBookingRevenue, setSavingBookingRevenue] = useState(false);

  useEffect(() => {
    loadRevenues();
  }, []);

  useEffect(() => {
    if (showBookingRevenueDialog) {
      loadAvailableBookings();
    }
  }, [showBookingRevenueDialog]);

  const loadRevenues = async () => {
    try {
      setLoading(true);
      const [bookingsData, extrasData] = await Promise.all([
        loadBookingRevenues(),
        loadExtraRevenues(),
      ]);
      setBookings(bookingsData);
      setExtraRevenues(extrasData);
    } catch (error) {
      console.error("Error loading revenues:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadBookingRevenues = async () => {
    try {
      const data = await bookingService.getAll();
      const cutoffDate = subMonths(new Date(), period);
      return data.filter((b: any) => {
        const isValidStatus = b.status === "paid" || b.status === "completed";
        const isInPeriod = new Date(b.created_at) >= cutoffDate;
        return isValidStatus && isInPeriod;
      });
    } catch (error) {
      console.error("Error loading booking revenues:", error);
      return [];
    }
  };

  const loadExtraRevenues = async () => {
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
          )
        `)
        .gte("date", cutoffDate.toISOString())
        .order("date", { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error loading extra revenues:", error);
      return [];
    }
  };

  const loadAvailableBookings = async () => {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_number,
          check_in_date,
          check_out_date,
          total_amount,
          guests (
            full_name
          ),
          rooms (
            room_number
          )
        `)
        .in("status", ["confirmed", "completed"])
        .order("created_at", { ascending: false });

      if (error) throw error;
      setAvailableBookings(data || []);
    } catch (error) {
      console.error("Error loading bookings:", error);
    }
  };

  const handleCreateBookingRevenue = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingBookingRevenue(true);

    try {
      const revenueData = {
        type: "booking_payment",
        description: bookingRevenueForm.description || "Pagamento de reserva",
        amount: parseFloat(bookingRevenueForm.amount),
        date: bookingRevenueForm.date,
        booking_id: bookingRevenueForm.booking_id || null,
      };

      const { error } = await supabase.from("extra_revenues").insert([revenueData]);

      if (error) throw error;

      await loadRevenues();
      setShowBookingRevenueDialog(false);

      // Reset form
      setBookingRevenueForm({
        booking_id: "",
        description: "",
        amount: "",
        date: new Date().toISOString().split("T")[0],
        payment_method: "card",
      });
    } catch (error) {
      console.error("Error creating booking revenue:", error);
      alert("Erro ao criar receita de reserva");
    } finally {
      setSavingBookingRevenue(false);
    }
  };

  const handleExportToExcel = () => {
    const exportData = filteredRevenues.map(revenue => ({
      date: revenue.date,
      type: revenue.type === "booking" ? "Reserva" : "Extra",
      customer: revenue.customer,
      room: revenue.room,
      description: revenue.description,
      nights: revenue.nights,
      amount: revenue.amount,
      channel: revenue.channel,
    }));

    const periodLabel = period === 1 ? "1mes" : period === 3 ? "3meses" : period === 6 ? "6meses" : "12meses";
    exportToExcel(exportData, revenueExportColumns, `receitas_${periodLabel}`);
  };

  const totalBookingRevenue = bookings.reduce((sum, b) => sum + b.total_amount, 0);
  const totalExtraRevenue = extraRevenues.reduce((sum, e) => sum + e.amount, 0);
  const totalRevenue = totalBookingRevenue + totalExtraRevenue;

  const allRevenues = [
    ...bookings.map((b) => ({
      id: b.id,
      type: "booking" as const,
      date: b.created_at,
      description: `Reserva #${b.booking_number || b.id.slice(0, 8)}`,
      customer: b.guests?.full_name || "N/A",
      room: b.rooms?.room_number || "N/A",
      nights: b.num_nights,
      amount: b.total_amount,
      channel: "Site",
    })),
    ...extraRevenues.map((e) => ({
      id: e.id,
      type: "extra" as const,
      date: e.date,
      description: e.description,
      customer: e.bookings?.guests?.full_name || "N/A",
      room: e.bookings?.rooms?.room_number || "-",
      nights: "-",
      amount: e.amount,
      channel: "Extra",
    })),
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const filteredRevenues = allRevenues.filter((revenue) => {
    const query = searchQuery.toLowerCase();
    const matchesSearch =
      revenue.description.toLowerCase().includes(query) ||
      revenue.customer.toLowerCase().includes(query) ||
      revenue.room.toString().toLowerCase().includes(query);

    if (activeTab === "all") return matchesSearch;
    if (activeTab === "bookings") return matchesSearch && revenue.type === "booking";
    if (activeTab === "extras") return matchesSearch && revenue.type === "extra";
    return matchesSearch;
  });

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
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Receitas</h1>
            <p className="text-muted-foreground mt-2">Análise de todas as entradas de receita</p>
          </div>
          <div className="flex gap-2">
            <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v) as 1 | 3 | 6 | 12)}>
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
            <Button onClick={() => setShowBookingRevenueDialog(true)} variant="outline">
              <Hotel className="h-4 w-4 mr-2" />
              Receita
            </Button>
            <Button onClick={() => setShowExtraDialog(true)}>
              <Plus className="h-4 w-4 mr-2" />
              Receita Extra
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-green-500">+18.5%</span> vs mês anterior
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reservas</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalBookingRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{bookings.length} reservas pagas</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receitas Extra</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalExtraRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">{extraRevenues.length} serviços extras</p>
            </CardContent>
          </Card>
        </div>

        {/* Search */}
        <Card>
          <CardHeader>
            <CardTitle>Pesquisar Receitas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Pesquisar por cliente, quarto ou descrição..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardContent>
        </Card>

        {/* Revenues Table with Tabs */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Lista de Receitas ({filteredRevenues.length})</CardTitle>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList>
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="bookings">Reservas</TabsTrigger>
                  <TabsTrigger value="extras">Extras</TabsTrigger>
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
                  <TableHead>Noites</TableHead>
                  <TableHead className="text-right">Valor</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRevenues.map((revenue) => (
                  <TableRow key={`${revenue.type}-${revenue.id}`}>
                    <TableCell>{format(new Date(revenue.date), "dd MMM yyyy", { locale: pt })}</TableCell>
                    <TableCell>
                      <Badge variant={revenue.type === "booking" ? "default" : "secondary"}>
                        {revenue.type === "booking" ? "Reserva" : "Extra"}
                      </Badge>
                    </TableCell>
                    <TableCell>{revenue.customer}</TableCell>
                    <TableCell>{revenue.room}</TableCell>
                    <TableCell>{revenue.description}</TableCell>
                    <TableCell>{revenue.nights}</TableCell>
                    <TableCell className="text-right font-semibold text-green-600">
                      €{revenue.amount.toFixed(2)}
                    </TableCell>
                  </TableRow>
                ))}

                {filteredRevenues.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Nenhuma receita encontrada
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Extra Revenue Dialog */}
        <CreateExtraRevenueDialog open={showExtraDialog} onOpenChange={setShowExtraDialog} onSuccess={loadRevenues} />

        {/* Booking Revenue Dialog */}
        <Dialog open={showBookingRevenueDialog} onOpenChange={setShowBookingRevenueDialog}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Nova Receita de Reserva</DialogTitle>
              <DialogDescription>Registar pagamento de uma reserva existente</DialogDescription>
            </DialogHeader>

            <form onSubmit={handleCreateBookingRevenue} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="booking_id_revenue">Reserva *</Label>
                <Select
                  value={bookingRevenueForm.booking_id}
                  onValueChange={(value) => setBookingRevenueForm({ ...bookingRevenueForm, booking_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma reserva" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBookings.map((booking) => (
                      <SelectItem key={booking.id} value={booking.id}>
                        #{booking.booking_number} - {booking.guests?.full_name} - Quarto {booking.rooms?.room_number} - €
                        {booking.total_amount}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount_revenue">Valor (€) *</Label>
                <Input
                  id="amount_revenue"
                  type="number"
                  step="0.01"
                  min="0"
                  value={bookingRevenueForm.amount}
                  onChange={(e) => setBookingRevenueForm({ ...bookingRevenueForm, amount: e.target.value })}
                  placeholder="0.00"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date_revenue">Data do Pagamento *</Label>
                <Input
                  id="date_revenue"
                  type="date"
                  value={bookingRevenueForm.date}
                  onChange={(e) => setBookingRevenueForm({ ...bookingRevenueForm, date: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description_revenue">Descrição (Opcional)</Label>
                <Textarea
                  id="description_revenue"
                  value={bookingRevenueForm.description}
                  onChange={(e) => setBookingRevenueForm({ ...bookingRevenueForm, description: e.target.value })}
                  placeholder="Detalhes adicionais do pagamento..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payment_method_revenue">Método de Pagamento</Label>
                <Select
                  value={bookingRevenueForm.payment_method}
                  onValueChange={(value) => setBookingRevenueForm({ ...bookingRevenueForm, payment_method: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o método" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">💳 Cartão</SelectItem>
                    <SelectItem value="cash">💵 Dinheiro</SelectItem>
                    <SelectItem value="transfer">🏦 Transferência</SelectItem>
                    <SelectItem value="mbway">📱 MB Way</SelectItem>
                    <SelectItem value="multibanco">🎫 Multibanco</SelectItem>
                    <SelectItem value="paypal">💳 PayPal</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowBookingRevenueDialog(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={savingBookingRevenue}>
                  {savingBookingRevenue && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Registar Receita
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}