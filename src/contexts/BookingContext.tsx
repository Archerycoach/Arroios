import { createContext, useContext, useState, ReactNode } from "react";
import { Booking, SearchParams } from "@/types";

interface BookingContextType {
  searchParams: SearchParams | null;
  setSearchParams: (params: SearchParams) => void;
  bookingData: any;
  setBookingData: (data: any) => void;
  bookings: Booking[];
  addBooking: (booking: Booking) => void;
  getBookingById: (id: string) => Booking | undefined;
  updateBookingStatus: (id: string, status: Booking["status"]) => void;
}

const BookingContext = createContext<BookingContextType | undefined>(undefined);

export function BookingProvider({ children }: { children: ReactNode }) {
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [bookingData, setBookingData] = useState<any>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const addBooking = (booking: Booking) => {
    setBookings((prev) => [...prev, booking]);
    localStorage.setItem("bookings", JSON.stringify([...bookings, booking]));
  };

  const getBookingById = (id: string) => {
    return bookings.find((b) => b.id === id);
  };

  const updateBookingStatus = (id: string, status: Booking["status"]) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === id ? { ...b, status } : b))
    );
  };

  return (
    <BookingContext.Provider
      value={{
        searchParams,
        setSearchParams,
        bookingData,
        setBookingData,
        bookings,
        addBooking,
        getBookingById,
        updateBookingStatus,
      }}
    >
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (context === undefined) {
    throw new Error("useBooking must be used within a BookingProvider");
  }
  return context;
}