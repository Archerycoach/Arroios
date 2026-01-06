import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, DollarSign, Users, BedDouble, TrendingUp } from "lucide-react";
import { bookingService, BookingWithDetails } from "@/services/bookingService";
import { format, subMonths, isAfter } from "date-fns";
import { pt } from "date-fns/locale";

type PeriodOption = "1" | "3" | "6" | "12";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodOption>("1");

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter bookings by selected period
  const getFilteredBookings = () => {
    const monthsAgo = subMonths(new Date(), parseInt(selectedPeriod));
    return bookings.filter(booking => {
      const bookingDate = new Date(booking.created_at);
      return isAfter(bookingDate, monthsAgo);
    });
  };

  const filteredBookings = getFilteredBookings();

  // Calculate stats based on filtered bookings
  const activeBookings = filteredBookings.filter(
    b => b.status === "confirmed" || b.status === "pending"
  ).length;

  const todayCheckIns = filteredBookings.filter(b => 
    new Date(b.check_in_date).toDateString() === new Date().toDateString()
  ).length;

  const totalRevenue = filteredBookings
    .filter(b => b.status === "paid" || b.status === "completed")
    .reduce((sum, b) => sum + b.total_amount, 0);

  // Calculate previous period for growth comparison
  const getPreviousPeriodGrowth = () => {
    const currentPeriodMonths = parseInt(selectedPeriod);
    const previousPeriodStart = subMonths(new Date(), currentPeriodMonths * 2);
    const previousPeriodEnd = subMonths(new Date(), currentPeriodMonths);

    const previousRevenue = bookings
      .filter(b => {
        const date = new Date(b.created_at);
        return isAfter(date, previousPeriodStart) && !isAfter(date, previousPeriodEnd);
      })
      .filter(b => b.status === "paid" || b.status === "completed")
      .reduce((sum, b) => sum + b.total_amount, 0);

    if (previousRevenue === 0) return 0;
    const growth = ((totalRevenue - previousRevenue) / previousRevenue) * 100;
    return growth;
  };

  const growthPercentage = getPreviousPeriodGrowth();

  // Get active/occupied rooms for display
  const occupiedRooms = filteredBookings
    .filter(b => b.status === "confirmed" || b.status === "pending")
    .slice(0, 10);

  const periodLabels: Record<PeriodOption, string> = {
    "1": "Último mês",
    "3": "Últimos 3 meses",
    "6": "Últimos 6 meses",
    "12": "Último ano"
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar dashboard...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header with Period Selector */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Período:</span>
            <Select value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as PeriodOption)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 mês</SelectItem>
                <SelectItem value="3">3 meses</SelectItem>
                <SelectItem value="6">6 meses</SelectItem>
                <SelectItem value="12">12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Period Info */}
        <div className="text-sm text-muted-foreground">
          Mostrando dados de: <strong>{periodLabels[selectedPeriod]}</strong>
        </div>
        
        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Reservas Ativas</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeBookings}</div>
              <p className="text-xs text-muted-foreground">
                +{todayCheckIns} check-ins hoje
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
              <p className="text-xs text-muted-foreground">
                Reservas pagas e completas
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Ocupação</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{occupiedRooms.length}</div>
              <p className="text-xs text-muted-foreground">
                Quartos ocupados agora
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Crescimento</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {growthPercentage >= 0 ? "+" : ""}{growthPercentage.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">
                vs período anterior
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Room Status List */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="col-span-4">
            <CardHeader>
              <CardTitle>Estado dos Quartos (Ocupação Atual)</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {occupiedRooms.map((booking) => (
                  <div key={booking.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="h-6">
                          Quarto {booking.room?.room_number || "N/A"}
                        </Badge>
                        <span className="font-medium text-lg">
                          {booking.guest?.full_name || "Cliente Desconhecido"}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          In: {format(new Date(booking.check_in_date), "dd/MM/yyyy")}
                        </div>
                        <span>→</span>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Out: {format(new Date(booking.check_out_date), "dd/MM/yyyy")}
                        </div>
                      </div>
                    </div>
                    
                    <Badge className={
                      booking.status === "confirmed" ? "bg-blue-500" : "bg-yellow-500"
                    }>
                      {booking.status === "confirmed" ? "Confirmada" : "Pendente"}
                    </Badge>
                  </div>
                ))}

                {occupiedRooms.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <BedDouble className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>Nenhum quarto ocupado no momento.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Period Summary */}
          <Card className="col-span-3">
            <CardHeader>
              <CardTitle>Resumo do Período</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Total de Reservas</span>
                  <span className="text-lg font-bold">{filteredBookings.length}</span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Reservas Confirmadas</span>
                  <span className="text-lg font-bold text-green-600">
                    {filteredBookings.filter(b => b.status === "confirmed" || b.status === "paid").length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Reservas Canceladas</span>
                  <span className="text-lg font-bold text-red-600">
                    {filteredBookings.filter(b => b.status === "cancelled").length}
                  </span>
                </div>
                
                <div className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                  <span className="text-sm font-medium">Taxa de Cancelamento</span>
                  <span className="text-lg font-bold">
                    {filteredBookings.length > 0 
                      ? ((filteredBookings.filter(b => b.status === "cancelled").length / filteredBookings.length) * 100).toFixed(1)
                      : "0"
                    }%
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}