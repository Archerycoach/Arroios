import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { OccupancyCalendar } from "@/components/Admin/OccupancyCalendar";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";
import { bookingService } from "@/services/bookingService";
import { roomService } from "@/services/roomService";
import { Room } from "@/types";
import { useToast } from "@/hooks/use-toast";

// Type for calendar bookings (simplified from full Booking type)
interface BookingForCalendar {
  id: string;
  roomId: string;
  guestId: string;
  checkIn: Date;
  checkOut: Date;
  status: "pending" | "confirmed" | "paid" | "cancelled" | "completed" | "no_show";
  guestName?: string;
}

export default function CalendarPage() {
  const [bookings, setBookings] = useState<BookingForCalendar[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, roomsData] = await Promise.all([
        bookingService.getAll(),
        roomService.getAll()
      ]);

      // Transform BookingWithDetails to simplified calendar format
      const transformedBookings: BookingForCalendar[] = bookingsData.map(booking => ({
        id: booking.id,
        roomId: booking.room_id,
        guestId: booking.guest_id,
        checkIn: new Date(booking.check_in_date),
        checkOut: new Date(booking.check_out_date),
        status: booking.status,
        guestName: booking.guest?.full_name
      }));

      setBookings(transformedBookings);
      setRooms(roomsData);
    } catch (error) {
      console.error("Error loading calendar data:", error);
      toast({
        title: "Erro",
        description: "Não foi possível carregar os dados do calendário.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleBookingClick = (booking: BookingForCalendar) => {
    toast({
      title: "Reserva",
      description: `Hóspede: ${booking.guestName || "N/A"}\nStatus: ${booking.status}`
    });
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p>A carregar calendário...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Calendário de Ocupação</h1>
          <p className="text-gray-600 mt-2">
            Visualize a ocupação dos quartos ao longo do tempo
          </p>
        </div>

        <OccupancyCalendar
          bookings={bookings}
          rooms={rooms}
          onBookingClick={handleBookingClick}
        />
      </div>
    </AdminLayout>
  );
}