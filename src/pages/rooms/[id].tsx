import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Head from "next/head";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar } from "@/components/ui/calendar";
import { useToast } from "@/hooks/use-toast";
import { roomService, type RoomWithProperty } from "@/services/roomService";
import { bookingService } from "@/services/bookingService";
import { format, addDays } from "date-fns";
import { pt } from "date-fns/locale";
import { Users, Check, Star, MapPin, Calendar as CalendarIcon, Info } from "lucide-react";

export default function RoomDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const { toast } = useToast();
  
  const [room, setRoom] = useState<RoomWithProperty | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({
    from: undefined,
    to: undefined,
  });

  useEffect(() => {
    if (id) {
      loadRoom(id as string);
    }
  }, [id]);

  const loadRoom = async (roomId: string) => {
    try {
      setLoading(true);
      const data = await roomService.getById(roomId);
      setRoom(data);
    } catch (error) {
      console.error("Error loading room:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os detalhes do quarto.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBooking = () => {
    if (!dateRange.from || !dateRange.to) {
      toast({
        title: "Selecione as datas",
        description: "Por favor selecione as datas de check-in e check-out.",
        variant: "destructive",
      });
      return;
    }

    router.push({
      pathname: "/checkout",
      query: {
        roomId: room?.id,
        checkIn: format(dateRange.from, "yyyy-MM-dd"),
        checkOut: format(dateRange.to, "yyyy-MM-dd"),
      },
    });
  };

  if (loading) return <div className="p-8 text-center">A carregar...</div>;
  if (!room) return <div className="p-8 text-center">Quarto não encontrado</div>;

  return (
    <MainLayout>
      <Head>
        <title>{room.name} | Gestão Arroios</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
               <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                <span className="text-5xl font-light text-muted-foreground capitalize">
                  {room.room_type}
                </span>
              </div>
            </div>

            <div>
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-3xl font-bold">{room.name}</h1>
                  <p className="text-lg text-muted-foreground mt-1 capitalize">
                    {room.room_type} • Piso {room.floor}
                  </p>
                </div>
                <div className="flex flex-col items-end">
                   <div className="text-2xl font-bold">€{room.base_price}</div>
                   <div className="text-sm text-muted-foreground">por noite</div>
                </div>
              </div>

              <div className="flex items-center gap-6 mt-6 py-6 border-y">
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-muted-foreground" />
                  <span>Até {room.max_guests} hóspedes</span>
                </div>
                {room.minimum_nights && (
                  <div className="flex items-center gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground" />
                    <span>Mín. {room.minimum_nights} noites</span>
                  </div>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-xl font-semibold mb-4">Sobre este quarto</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {room.description || "Sem descrição disponível."}
                </p>
              </div>

              <div className="mt-8">
                <h3 className="text-xl font-semibold mb-4">Comodidades</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {room.amenities?.map((amenity) => (
                    <div key={amenity} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{amenity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-24">
              <CardContent className="p-6 space-y-6">
                <div className="text-center">
                  <span className="text-3xl font-bold">€{room.base_price}</span>
                  <span className="text-muted-foreground"> / noite</span>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Datas</label>
                  <div className="border rounded-lg p-2 flex justify-center">
                    <Calendar
                      mode="range"
                      selected={dateRange}
                      onSelect={(range: any) => setDateRange(range)}
                      numberOfMonths={1}
                      disabled={(date) => date < new Date()}
                    />
                  </div>
                </div>

                <Button 
                  className="w-full" 
                  size="lg"
                  onClick={handleBooking}
                  disabled={!dateRange.from || !dateRange.to}
                >
                  Reservar Agora
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  Ainda não será cobrado
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}