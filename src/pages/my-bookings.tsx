import { useState, useEffect } from "react";
import Link from "next/link";
import SEO from "@/components/SEO";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, MapPin, User, MessageSquare, X, CheckCircle, Clock } from "lucide-react";
import { useBooking } from "@/contexts/BookingContext";
import { mockRooms } from "@/lib/mockData";
import { Booking, Room, BookingStatus } from "@/types";

export default function MyBookingsPage() {
  const { bookings } = useBooking();
  const [activeTab, setActiveTab] = useState("all");

  const getRoom = (roomId: string): Room | undefined => {
    return mockRooms.find((r) => r.id === roomId);
  };

  const getStatusBadge = (status: BookingStatus) => {
    const variants: Record<BookingStatus, { label: string; className: string; icon: JSX.Element }> = {
      pending: { label: "Pendente", className: "bg-warning", icon: <Clock className="w-3 h-3" /> },
      confirmed: { label: "Confirmada", className: "bg-primary", icon: <CheckCircle className="w-3 h-3" /> },
      paid: { label: "Paga", className: "bg-success", icon: <CheckCircle className="w-3 h-3" /> },
      cancelled: { label: "Cancelada", className: "bg-destructive", icon: <X className="w-3 h-3" /> },
      "no-show": { label: "Não Compareceu", className: "bg-muted", icon: <X className="w-3 h-3" /> },
      completed: { label: "Concluída", className: "bg-muted", icon: <CheckCircle className="w-3 h-3" /> },
    };

    const variant = variants[status];
    return (
      <Badge className={variant.className}>
        {variant.icon}
        <span className="ml-1">{variant.label}</span>
      </Badge>
    );
  };

  const filterBookings = (status?: string) => {
    if (!status || status === "all") return bookings;
    return bookings.filter((b) => b.status === status);
  };

  const filteredBookings = filterBookings(activeTab);

  return (
    <>
      <SEO 
        title="Minhas Reservas - Alojamento Arroios"
        description="Gerencie suas reservas e veja o histórico."
      />
      
      <MainLayout>
        <div className="bg-background py-12 min-h-screen">
          <div className="container mx-auto px-4">
            <div className="max-w-6xl mx-auto">
              <h1 className="text-3xl font-bold mb-8">Minhas Reservas</h1>

              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="mb-6">
                  <TabsTrigger value="all">Todas</TabsTrigger>
                  <TabsTrigger value="pending">Pendentes</TabsTrigger>
                  <TabsTrigger value="confirmed">Confirmadas</TabsTrigger>
                  <TabsTrigger value="paid">Pagas</TabsTrigger>
                  <TabsTrigger value="completed">Concluídas</TabsTrigger>
                  <TabsTrigger value="cancelled">Canceladas</TabsTrigger>
                </TabsList>

                <TabsContent value={activeTab}>
                  {filteredBookings.length === 0 ? (
                    <Card>
                      <CardContent className="py-12 text-center">
                        <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="font-semibold mb-2">Nenhuma reserva encontrada</h3>
                        <p className="text-sm text-muted-foreground mb-6">
                          Você ainda não tem reservas nesta categoria.
                        </p>
                        <Link href="/rooms">
                          <Button>Explorar Quartos</Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ) : (
                    <div className="space-y-4">
                      {filteredBookings.map((booking) => {
                        const room = getRoom(booking.roomId);
                        if (!room) return null;

                        return (
                          <Card key={booking.id} className="overflow-hidden">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-6">
                              {/* Room Image */}
                              <div className="relative h-48 md:h-auto rounded-lg overflow-hidden">
                                <img
                                  src={room.images[0]}
                                  alt={room.name}
                                  className="w-full h-full object-cover"
                                />
                              </div>

                              {/* Booking Details */}
                              <div className="md:col-span-2 space-y-4">
                                <div>
                                  <div className="flex items-start justify-between mb-2">
                                    <h3 className="font-semibold text-lg">{room.name}</h3>
                                    {getStatusBadge(booking.status)}
                                  </div>
                                  <p className="text-sm text-muted-foreground">
                                    Reserva #{booking.bookingNumber}
                                  </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4 text-sm">
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-muted-foreground">Check-in</p>
                                      <p className="font-medium">{new Date(booking.checkIn).toLocaleDateString('pt-PT')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-muted-foreground">Check-out</p>
                                      <p className="font-medium">{new Date(booking.checkOut).toLocaleDateString('pt-PT')}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-muted-foreground">Hóspedes</p>
                                      <p className="font-medium">{booking.numberOfGuests} pessoa{booking.numberOfGuests > 1 ? "s" : ""}</p>
                                    </div>
                                  </div>
                                  <div className="flex items-start gap-2">
                                    <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                                    <div>
                                      <p className="text-muted-foreground">Noites</p>
                                      <p className="font-medium">{booking.numberOfNights}</p>
                                    </div>
                                  </div>
                                </div>

                                {booking.specialRequests && (
                                  <div className="bg-muted/30 p-3 rounded-lg text-sm">
                                    <p className="text-muted-foreground font-medium mb-1">Pedidos Especiais:</p>
                                    <p>{booking.specialRequests}</p>
                                  </div>
                                )}
                              </div>

                              {/* Actions */}
                              <div className="space-y-3">
                                <div className="bg-muted/30 p-4 rounded-lg text-center">
                                  <p className="text-sm text-muted-foreground mb-1">Total</p>
                                  <p className="text-2xl font-bold">€{booking.totalPrice}</p>
                                </div>

                                <div className="space-y-2">
                                  <Button variant="outline" size="sm" className="w-full">
                                    <MessageSquare className="w-4 h-4 mr-2" />
                                    Mensagens
                                  </Button>
                                  <Link href={`/booking-confirmation?bookingId=${booking.id}`}>
                                    <Button variant="outline" size="sm" className="w-full">
                                      Ver Detalhes
                                    </Button>
                                  </Link>
                                  {(booking.status === "pending" || booking.status === "confirmed") && (
                                    <Button variant="destructive" size="sm" className="w-full">
                                      Cancelar Reserva
                                    </Button>
                                  )}
                                </div>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}