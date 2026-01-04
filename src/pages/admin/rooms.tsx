import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { roomService, type RoomWithProperty } from "@/services/roomService";
import type { Room } from "@/types";
import {
  Plus,
  Pencil,
  Trash2,
  Eye,
  EyeOff,
  Users,
  Euro,
  Calendar,
  CalendarDays,
  BedDouble,
  Home,
  Building2,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { CreateRoomDialog } from "@/components/Admin/CreateRoomDialog";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingRoom, setEditingRoom] = useState<any>(null);
  const { toast } = useToast();

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAll();
      setRooms(data);
    } catch (error) {
      console.error("Error loading rooms:", error);
      toast({
        title: "Erro ao carregar quartos",
        description: "Não foi possível carregar a lista de quartos.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (room?: Room) => {
    if (room) {
      setEditingRoom(room);
    } else {
      setEditingRoom(null);
    }
    setShowCreateDialog(true);
  };

  const handleEdit = (room: Room) => {
    setEditingRoom(room);
    setShowCreateDialog(true);
  };

  const handleToggleActive = async (roomId: string, currentStatus: boolean) => {
    try {
      await roomService.update(roomId, { is_available: !currentStatus }); // Use is_available instead of is_active
      toast({
        title: currentStatus ? "Quarto indisponível" : "Quarto disponível",
        description: `O quarto está agora ${
          currentStatus ? "indisponível" : "disponível"
        }.`,
      });
      loadRooms();
    } catch (error) {
      console.error("Error toggling room status:", error);
      toast({
        title: "Erro",
        description: "Não foi possível alterar o estado do quarto.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (roomId: string) => {
    if (!confirm("Tem a certeza que deseja eliminar este quarto?")) {
      return;
    }

    try {
      await roomService.delete(roomId);
      toast({
        title: "Quarto eliminado",
        description: "O quarto foi eliminado com sucesso.",
      });
      loadRooms();
    } catch (error) {
      console.error("Error deleting room:", error);
      toast({
        title: "Erro ao eliminar quarto",
        description: "Não foi possível eliminar o quarto.",
        variant: "destructive",
      });
    }
  };

  const calculateBiweeklyPrice = (monthlyPrice: number) => {
    return (monthlyPrice / 2).toFixed(2);
  };

  const avgPrice =
    rooms.length > 0
      ? (
          rooms.reduce((sum, room) => sum + (room.daily_price || room.base_price || 0), 0) / rooms.length
        ).toFixed(2)
      : "0.00";

  const totalCapacity = rooms.reduce((sum, room) => sum + room.max_guests, 0);

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-muted-foreground">A carregar quartos...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Gestão de Quartos</h1>
            <p className="text-muted-foreground">
              Gerir quartos, preços e disponibilidade
            </p>
          </div>
          <Button onClick={() => { setEditingRoom(null); setShowCreateDialog(true); }}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Quarto
          </Button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total de Quartos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{rooms.length}</div>
              <p className="text-xs text-muted-foreground">
                {rooms.filter((r) => r.is_available).length} ativos
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Preço Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">€{avgPrice}</div>
              <p className="text-xs text-muted-foreground">por noite</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Capacidade Total
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCapacity}</div>
              <p className="text-xs text-muted-foreground">hóspedes</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Lista de Quartos</CardTitle>
            <CardDescription>
              Todos os quartos disponíveis no sistema
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Capacidade</TableHead>
                  <TableHead>Tipo Arrendamento</TableHead>
                  <TableHead>Preço</TableHead>
                  <TableHead>Min. Noites</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rooms.map((room) => (
                  <TableRow key={room.id}>
                    <TableCell className="font-medium">{room.name}</TableCell>
                    <TableCell className="capitalize">{room.room_type}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        {room.max_guests}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={room.rental_type === "nightly" ? "default" : "secondary"}>
                        {room.rental_type === "nightly" ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            Por Noite
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <CalendarDays className="h-3 w-3" />
                            Quinzenal
                          </div>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1">
                          <Euro className="h-3 w-3 text-muted-foreground" />
                          <span className="font-medium text-sm">
                            {room.daily_price?.toFixed(2) || room.base_price?.toFixed(2)}
                          </span>
                          <span className="text-xs text-muted-foreground">/dia</span>
                        </div>
                        
                        {room.biweekly_price && room.biweekly_price > 0 && (
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {room.biweekly_price.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">/15d</span>
                          </div>
                        )}
                        
                        {room.monthly_price && room.monthly_price > 0 && (
                          <div className="flex items-center gap-1">
                            <Euro className="h-3 w-3 text-muted-foreground" />
                            <span className="text-sm">
                              {room.monthly_price.toFixed(2)}
                            </span>
                            <span className="text-xs text-muted-foreground">/mês</span>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {room.minimum_nights}{" "}
                        {room.minimum_nights === 1 ? "noite" : "noites"}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant={room.is_available ? "default" : "secondary"}>
                        {room.is_available ? "Disponível" : "Indisponível"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() =>
                            handleToggleActive(room.id, room.is_available)
                          }
                        >
                          {room.is_available ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(room)}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(room.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Room Dialog */}
        <CreateRoomDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
          onSuccess={loadRooms}
          editRoom={editingRoom}
        />
      </div>
    </AdminLayout>
  );
}