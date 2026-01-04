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
import { Search, UserPlus, Mail, Phone, Calendar, TrendingUp, Users, Star, DollarSign } from "lucide-react";
import { guestService } from "@/services/guestService";
import { bookingService } from "@/services/bookingService";
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
            <Button onClick={() => setShowCreateDialog(true)}>
              <UserPlus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
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
                    </TableRow>
                  ))}

                  {filteredGuests.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
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
            onOpenChange={setShowCreateDialog}
            onSuccess={loadGuests}
          />
        </div>
      </AdminLayout>
    </ProtectedAdminPage>
  );
}