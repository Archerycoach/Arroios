import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Calendar, Search, Filter, Eye, Edit, Trash2, CheckCircle, X, Grid3x3, List, Download, ArrowUpDown, Users, Home, CalendarDays, Euro, XCircle, Plus } from "lucide-react";
import { bookingService, BookingWithDetails } from "@/services/bookingService";
import { format, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { useToast } from "@/hooks/use-toast";
import { CreateBookingDialog } from "@/components/Admin/CreateBookingDialog";
import * as XLSX from "xlsx";
import Link from "next/link";
import { BookingPaymentsDialog } from "@/components/Admin/BookingPaymentsDialog";

type StatusFilter = "pending" | "confirmed" | "paid" | "completed" | "cancelled" | "no_show";
type ViewMode = "grid" | "list";
type SortField = "check_in_date" | "guest_name" | "total_amount" | "created_at";
type SortOrder = "asc" | "desc";
type PeriodFilter = "all" | "1m" | "3m" | "6m" | "12m" | "custom";

export default function ReservasPage() {
  const [bookings, setBookings] = useState<BookingWithDetails[]>([]);
  const [filteredBookings, setFilteredBookings] = useState<BookingWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([]);
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>("all");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [sortField, setSortField] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [selectedBooking, setSelectedBooking] = useState<BookingWithDetails | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [paymentsDialogOpen, setPaymentsDialogOpen] = useState(false);
  const [paymentsBooking, setPaymentsBooking] = useState<BookingWithDetails | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingBooking, setEditingBooking] = useState<BookingWithDetails | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadBookings();
  }, []);

  useEffect(() => {
    filterAndSortBookings();
  }, [searchTerm, selectedStatuses, periodFilter, startDate, endDate, sortField, sortOrder, bookings]);

  const loadBookings = async () => {
    try {
      setLoading(true);
      const data = await bookingService.getAll();
      setBookings(data);
    } catch (error) {
      console.error("Error loading bookings:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as reservas",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortBookings = () => {
    let filtered = [...bookings];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(booking => {
        const guestName = booking.guest?.full_name?.toLowerCase() || "";
        const guestEmail = booking.guest?.email?.toLowerCase() || "";
        const roomNumber = booking.room?.room_number?.toLowerCase() || "";
        const bookingNumber = booking.booking_number?.toLowerCase() || "";
        const term = searchTerm.toLowerCase();
        
        return guestName.includes(term) || 
               guestEmail.includes(term) ||
               roomNumber.includes(term) || 
               bookingNumber.includes(term);
      });
    }

    // Filter by status
    if (selectedStatuses.length > 0) {
      filtered = filtered.filter(booking => 
        selectedStatuses.includes(booking.status as StatusFilter)
      );
    }

    // Filter by period
    if (periodFilter !== "all") {
      const now = new Date();
      let cutoffDate: Date;

      switch (periodFilter) {
        case "1m":
          cutoffDate = subMonths(now, 1);
          break;
        case "3m":
          cutoffDate = subMonths(now, 3);
          break;
        case "6m":
          cutoffDate = subMonths(now, 6);
          break;
        case "12m":
          cutoffDate = subMonths(now, 12);
          break;
        case "custom":
          if (startDate) {
            filtered = filtered.filter(b => new Date(b.check_in_date) >= new Date(startDate));
          }
          if (endDate) {
            filtered = filtered.filter(b => new Date(b.check_in_date) <= new Date(endDate));
          }
          break;
        default:
          cutoffDate = now;
      }

      if (periodFilter !== "custom") {
        filtered = filtered.filter(b => new Date(b.created_at || b.check_in_date) >= cutoffDate);
      }
    }

    // Sort
    filtered.sort((a, b) => {
      let compareA: any;
      let compareB: any;

      switch (sortField) {
        case "guest_name":
          compareA = a.guest?.full_name || "";
          compareB = b.guest?.full_name || "";
          break;
        case "total_amount":
          compareA = a.total_amount || 0;
          compareB = b.total_amount || 0;
          break;
        case "check_in_date":
          compareA = new Date(a.check_in_date).getTime();
          compareB = new Date(b.check_in_date).getTime();
          break;
        case "created_at":
        default:
          compareA = new Date(a.created_at || a.check_in_date).getTime();
          compareB = new Date(b.created_at || b.check_in_date).getTime();
          break;
      }

      if (compareA < compareB) return sortOrder === "asc" ? -1 : 1;
      if (compareA > compareB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    setFilteredBookings(filtered);
  };

  const toggleStatus = (status: StatusFilter) => {
    setSelectedStatuses(prev =>
      prev.includes(status)
        ? prev.filter(s => s !== status)
        : [...prev, status]
    );
  };

  const clearFilters = () => {
    setSearchTerm("");
    setSelectedStatuses([]);
    setPeriodFilter("all");
    setStartDate("");
    setEndDate("");
    setSortField("created_at");
    setSortOrder("desc");
  };

  const handleViewDetails = (booking: BookingWithDetails) => {
    setSelectedBooking(booking);
    setDetailsOpen(true);
  };

  const handleEditBooking = (booking: BookingWithDetails) => {
    setEditingBooking(booking);
    setCreateDialogOpen(true);
  };

  const handleUpdateStatus = async (bookingId: string, newStatus: StatusFilter) => {
    try {
      await bookingService.updateStatus(bookingId, newStatus);
      toast({
        title: "Sucesso",
        description: "Estado da reserva atualizado",
      });
      loadBookings();
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o estado",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (bookingId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar esta reserva?")) return;

    try {
      await bookingService.delete(bookingId);
      toast({
        title: "Sucesso",
        description: "Reserva eliminada",
      });
      loadBookings();
    } catch (error) {
      console.error("Error deleting booking:", error);
      toast({
        title: "Erro",
        description: "Não foi possível eliminar a reserva",
        variant: "destructive",
      });
    }
  };

  const handleExportToExcel = () => {
    const exportData = filteredBookings.map(booking => ({
      "Nº Reserva": booking.booking_number || "N/A",
      "Cliente": booking.guest?.full_name || "N/A",
      "Email": booking.guest?.email || "N/A",
      "Telefone": booking.guest?.phone || "N/A",
      "Quarto": `${booking.room?.room_number || "N/A"} - ${booking.room?.name || ""}`,
      "Tipo": booking.room?.type || "N/A",
      "Check-in": format(new Date(booking.check_in_date), "dd/MM/yyyy"),
      "Check-out": format(new Date(booking.check_out_date), "dd/MM/yyyy"),
      "Noites": booking.num_nights || 0,
      "Hóspedes": booking.num_guests || 1,
      "Valor Total": `€${booking.total_amount?.toFixed(2) || "0.00"}`,
      "Estado": booking.status,
      "Data Criação": booking.created_at ? format(new Date(booking.created_at), "dd/MM/yyyy HH:mm") : "N/A",
      "Notas": booking.special_notes || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Reservas");
    
    const fileName = `reservas_${format(new Date(), "yyyy-MM-dd_HHmm")}.xlsx`;
    XLSX.writeFile(wb, fileName);

    toast({
      title: "Sucesso",
      description: "Dados exportados para Excel",
    });
  };

  const handleViewPayments = (booking: BookingWithDetails) => {
    setPaymentsBooking(booking);
    setPaymentsDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    const statusConfig = {
      pending: { label: "Pendente", className: "bg-orange-500 hover:bg-orange-600", icon: Calendar },
      confirmed: { label: "Confirmada", className: "bg-green-500 hover:bg-green-600", icon: CheckCircle },
      paid: { label: "Paga", className: "bg-blue-500 hover:bg-blue-600", icon: Euro },
      completed: { label: "Concluída", className: "bg-purple-500 hover:bg-purple-600", icon: CheckCircle },
      cancelled: { label: "Cancelada", className: "bg-red-500 hover:bg-red-600", icon: XCircle },
      no_show: { label: "Não Compareceu", className: "bg-gray-500 hover:bg-gray-600", icon: X },
    };

    const config = statusConfig[status as keyof typeof statusConfig] || { 
      label: status, 
      className: "bg-gray-500 hover:bg-gray-600",
      icon: Calendar
    };

    const Icon = config.icon;

    return (
      <Badge className={config.className}>
        <Icon className="h-3 w-3 mr-1" />
        {config.label}
      </Badge>
    );
  };

  const stats = {
    total: bookings.length,
    pending: bookings.filter(b => b.status === "pending").length,
    confirmed: bookings.filter(b => b.status === "confirmed" || b.status === "paid").length,
    completed: bookings.filter(b => b.status === "completed").length,
    cancelled: bookings.filter(b => b.status === "cancelled").length,
    totalRevenue: bookings
      .filter(b => b.status !== "cancelled")
      .reduce((sum, b) => sum + (b.total_amount || 0), 0),
  };

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
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Reservas</h1>
            <p className="text-muted-foreground mt-1">
              Gerir todas as reservas do sistema
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportToExcel}>
              <Download className="h-4 w-4 mr-2" />
              Exportar Excel
            </Button>
            <Button onClick={() => {
              setEditingBooking(null);
              setCreateDialogOpen(true);
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nova Reserva
            </Button>
          </div>
        </div>

        {/* Quick Links */}
        <div className="flex gap-2 flex-wrap">
          <Link href="/admin/clientes">
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4 mr-2" />
              Ver Clientes
            </Button>
          </Link>
          <Link href="/admin/rooms">
            <Button variant="outline" size="sm">
              <Home className="h-4 w-4 mr-2" />
              Ver Quartos
            </Button>
          </Link>
          <Link href="/admin/calendar">
            <Button variant="outline" size="sm">
              <CalendarDays className="h-4 w-4 mr-2" />
              Calendário Ocupação
            </Button>
          </Link>
          <Link href="/admin/financeiro">
            <Button variant="outline" size="sm">
              <Euro className="h-4 w-4 mr-2" />
              Ver Financeiro
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Pendentes
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {stats.pending}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Confirmadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {stats.confirmed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Concluídas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.completed}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Canceladas
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {stats.cancelled}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Receita Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                €{stats.totalRevenue.toFixed(2)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Filter className="h-5 w-5" />
                Filtros e Pesquisa
              </CardTitle>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                >
                  Limpar Filtros
                </Button>
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    variant={viewMode === "list" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("list")}
                  >
                    <List className="h-4 w-4" />
                  </Button>
                  <Button
                    variant={viewMode === "grid" ? "secondary" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode("grid")}
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar por nome, email, quarto ou número da reserva..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>

              {/* Filters Row */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Period Filter */}
                <Select value={periodFilter} onValueChange={(value) => setPeriodFilter(value as PeriodFilter)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="1m">Último Mês</SelectItem>
                    <SelectItem value="3m">Últimos 3 Meses</SelectItem>
                    <SelectItem value="6m">Últimos 6 Meses</SelectItem>
                    <SelectItem value="12m">Último Ano</SelectItem>
                    <SelectItem value="custom">Personalizado</SelectItem>
                  </SelectContent>
                </Select>

                {/* Status Filter */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="justify-between">
                      Estados {selectedStatuses.length > 0 && `(${selectedStatuses.length})`}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-56">
                    <DropdownMenuLabel>Filtrar por Estado</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes("pending")}
                      onCheckedChange={() => toggleStatus("pending")}
                    >
                      Pendente
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes("confirmed")}
                      onCheckedChange={() => toggleStatus("confirmed")}
                    >
                      Confirmada
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes("paid")}
                      onCheckedChange={() => toggleStatus("paid")}
                    >
                      Paga
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes("completed")}
                      onCheckedChange={() => toggleStatus("completed")}
                    >
                      Concluída
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes("cancelled")}
                      onCheckedChange={() => toggleStatus("cancelled")}
                    >
                      Cancelada
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={selectedStatuses.includes("no_show")}
                      onCheckedChange={() => toggleStatus("no_show")}
                    >
                      Não Compareceu
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Sort */}
                <Select value={sortField} onValueChange={(value) => setSortField(value as SortField)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Ordenar por" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="created_at">Data de Criação</SelectItem>
                    <SelectItem value="check_in_date">Data Check-in</SelectItem>
                    <SelectItem value="guest_name">Nome do Cliente</SelectItem>
                    <SelectItem value="total_amount">Valor Total</SelectItem>
                  </SelectContent>
                </Select>

                {/* Sort Order */}
                <Button
                  variant="outline"
                  onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
                >
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  {sortOrder === "asc" ? "Ascendente" : "Descendente"}
                </Button>
              </div>

              {/* Custom Date Range */}
              {periodFilter === "custom" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Início</label>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Data Fim</label>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </div>
                </div>
              )}

              {/* Active Filters */}
              {(searchTerm || selectedStatuses.length > 0 || periodFilter !== "all") && (
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm text-muted-foreground">Filtros ativos:</span>
                  {searchTerm && (
                    <Badge variant="secondary">
                      Pesquisa: {searchTerm}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setSearchTerm("")} />
                    </Badge>
                  )}
                  {selectedStatuses.map(status => (
                    <Badge key={status} variant="secondary">
                      {status}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => toggleStatus(status)} />
                    </Badge>
                  ))}
                  {periodFilter !== "all" && (
                    <Badge variant="secondary">
                      Período: {periodFilter}
                      <X className="h-3 w-3 ml-1 cursor-pointer" onClick={() => setPeriodFilter("all")} />
                    </Badge>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Results Count */}
        <div className="text-sm text-muted-foreground">
          A mostrar {filteredBookings.length} de {bookings.length} reservas
        </div>

        {/* Bookings Display */}
        {viewMode === "list" ? (
          <Card>
            <CardContent className="p-0">
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nº Reserva</TableHead>
                      <TableHead>Cliente</TableHead>
                      <TableHead>Quarto</TableHead>
                      <TableHead>Check-in</TableHead>
                      <TableHead>Check-out</TableHead>
                      <TableHead>Noites</TableHead>
                      <TableHead>Valor</TableHead>
                      <TableHead>Estado</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredBookings.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                          Nenhuma reserva encontrada
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredBookings.map((booking) => (
                        <TableRow key={booking.id}>
                          <TableCell className="font-medium">
                            {booking.booking_number || "N/A"}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">{booking.guest?.full_name || "N/A"}</span>
                              <span className="text-sm text-muted-foreground">
                                {booking.guest?.email || ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-col">
                              <span className="font-medium">Quarto {booking.room?.room_number || "N/A"}</span>
                              <span className="text-sm text-muted-foreground">
                                {booking.room?.name || ""}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.check_in_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {format(new Date(booking.check_out_date), "dd/MM/yyyy")}
                          </TableCell>
                          <TableCell>
                            {booking.num_nights || 0}
                          </TableCell>
                          <TableCell>
                            €{booking.total_amount?.toFixed(2) || "0.00"}
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(booking.status)}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(booking)}
                                title="Ver Detalhes"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewPayments(booking)}
                                title="Ver Pagamentos"
                              >
                                <Euro className="h-4 w-4 text-blue-600" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditBooking(booking)}
                                title="Editar"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              {booking.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                                  title="Confirmar"
                                >
                                  <CheckCircle className="h-4 w-4 text-green-600" />
                                </Button>
                              )}
                              {booking.status !== "cancelled" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleUpdateStatus(booking.id, "cancelled")}
                                  title="Cancelar"
                                >
                                  <XCircle className="h-4 w-4 text-orange-600" />
                                </Button>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(booking.id)}
                                title="Eliminar"
                              >
                                <Trash2 className="h-4 w-4 text-red-600" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredBookings.length === 0 ? (
              <Card className="col-span-full">
                <CardContent className="py-8">
                  <p className="text-center text-muted-foreground">
                    Nenhuma reserva encontrada
                  </p>
                </CardContent>
              </Card>
            ) : (
              filteredBookings.map((booking) => (
                <Card key={booking.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">
                          {booking.guest?.full_name || "N/A"}
                        </CardTitle>
                        <p className="text-sm text-muted-foreground mt-1">
                          {booking.booking_number || "N/A"}
                        </p>
                      </div>
                      {getStatusBadge(booking.status)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <Home className="h-4 w-4 text-muted-foreground" />
                      <span>Quarto {booking.room?.room_number || "N/A"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <CalendarDays className="h-4 w-4 text-muted-foreground" />
                      <span>
                        {format(new Date(booking.check_in_date), "dd/MM/yyyy")} - {format(new Date(booking.check_out_date), "dd/MM/yyyy")}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Users className="h-4 w-4 text-muted-foreground" />
                      <span>{booking.num_nights || 0} noites • {booking.num_guests || 1} hóspede(s)</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm font-semibold">
                      <Euro className="h-4 w-4 text-muted-foreground" />
                      <span>€{booking.total_amount?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div className="flex gap-1 pt-2 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewDetails(booking)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        Ver
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewPayments(booking)}
                      >
                        <Euro className="h-4 w-4 mr-1" />
                        Pagamentos
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleEditBooking(booking)}
                      >
                        <Edit className="h-4 w-4 mr-1" />
                        Editar
                      </Button>
                      {booking.status === "pending" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStatus(booking.id, "confirmed")}
                        >
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Details Dialog */}
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Detalhes da Reserva</DialogTitle>
              <DialogDescription>
                Informação completa da reserva #{selectedBooking?.booking_number}
              </DialogDescription>
            </DialogHeader>
            
            {selectedBooking && (
              <div className="space-y-6">
                {/* Status */}
                <div className="flex items-center justify-between p-4 bg-muted rounded-lg">
                  <span className="font-semibold">Estado Atual:</span>
                  {getStatusBadge(selectedBooking.status)}
                </div>

                {/* Guest Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Informação do Cliente
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{selectedBooking.guest?.full_name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Email:</span>
                      <p className="font-medium">{selectedBooking.guest?.email}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Telefone:</span>
                      <p className="font-medium">{selectedBooking.guest?.phone || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">ID do Cliente:</span>
                      <p className="font-medium text-xs">{selectedBooking.guest_id}</p>
                    </div>
                  </div>
                </div>

                {/* Room Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Informação do Quarto
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div>
                      <span className="text-muted-foreground">Número:</span>
                      <p className="font-medium">Quarto {selectedBooking.room?.room_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Nome:</span>
                      <p className="font-medium">{selectedBooking.room?.name}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Tipo:</span>
                      <p className="font-medium">{selectedBooking.room?.type}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Preço Base:</span>
                      <p className="font-medium">€{selectedBooking.room?.base_price?.toFixed(2)}</p>
                    </div>
                  </div>
                </div>

                {/* Booking Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Informação da Reserva
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm bg-muted/50 p-4 rounded-lg">
                    <div>
                      <span className="text-muted-foreground">Nº Reserva:</span>
                      <p className="font-medium">{selectedBooking.booking_number}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Data Criação:</span>
                      <p className="font-medium">
                        {selectedBooking.created_at 
                          ? format(new Date(selectedBooking.created_at), "dd/MM/yyyy HH:mm")
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-in:</span>
                      <p className="font-medium">{format(new Date(selectedBooking.check_in_date), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Check-out:</span>
                      <p className="font-medium">{format(new Date(selectedBooking.check_out_date), "dd/MM/yyyy")}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número de Noites:</span>
                      <p className="font-medium">{selectedBooking.num_nights || "N/A"}</p>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Número de Hóspedes:</span>
                      <p className="font-medium">{selectedBooking.num_guests || 1}</p>
                    </div>
                  </div>
                </div>

                {/* Financial Info */}
                <div>
                  <h3 className="font-semibold mb-3 flex items-center gap-2">
                    <Euro className="h-5 w-5" />
                    Informação Financeira
                  </h3>
                  <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Valor Total:</span>
                      <span className="font-bold text-lg">€{selectedBooking.total_amount?.toFixed(2) || "0.00"}</span>
                    </div>
                  </div>
                </div>

                {/* Notes */}
                {selectedBooking.special_notes && (
                  <div>
                    <h3 className="font-semibold mb-3">Notas/Observações</h3>
                    <div className="bg-muted/50 p-4 rounded-lg">
                      <p className="text-sm">{selectedBooking.special_notes}</p>
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      handleViewPayments(selectedBooking);
                      setDetailsOpen(false);
                    }}
                    className="flex-1"
                  >
                    <Euro className="h-4 w-4 mr-2" />
                    Ver Pagamentos
                  </Button>
                  <Button variant="outline" onClick={() => setDetailsOpen(false)} className="flex-1">
                    Fechar
                  </Button>
                  {selectedBooking.status === "pending" && (
                    <Button onClick={() => {
                      handleUpdateStatus(selectedBooking.id, "confirmed");
                      setDetailsOpen(false);
                    }} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Confirmar Reserva
                    </Button>
                  )}
                  {selectedBooking.status === "confirmed" && (
                    <Button onClick={() => {
                      handleUpdateStatus(selectedBooking.id, "paid");
                      setDetailsOpen(false);
                    }} className="flex-1">
                      <Euro className="h-4 w-4 mr-2" />
                      Marcar como Paga
                    </Button>
                  )}
                  {selectedBooking.status === "paid" && (
                    <Button onClick={() => {
                      handleUpdateStatus(selectedBooking.id, "completed");
                      setDetailsOpen(false);
                    }} className="flex-1">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Marcar como Concluída
                    </Button>
                  )}
                  {selectedBooking.status !== "cancelled" && (
                    <Button 
                      variant="destructive" 
                      onClick={() => {
                        handleUpdateStatus(selectedBooking.id, "cancelled");
                        setDetailsOpen(false);
                      }}
                      className="flex-1"
                    >
                      <XCircle className="h-4 w-4 mr-2" />
                      Cancelar Reserva
                    </Button>
                  )}
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Payments Dialog */}
        <BookingPaymentsDialog
          open={paymentsDialogOpen}
          onOpenChange={setPaymentsDialogOpen}
          booking={paymentsBooking}
          onSuccess={loadBookings}
        />

        {/* Create/Edit Booking Dialog */}
        <CreateBookingDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          onSuccess={() => {
            loadBookings();
            setEditingBooking(null);
          }}
          editBooking={editingBooking}
        />
      </div>
    </AdminLayout>
  );
}