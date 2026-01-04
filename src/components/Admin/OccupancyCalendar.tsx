import { useState, useMemo } from "react";
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay,
  addMonths,
  isWithinInterval,
  startOfDay
} from "date-fns";
import { pt } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Room } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Extended Booking type with guest info for calendar display
interface BookingForCalendar {
  id: string;
  roomId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  status: "pending" | "confirmed" | "paid" | "cancelled" | "completed" | "no_show";
  guestName?: string;
}

interface OccupancyCalendarProps {
  bookings: BookingForCalendar[];
  rooms: Room[];
  onBookingClick?: (booking: BookingForCalendar) => void;
}

type RoomState = "reserved" | "occupied" | "vacant";

export function OccupancyCalendar({ bookings, rooms, onBookingClick }: OccupancyCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthsToShow, setMonthsToShow] = useState<1 | 3 | 6 | 12>(1);

  // Calcula o intervalo de datas a mostrar
  const dateRange = useMemo(() => {
    const start = startOfMonth(currentDate);
    const end = endOfMonth(addMonths(currentDate, monthsToShow - 1));
    return { start, end };
  }, [currentDate, monthsToShow]);

  // Gera todos os dias do intervalo
  const allDays = useMemo(() => {
    return eachDayOfInterval(dateRange);
  }, [dateRange]);

  // Função para obter o estado de um quarto numa data específica
  const getRoomStateForDate = (roomId: string, date: Date): { state: RoomState; booking?: BookingForCalendar } => {
    const dateStart = startOfDay(date);
    
    const activeBookings = bookings.filter(booking => {
      if (booking.roomId !== roomId || booking.status === "cancelled") {
        return false;
      }

      const checkIn = startOfDay(new Date(booking.checkIn));
      const checkOut = startOfDay(new Date(booking.checkOut));

      return isWithinInterval(dateStart, { start: checkIn, end: checkOut }) ||
             isSameDay(dateStart, checkIn);
    });

    if (activeBookings.length === 0) {
      return { state: "vacant" };
    }

    const booking = activeBookings[0];
    
    // Reservado (amarelo) = não confirmada
    if (booking.status === "pending") {
      return { state: "reserved", booking };
    }

    // Ocupado (azul) = confirmada
    return { state: "occupied", booking };
  };

  const handlePreviousPeriod = () => {
    setCurrentDate(prev => addMonths(prev, -monthsToShow));
  };

  const handleNextPeriod = () => {
    setCurrentDate(prev => addMonths(prev, monthsToShow));
  };

  const getStateColor = (state: RoomState) => {
    switch (state) {
      case "reserved":
        return "bg-yellow-400"; // Amarelo - Não confirmada
      case "occupied":
        return "bg-blue-500"; // Azul - Confirmada
      default:
        return "bg-gray-100"; // Vazio - Sem reserva
    }
  };

  const getStateBorder = (state: RoomState) => {
    return state === "vacant" ? "border border-gray-200" : "";
  };

  return (
    <div className="space-y-4">
      {/* Controles de Navegação e Período */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPeriod}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <CardTitle>
                {format(dateRange.start, "MMMM yyyy", { locale: pt })}
                {monthsToShow > 1 && ` - ${format(dateRange.end, "MMMM yyyy", { locale: pt })}`}
              </CardTitle>

              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPeriod}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Select
                value={monthsToShow.toString()}
                onValueChange={(value) => setMonthsToShow(parseInt(value) as 1 | 3 | 6 | 12)}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 mês</SelectItem>
                  <SelectItem value="3">3 meses</SelectItem>
                  <SelectItem value="6">6 meses</SelectItem>
                  <SelectItem value="12">12 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Legenda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-400 rounded" />
              <span className="text-sm">Reservado (Não confirmada)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded" />
              <span className="text-sm">Ocupado (Confirmada)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded" />
              <span className="text-sm">Vago</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calendário de Ocupação */}
      <Card>
        <CardContent className="p-6">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              {/* Cabeçalho com dias */}
              <div className="flex border-b">
                <div className="w-32 flex-shrink-0 p-2 font-semibold bg-gray-50 sticky left-0 z-10 border-r">
                  Quarto
                </div>
                {allDays.map((day, index) => {
                  const isFirstDayOfMonth = day.getDate() === 1;
                  return (
                    <div
                      key={index}
                      className={`w-8 flex-shrink-0 p-1 text-center text-xs ${
                        isFirstDayOfMonth ? "border-l-2 border-gray-400" : ""
                      }`}
                    >
                      <div className="font-semibold">{format(day, "d", { locale: pt })}</div>
                      <div className="text-gray-500">{format(day, "EEE", { locale: pt }).substring(0, 1)}</div>
                      {isFirstDayOfMonth && (
                        <div className="text-gray-700 font-medium mt-1">
                          {format(day, "MMM", { locale: pt })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Linhas de quartos */}
              {rooms.map((room) => (
                <div key={room.id} className="flex border-b hover:bg-gray-50">
                  <div className="w-32 flex-shrink-0 p-2 font-medium bg-white sticky left-0 z-10 border-r">
                    <div className="text-sm">{room.room_number || room.name}</div>
                    <div className="text-xs text-gray-500">{room.room_type}</div>
                  </div>
                  {allDays.map((day, index) => {
                    const { state, booking } = getRoomStateForDate(room.id, day);
                    const isFirstDayOfMonth = day.getDate() === 1;
                    const isCheckInDay = booking && isSameDay(new Date(booking.checkIn), day);

                    return (
                      <div
                        key={index}
                        className={`w-8 flex-shrink-0 p-0 relative ${
                          isFirstDayOfMonth ? "border-l-2 border-gray-400" : ""
                        }`}
                      >
                        <div
                          className={`h-full min-h-[60px] ${getStateColor(state)} ${getStateBorder(state)} cursor-pointer hover:opacity-80 transition-opacity`}
                          onClick={() => booking && onBookingClick?.(booking)}
                          title={booking ? `${booking.guestName || "Hóspede"} - ${booking.status}` : "Vago"}
                        >
                          {isCheckInDay && booking && (
                            <div className="absolute top-1 left-1 right-1 text-[8px] font-semibold text-white bg-black bg-opacity-50 px-1 rounded truncate">
                              {booking.guestName?.split(" ")[0] || "Hóspede"}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}