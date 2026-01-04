import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Link from "next/link";
import SEO from "@/components/SEO";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { CheckCircle2, Calendar, MapPin, Download, Home, Printer } from "lucide-react";
import { bookingService, BookingWithDetails } from "@/services/bookingService";
import { format } from "date-fns";
import { pt } from "date-fns/locale";

export default function BookingConfirmationPage() {
  const router = useRouter();
  const { id } = router.query;
  const [booking, setBooking] = useState<BookingWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (id && typeof id === 'string') {
      loadBooking(id);
    }
  }, [id]);

  const loadBooking = async (bookingId: string) => {
    try {
      setIsLoading(true);
      const data = await bookingService.getById(bookingId);
      setBooking(data);
    } catch (error) {
      console.error("Error loading booking:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!booking) {
    return (
      <MainLayout>
        <div className="container mx-auto px-4 py-16 text-center">
          <h1 className="text-2xl font-bold mb-4">Reserva não encontrada</h1>
          <Button onClick={() => router.push("/")}>Voltar à Homepage</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <>
      <SEO title="Reserva Confirmada" />
      <MainLayout>
        <div className="bg-gray-50 dark:bg-gray-900 min-h-screen py-12">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 text-green-600 mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <h1 className="text-3xl font-bold mb-2">Reserva Confirmada!</h1>
              <p className="text-muted-foreground">
                Obrigado pela sua reserva. Enviámos um email de confirmação para {booking.guest?.email}.
              </p>
            </div>

            <Card>
              <CardHeader className="border-b bg-muted/20">
                <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Referência da Reserva</p>
                    <p className="text-2xl font-mono font-bold">{booking.booking_number || booking.id.slice(0, 8).toUpperCase()}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => window.print()}>
                      <Printer className="w-4 h-4 mr-2" />
                      Imprimir
                    </Button>
                    <Button variant="outline" size="sm">
                      <Download className="w-4 h-4 mr-2" />
                      Download PDF
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-8">
                {/* Room Details */}
                <div className="flex flex-col md:flex-row gap-6">
                  {booking.room && (
                    <div className="flex-1 space-y-4">
                      <h3 className="font-semibold text-lg">{booking.room.name}</h3>
                      <div className="space-y-2 text-sm">
                         <div className="flex items-center gap-2 text-muted-foreground">
                           <MapPin className="w-4 h-4" />
                           <span>Alojamento Arroios, Lisboa</span>
                         </div>
                         <div className="flex items-center gap-2 text-muted-foreground">
                           <Calendar className="w-4 h-4" />
                           <span>
                             Check-in: {format(new Date(booking.check_in_date), "d 'de' MMMM, yyyy", { locale: pt })}<br/>
                             Check-out: {format(new Date(booking.check_out_date), "d 'de' MMMM, yyyy", { locale: pt })}
                           </span>
                         </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Payment Details */}
                  <div className="flex-1 bg-muted/30 p-4 rounded-lg">
                    <h4 className="font-medium mb-4">Detalhes do Pagamento</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Total Pago</span>
                        <span className="font-bold">€{booking.total_amount.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Estado</span>
                        <span className="text-green-600 font-medium capitalize">{booking.status}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Método</span>
                        <span>Cartão de Crédito</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guest Details */}
                <div>
                  <h4 className="font-medium mb-2">Dados do Hóspede principal</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground block">Nome</span>
                      <span>{booking.guest?.full_name || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Email</span>
                      <span>{booking.guest?.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Telefone</span>
                      <span>{booking.guest?.phone || "N/A"}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="bg-muted/20 p-6 flex justify-center">
                <Link href="/">
                  <Button variant="default" size="lg">
                    <Home className="w-4 h-4 mr-2" />
                    Voltar ao Início
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          </div>
        </div>
      </MainLayout>
    </>
  );
}