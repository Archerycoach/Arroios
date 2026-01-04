import { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { MainLayout } from "@/components/Layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { roomService, type RoomWithProperty } from "@/services/roomService";
import { Users, Filter, ArrowRight, Euro } from "lucide-react";

export default function RoomsPage() {
  const [rooms, setRooms] = useState<RoomWithProperty[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    type: "all",
  });

  useEffect(() => {
    loadRooms();
  }, []);

  const loadRooms = async () => {
    try {
      setLoading(true);
      const data = await roomService.getAvailable();
      setRooms(data);
    } catch (error) {
      console.error("Error loading rooms:", error);
    } finally {
      setLoading(false);
    }
  };

  const filteredRooms = rooms.filter((room) => {
    if (filters.type !== "all" && room.room_type !== filters.type) return false;
    return true;
  });

  return (
    <MainLayout>
      <Head>
        <title>Quartos | Gestão Arroios</title>
      </Head>

      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-bold">Nossos Quartos</h1>
            <p className="text-muted-foreground mt-2">
              Encontre o quarto perfeito para a sua estadia
            </p>
          </div>

          <div className="flex gap-2">
            <Select
              value={filters.type}
              onValueChange={(v) => setFilters({ ...filters, type: v })}
            >
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Tipo de Quarto" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os Tipos</SelectItem>
                <SelectItem value="Standard">Standard</SelectItem>
                <SelectItem value="Suite">Suite</SelectItem>
                <SelectItem value="Large">Large</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="h-[400px] bg-muted animate-pulse rounded-lg" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <Card key={room.id} className="flex flex-col">
                <div className="aspect-video relative overflow-hidden rounded-t-lg bg-muted">
                  {/* Image placeholder since actual images might be missing */}
                  <div className="absolute inset-0 flex items-center justify-center text-muted-foreground bg-gray-100">
                    <span className="text-4xl font-light capitalize">
                      {room.room_type}
                    </span>
                  </div>
                </div>
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {room.name || `Quarto ${room.room_number}`}
                      </CardTitle>
                      <CardDescription className="mt-1 capitalize">
                        {room.room_type} • Piso {room.floor}
                      </CardDescription>
                    </div>
                    <Badge variant="secondary" className="text-lg">
                      €{room.base_price}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1">
                  {room.amenities && room.amenities.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {room.amenities.slice(0, 3).map((amenity) => (
                        <Badge key={amenity} variant="outline" className="text-xs">
                          {amenity}
                        </Badge>
                      ))}
                      {room.amenities.length > 3 && (
                        <Badge variant="outline" className="text-xs">
                          +{room.amenities.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </CardContent>
                <CardFooter>
                  <Link href={`/rooms/${room.id}`} className="w-full">
                    <Button className="w-full">
                      Ver Detalhes <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </MainLayout>
  );
}