import { useState } from "react";
import { useRouter } from "next/router";
import { MainLayout } from "@/components/Layout/MainLayout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Users, Star, MapPin, Wifi, Coffee, Car, Tv, Wind, Utensils } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useFrontendTexts } from "@/hooks/useFrontendTexts";

export default function Home() {
  const router = useRouter();
  const { t } = useFrontendTexts("home");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (checkIn) params.append("checkIn", checkIn);
    if (checkOut) params.append("checkOut", checkOut);
    router.push(`/rooms?${params.toString()}`);
  };

  const features = [
    { icon: Wifi, title: "Wi-Fi Grátis", description: "Internet de alta velocidade" },
    { icon: Coffee, title: "Pequeno-Almoço", description: "Incluído na estadia" },
    { icon: Car, title: "Estacionamento", description: "Gratuito no local" },
    { icon: Tv, title: "TV Smart", description: "Netflix e streaming" },
    { icon: Wind, title: "Ar Condicionado", description: "Em todos os quartos" },
    { icon: Utensils, title: "Cozinha", description: "Totalmente equipada" },
  ];

  const testimonials = [
    {
      name: "Maria Silva",
      rating: 5,
      comment: "Excelente localização e quartos muito confortáveis. Voltarei com certeza!",
      date: "Dezembro 2024",
    },
    {
      name: "João Santos",
      rating: 5,
      comment: "Atendimento impecável e instalações modernas. Recomendo a todos!",
      date: "Novembro 2024",
    },
    {
      name: "Ana Costa",
      rating: 5,
      comment: "Perfeito para estadias longas. Tudo muito limpo e organizado.",
      date: "Outubro 2024",
    },
  ];

  return (
    <MainLayout>
      <SEO
        title="Gestão Arroios - Alojamento de Qualidade em Lisboa"
        description="Descubra os nossos quartos modernos e confortáveis no coração de Lisboa. Reserve agora com os melhores preços."
        image="/og-image.png"
      />

      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-600 via-purple-600 to-pink-500 py-20 text-white">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="container relative mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="mb-6 text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
              {t("home_hero_title", "O Seu Refúgio no Coração de Lisboa")}
            </h1>
            <p className="mb-8 text-lg text-white/90 sm:text-xl">
              {t("home_hero_description", "Quartos modernos e confortáveis com todas as comodidades que precisa para uma estadia perfeita")}
            </p>

            {/* Search Form */}
            <Card className="mx-auto max-w-4xl bg-white/95 backdrop-blur">
              <CardContent className="p-6">
                <form onSubmit={handleSearch} className="grid gap-4 md:grid-cols-3">
                  <div className="space-y-2">
                    <Label htmlFor="checkIn" className="text-sm font-medium text-gray-700">
                      Check-in
                    </Label>
                    <Input
                      id="checkIn"
                      type="date"
                      value={checkIn}
                      onChange={(e) => setCheckIn(e.target.value)}
                      min={format(new Date(), "yyyy-MM-dd")}
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="checkOut" className="text-sm font-medium text-gray-700">
                      Check-out
                    </Label>
                    <Input
                      id="checkOut"
                      type="date"
                      value={checkOut}
                      onChange={(e) => setCheckOut(e.target.value)}
                      min={checkIn || format(new Date(), "yyyy-MM-dd")}
                      className="w-full"
                      required
                    />
                  </div>
                  <div className="flex items-end">
                    <Button
                      type="submit"
                      className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
                      size="lg"
                    >
                      {t("home_hero_search_button", "Pesquisar")}
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("home_features_title", "Comodidades Incluídas")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home_features_description", "Tudo o que precisa para uma estadia confortável e memorável")}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <Card key={index} className="border-2 hover:border-brand-primary transition-all hover:shadow-lg">
                <CardContent className="p-6 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-600 to-purple-600">
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="mb-2 text-xl font-semibold">{feature.title}</h3>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Location Section */}
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-2 text-sm font-medium text-brand-primary">
                <MapPin className="h-4 w-4" />
                {t("home_location_badge", "Localização Premium")}
              </div>
              <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
                {t("home_location_title", "No Coração de Arroios, Lisboa")}
              </h2>
              <p className="mb-6 text-lg text-muted-foreground">
                {t("home_location_description", "Localizado numa das zonas mais vibrantes e multiculturais de Lisboa, com fácil acesso a transportes públicos, restaurantes, cafés e atrações turísticas.")}
              </p>
              <ul className="space-y-3 mb-8">
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-muted-foreground">5 min a pé do Metro de Arroios</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-muted-foreground">15 min do centro histórico</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="mt-1 flex h-5 w-5 items-center justify-center rounded-full bg-green-500/10">
                    <div className="h-2 w-2 rounded-full bg-green-500"></div>
                  </div>
                  <span className="text-muted-foreground">20 min do Aeroporto de Lisboa</span>
                </li>
              </ul>
              <Button
                onClick={() => router.push("/rooms")}
                size="lg"
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:shadow-lg"
              >
                {t("home_location_button", "Ver Quartos Disponíveis")}
              </Button>
            </div>
            <div className="relative h-[400px] rounded-2xl bg-gradient-to-br from-blue-600 to-purple-600 lg:h-[500px] overflow-hidden shadow-2xl">
              <div className="absolute inset-0 flex items-center justify-center text-white">
                <MapPin className="h-24 w-24 opacity-20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t("home_testimonials_title", "O Que Dizem os Nossos Hóspedes")}</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {t("home_testimonials_description", "Avaliações reais de quem já nos visitou")}
            </p>
          </div>
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-2 hover:shadow-lg transition-all">
                <CardContent className="p-6">
                  <div className="mb-4 flex items-center gap-1">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="mb-4 text-muted-foreground italic">
                    "{testimonial.comment}"
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="font-semibold">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.date}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-3xl font-bold lg:text-4xl">
            {t("home_cta_title", "Pronto para Reservar a Sua Estadia?")}
          </h2>
          <p className="mb-8 text-lg text-white/90 max-w-2xl mx-auto">
            {t("home_cta_description", "Descubra os nossos quartos modernos e reserve agora com os melhores preços garantidos")}
          </p>
          <div className="flex flex-col gap-4 sm:flex-row sm:justify-center">
            <Button
              onClick={() => router.push("/rooms")}
              size="lg"
              variant="outline"
              className="bg-white text-brand-primary hover:bg-white/90 border-2 border-white"
            >
              {t("home_cta_button_rooms", "Ver Todos os Quartos")}
            </Button>
            <Button
              onClick={() => router.push("/admin")}
              size="lg"
              variant="outline"
              className="bg-transparent text-white hover:bg-white/10 border-2 border-white"
            >
              {t("home_cta_button_admin", "Acesso Administração")}
            </Button>
          </div>
        </div>
      </section>
    </MainLayout>
  );
}