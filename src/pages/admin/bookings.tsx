import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { CreateBookingDialog } from "@/components/Admin/CreateBookingDialog";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar, MoreVertical, Search, Filter, Plus, Eye, CheckCircle, XCircle, Trash2, Download } from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { guestService } from "@/services/guestService";
import { notificationService } from "@/services/notificationService";
import { exportToExcel, bookingExportColumns } from "@/lib/exportUtils";
import { format, subMonths } from "date-fns";
import { pt } from "date-fns/locale";

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [period, setPeriod] = useState<1 | 3 | 6 | 12>(1);

  useEffect(() => {
    loadBookings();
  }, [period]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAll();
      const cutoffDate = subMonths(new Date(), period);
      const filteredData = data.filter((b: any) => new Date(b.created_at) >= cutoffDate);
      setBookings(filteredData);
    } catch (error) {
      console.error("Error loading bookings:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (id: string, newStatus: string) => {
    try {
      await bookingService.update(id, { status: newStatus as any });
      
      // Send notification if booking is confirmed
      if (newStatus === "confirmed" || newStatus === "paid") {
        const booking = await bookingService.getById(id);
        const guest = await guestService.getById(booking.guest_id);
        
        await notificationService.sendBookingConfirmation(booking, guest);
      }
      
      // Send cancellation notification
      if (newStatus === "cancelled") {
        const booking = await bookingService.getById(id);
        const guest = await guestService.getById(booking.guest_id);
        
        await notificationService.sendCancellationNotification(booking, guest);
      }
      
      await loadBookings();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Erro ao atualizar estado da reserva");
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja eliminar esta reserva?")) return;

    try {
      await bookingService.delete(id);
      await loadBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      alert("Erro ao eliminar reserva");
    }
  };

  const handleExportToExcel = () => {
    const exportData = filteredBookings.map(booking => ({
      id: booking.id,
      room_name: booking.rooms?.name || booking.rooms?.room_number || "N/A",
      guest_name: booking.guests?.full_name || "N/A",
      guest_email: booking.guests?.email || "",
      guest_phone: booking.guests?.phone || "",
      check_in: booking.check_in_date,
      check_out: booking.check_out_date,
      num_guests: booking.num_guests || 1,
      total_price: booking.total_amount,
      status: booking.status,
      payment_method: booking.payment_method || "",
      notes: booking.special_requests || "",
      created_at: booking.created_at,
    }));

    exportToExcel(exportData, bookingExportColumns, "reservas");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { variant: any; label: string }> = {
      pending: { variant: "secondary", label: "Pendente" },
      confirmed: { variant: "default", label: "Confirmada" },
      paid: { variant: "default", label: "Paga" },
      completed: { variant: "outline", label: "Completa" },
      cancelled: { variant: "destructive", label: "Cancelada" },
    };

    const config = variants[status] || variants.pending;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredBookings = bookings.filter((booking) => {
    const query = searchQuery.toLowerCase();
    return (
      booking.id.toLowerCase().includes(query) ||
      booking.rooms?.name?.toLowerCase().includes(query) ||
      booking.guests?.full_name?.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar reservas...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <ProtectedAdminPage>
      <AdminLayout>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Reservas</h1>
              <p className="text-muted-foreground mt-2">
                Gestão de todas as reservas
              </p>
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
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nova Reserva
              </Button>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle>Pesquisar Reservas</CardTitle>
              <CardDescription>Encontre reservas por ID, quarto ou hóspede</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Pesquisar..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Bookings Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Reservas ({filteredBookings.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Quarto</TableHead>
                    <TableHead>Hóspede</TableHead>
                    <TableHead>Check-in</TableHead>
                    <TableHead>Check-out</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell className="font-mono text-xs">
                        {booking.id.slice(0, 8)}
                      </TableCell>
                      <TableCell>
                        {booking.rooms?.room_number || booking.rooms?.name || "N/A"}
                      </TableCell>
                      <TableCell>{booking.guests?.full_name || "N/A"}</TableCell>
                      <TableCell>
                        {format(new Date(booking.check_in_date), "dd MMM yyyy", { locale: pt })}
                      </TableCell>
                      <TableCell>
                        {format(new Date(booking.check_out_date), "dd MMM yyyy", { locale: pt })}
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell className="font-semibold">
                        €{booking.total_amount.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Ações</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                              <Eye className="h-4 w-4 mr-2" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            {booking.status === "pending" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(booking.id, "confirmed")}>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Confirmar
                              </DropdownMenuItem>
                            )}
                            {booking.status !== "cancelled" && (
                              <DropdownMenuItem onClick={() => handleStatusChange(booking.id, "cancelled")}>
                                <XCircle className="h-4 w-4 mr-2" />
                                Cancelar
                              </DropdownMenuItem>
                            )}
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleDelete(booking.id)}
                              className="text-destructive"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Eliminar
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredBookings.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhuma reserva encontrada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Create Booking Dialog */}
          <CreateBookingDialog
            open={showCreateDialog}
            onOpenChange={setShowCreateDialog}
            onSuccess={loadBookings}
          />
        </div>
      </AdminLayout>
    </ProtectedAdminPage>
  );
}