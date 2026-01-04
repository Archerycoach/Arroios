import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import SEO from "@/components/SEO";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";
import { format, differenceInDays } from "date-fns";
import { pt } from "date-fns/locale";
import { CreditCard, Calendar, Users, ShieldCheck, Loader2 } from "lucide-react";
import { guestService } from "@/services/guestService";
import { bookingService } from "@/services/bookingService";
import { roomService } from "@/services/roomService";
import { Room } from "@/types";
import { useToast } from "@/hooks/use-toast";

export default function CheckoutPage() {
  const router = useRouter();
  const { roomId: queryRoomId, checkIn: queryCheckIn, checkOut: queryCheckOut } = router.query;
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isProcessing, setIsProcessing] = useState(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    taxId: "",
    address: "",
    city: "",
    postalCode: "",
    country: "Portugal",
    notes: "",
    acceptTerms: false,
  });

  useEffect(() => {
    if (queryRoomId && queryCheckIn && queryCheckOut) {
      loadRoom(queryRoomId as string);
    } else {
      router.push("/rooms");
    }
  }, [queryRoomId, queryCheckIn, queryCheckOut, router]);

  const loadRoom = async (id: string) => {
    try {
      setLoading(true);
      const roomData = await roomService.getById(id);
      setRoom(roomData);
    } catch (error) {
      console.error("Error loading room:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar as informações do quarto.",
        variant: "destructive"
      });
      router.push("/rooms");
    } finally {
      setLoading(false);
    }
  };

  if (loading || !room || !queryCheckIn || !queryCheckOut) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </MainLayout>
    );
  }

  const checkInDate = new Date(queryCheckIn as string);
  const checkOutDate = new Date(queryCheckOut as string);
  const nights = differenceInDays(checkOutDate, checkInDate);
  const subtotal = room.base_price * nights;
  const taxes = subtotal * 0.06;
  const cleaningFee = 25;
  const total = subtotal + taxes + cleaningFee;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.acceptTerms) {
      toast({
        title: "Termos e Condições",
        description: "Por favor aceite os termos e condições para continuar.",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);

    try {
      const guestData = {
        full_name: `${formData.firstName} ${formData.lastName}`,
        email: formData.email,
        phone: formData.phone,
      };

      const guest = await guestService.create(guestData);

      const bookingData = {
        room_id: queryRoomId as string,
        guest_id: guest.id,
        check_in_date: queryCheckIn as string,
        check_out_date: queryCheckOut as string,
        booking_number: `BK-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
        status: "confirmed" as const,
        room_price: room.base_price, // Fix: Add required room_price
        total_amount: total,
        num_nights: nights,
        special_requests: formData.notes,
        user_id: user?.id,
      };

      // Create booking
      const newBooking = await bookingService.create(bookingData);
      router.push(`/booking-confirmation?id=${newBooking.id}`);
      
    } catch (error) {
      console.error("Booking error:", error);
      toast({
        title: "Erro na Reserva",
        description: "Ocorreu um erro ao processar a sua reserva. Por favor tente novamente.",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <SEO title="Finalizar Reserva" />
      <MainLayout>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-3xl font-bold mb-8">Finalizar Reserva</h1>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Dados do Hóspede</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <form id="checkout-form" onSubmit={handleSubmit} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="firstName">Nome Próprio *</Label>
                          <Input 
                            id="firstName" 
                            required 
                            value={formData.firstName}
                            onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="lastName">Apelido *</Label>
                          <Input 
                            id="lastName" 
                            required 
                            value={formData.lastName}
                            onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input 
                            id="email" 
                            type="email" 
                            required 
                            value={formData.email}
                            onChange={(e) => setFormData({...formData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone *</Label>
                          <Input 
                            id="phone" 
                            type="tel" 
                            required 
                            value={formData.phone}
                            onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="notes">Pedidos Especiais</Label>
                        <Textarea 
                          id="notes" 
                          placeholder="Ex: Hora de chegada prevista, alergias, etc."
                          value={formData.notes}
                          onChange={(e) => setFormData({...formData, notes: e.target.value})}
                        />
                      </div>
                    </form>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Pagamento</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 flex items-center gap-4">
                      <CreditCard className="w-6 h-6 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium">Cartão de Crédito (Simulado)</p>
                        <p className="text-sm text-muted-foreground">Pagamento seguro via Stripe</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="flex flex-col items-start gap-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="terms" 
                        checked={formData.acceptTerms}
                        onCheckedChange={(checked) => setFormData({...formData, acceptTerms: checked as boolean})}
                      />
                      <label htmlFor="terms" className="text-sm font-medium leading-none">
                        Li e aceito os termos e condições
                      </label>
                    </div>
                  </CardFooter>
                </Card>
              </div>

              <div className="lg:col-span-1">
                <Card className="sticky top-24">
                  <CardHeader>
                    <CardTitle>Resumo da Reserva</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h3 className="font-semibold">{room.name}</h3>
                      <p className="text-sm text-muted-foreground capitalize">{room.room_type}</p>
                    </div>

                    <Separator />

                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-muted-foreground" />
                          <span>Datas</span>
                        </div>
                        <span className="font-medium">
                          {format(checkInDate, "d MMM")} - {format(checkOutDate, "d MMM", { locale: pt })}
                        </span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Duração</span>
                        <span>{nights} noites</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>{nights} noites x €{room.base_price}</span>
                        <span>€{subtotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Taxa de Limpeza</span>
                        <span>€{cleaningFee.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Impostos (6%)</span>
                        <span>€{taxes.toFixed(2)}</span>
                      </div>
                    </div>

                    <Separator />

                    <div className="flex justify-between items-end">
                      <span className="font-bold text-lg">Total</span>
                      <span className="font-bold text-2xl text-primary">€{total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full h-12 text-lg" 
                      form="checkout-form"
                      disabled={isProcessing}
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Processando...
                        </>
                      ) : (
                        "Confirmar e Pagar"
                      )}
                    </Button>
                  </CardFooter>
                </Card>
                
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Pagamento 100% Seguro</span>
                </div>
              </div>

              {/* Special Requests */}
              <div>
              </div>
            </div>
          </div>
        </div>
      </MainLayout>
    </>
  );
}