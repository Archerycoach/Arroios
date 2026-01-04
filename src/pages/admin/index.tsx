import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, DollarSign, Users, BedDouble, TrendingUp } from "lucide-react";
import { bookingService, BookingWithDetails } from "@/services/bookingService";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function AdminDashboard() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      // Load real bookings instead of mocks
      const data = await bookingService.getAll();
      setBookings(data);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Calculate stats
  const activeBookings = bookings.filter(b => b.status === "confirmed" || b.status === "pending").length;
  const todayCheckIns = bookings.filter(b => 
    new Date(b.check_in_date).toDateString() === new Date().toDateString()
  ).length;
  const totalRevenue = bookings
    .filter(b => b.status === "paid" || b.status === "completed")
    .reduce((sum, b) => sum + b.total_amount, 0);

  // Get active/occupied rooms for display
  const occupiedRooms = bookings
    .filter(b => b.status === "confirmed" || b.status === "pending")
    .slice(0, 10); // Show top 10

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
        <h1 className="text-3xl font-bold">Dashboard</h1>
        
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
              <div className="text-2xl font-bold">+12.5%</div>
              <p className="text-xs text-muted-foreground">
                Em relação ao mês anterior
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

          {/* Recent Activity / Quick Actions could go here */}
          <Card className="col-span-3">
             <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid gap-2">
                  <p className="text-sm text-muted-foreground">Atalhos para tarefas comuns</p>
                  {/* Add quick action buttons if needed */}
               </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}