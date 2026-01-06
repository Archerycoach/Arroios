import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { CreateGuestDialog } from "@/components/Admin/CreateGuestDialog";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Search, UserPlus, Mail, Phone, Calendar, TrendingUp, Users, Star, DollarSign, Download, Pencil, Trash2 } from "lucide-react";
import { guestService } from "@/services/guestService";
import { bookingService } from "@/services/bookingService";
import { exportToExcel, guestExportColumns } from "@/lib/exportUtils";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

interface EnrichedGuest {
  id: string;
  full_name: string;
  email: string;
  phone?: string;
  address?: string;
  date_of_birth?: string;
  nationality?: string;
  tax_id?: string;
  created_at: string;
  bookingCount: number;
  totalSpent: number;
  lastBooking?: string;
}

export default function ClientesPage() {
  const [guests, setGuests] = useState<EnrichedGuest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingGuest, setEditingGuest] = useState<EnrichedGuest | null>(null);
  const [deletingGuest, setDeletingGuest] = useState<EnrichedGuest | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  useEffect(() => {
    loadGuests();
  }, []);

  const loadGuests = async () => {
    try {
      setLoading(true);
      const guestsData = await guestService.getAll();

      // Enrich with booking count and total spent
      const enrichedGuests = await Promise.all(
        guestsData.map(async (guest) => {
          const bookings = await bookingService.getByGuestId(guest.id);
          const lastBooking = bookings.length > 0
            ? bookings.sort((a, b) => new Date(b.check_in_date).getTime() - new Date(a.check_in_date).getTime())[0]
            : undefined;

          return {
            ...guest,
            bookingCount: bookings.length,
            lastBooking: lastBooking?.check_in_date,
            totalSpent: bookings.reduce((sum, b) => sum + b.total_amount, 0),
          };
        })
      );

      setGuests(enrichedGuests);
    } catch (error) {
      console.error("Error loading guests:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredGuests = guests.filter((guest) => {
    const query = searchQuery.toLowerCase();
    return (
      guest.full_name.toLowerCase().includes(query) ||
      guest.email.toLowerCase().includes(query) ||
      guest.phone?.toLowerCase().includes(query) ||
      guest.tax_id?.toLowerCase().includes(query)
    );
  });

  // Calculate stats
  const totalGuests = guests.length;
  const returningGuests = guests.filter(g => g.bookingCount > 1).length;
  const returningRate = totalGuests > 0 ? (returningGuests / totalGuests * 100).toFixed(1) : "0";
  const avgLTV = totalGuests > 0 ? (guests.reduce((sum, g) => sum + g.totalSpent, 0) / totalGuests).toFixed(2) : "0";
  const avgSatisfaction = "4.7"; // Mock value

  const handleExportToExcel = () => {
    const exportData = filteredGuests.map(guest => ({
      ...guest,
      // Format dates for export
      date_of_birth: guest.date_of_birth || "",
      created_at: guest.created_at || "",
    }));

    exportToExcel(exportData, guestExportColumns, "clientes");
  };

  const handleEdit = (guest: EnrichedGuest) => {
    setEditingGuest(guest);
    setShowCreateDialog(true);
  };

  const handleDeleteClick = (guest: EnrichedGuest) => {
    setDeletingGuest(guest);
  };

  const handleDeleteConfirm = async () => {
    if (!deletingGuest) return;

    setDeleteLoading(true);
    try {
      await guestService.delete(deletingGuest.id);
      await loadGuests();
      setDeletingGuest(null);
    } catch (error) {
      console.error("Error deleting guest:", error);
      alert("Erro ao apagar cliente. Por favor, tente novamente.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDialogClose = () => {
    setShowCreateDialog(false);
    setEditingGuest(null);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar clientes...</p>
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
              <h1 className="text-3xl font-bold">Clientes</h1>
              <p className="text-muted-foreground mt-2">
                Gestão de hóspedes e histórico
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleExportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Exportar Excel
              </Button>
              <Button onClick={() => setShowCreateDialog(true)}>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Cliente
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Clientes</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{totalGuests}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Returning Rate</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{returningRate}%</div>
                <p className="text-xs text-muted-foreground">{returningGuests} clientes</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Satisfação</CardTitle>
                <Star className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgSatisfaction}/5.0</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">LTV Médio</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{avgLTV}</div>
              </CardContent>
            </Card>
          </div>

          {/* Search */}
          <Card>
            <CardHeader>
              <CardTitle>Pesquisar Clientes</CardTitle>
              <CardDescription>Encontre clientes por nome, email, telefone ou NIF</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardContent>
          </Card>

          {/* Guests Table */}
          <Card>
            <CardHeader>
              <CardTitle>Lista de Clientes ({filteredGuests.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Contacto</TableHead>
                    <TableHead>Nacionalidade</TableHead>
                    <TableHead>NIF</TableHead>
                    <TableHead>Reservas</TableHead>
                    <TableHead>Total Gasto</TableHead>
                    <TableHead>Última Estadia</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredGuests.map((guest) => (
                    <TableRow key={guest.id}>
                      <TableCell className="font-medium">
                        <div>
                          <p>{guest.full_name}</p>
                          {guest.bookingCount > 1 && (
                            <Badge variant="secondary" className="text-xs mt-1">
                              Returning
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1 text-sm">
                          <div className="flex items-center gap-2">
                            <Mail className="h-3 w-3 text-muted-foreground" />
                            {guest.email}
                          </div>
                          {guest.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-3 w-3 text-muted-foreground" />
                              {guest.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{guest.nationality || "-"}</TableCell>
                      <TableCell className="font-mono text-xs">{guest.tax_id || "-"}</TableCell>
                      <TableCell>{guest.bookingCount}</TableCell>
                      <TableCell className="font-semibold">€{guest.totalSpent.toFixed(2)}</TableCell>
                      <TableCell>
                        {guest.lastBooking ? (
                          <div className="flex items-center gap-2 text-sm">
                            <Calendar className="h-3 w-3 text-muted-foreground" />
                            {format(new Date(guest.lastBooking), "dd MMM yyyy", { locale: pt })}
                          </div>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEdit(guest)}
                            className="h-8 w-8 p-0"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteClick(guest)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}

                  {filteredGuests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                        Nenhum cliente encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Create Guest Dialog */}
          <CreateGuestDialog
            open={showCreateDialog}
            onOpenChange={handleDialogClose}
            onSuccess={loadGuests}
            editGuest={editingGuest}
          />

          {/* Delete Confirmation Dialog */}
          <AlertDialog open={!!deletingGuest} onOpenChange={() => setDeletingGuest(null)}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Tem a certeza?</AlertDialogTitle>
                <AlertDialogDescription>
                  Esta ação não pode ser desfeita. Isto irá apagar permanentemente o cliente{" "}
                  <span className="font-semibold">{deletingGuest?.full_name}</span>.
                  {deletingGuest && deletingGuest.bookingCount > 0 && (
                    <div className="mt-3 p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                      <p className="text-sm font-medium text-destructive">
                        ⚠️ Atenção: Este cliente tem {deletingGuest.bookingCount} reserva(s) associada(s).
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        As reservas associadas também serão eliminadas.
                      </p>
                    </div>
                  )}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={deleteLoading}>Cancelar</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleDeleteConfirm}
                  disabled={deleteLoading}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                >
                  {deleteLoading ? "A apagar..." : "Apagar Cliente"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </AdminLayout>
    </ProtectedAdminPage>
  );
}