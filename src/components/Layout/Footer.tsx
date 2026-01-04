import { useState, useEffect } from "react";
import { Mail, Phone, Clock, MapPin } from "lucide-react";
import Link from "next/link";
import { settingsService } from "@/services/settingsService";

interface FooterInfo {
  address?: string;
  city?: string;
  postalCode?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  checkInTime?: string;
  checkOutTime?: string;
}

export function Footer() {
  const [footerInfo, setFooterInfo] = useState<FooterInfo>({
    address: "Rua dos Arroios, 123",
    city: "Lisboa",
    postalCode: "1000-001",
    country: "Portugal",
    contactEmail: "info@arroios.pt",
    contactPhone: "+351 912 345 678",
    checkInTime: "15:00",
    checkOutTime: "11:00",
  });
  const [propertyName, setPropertyName] = useState("Alojamento Arroios");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [name, info] = await Promise.all([
        settingsService.get("property_name"),
        settingsService.get("footer_info"),
      ]);
      
      if (name && typeof name === "string") setPropertyName(name);
      if (info && typeof info === "object") {
        setFooterInfo({ ...footerInfo, ...(info as FooterInfo) });
      }
    } catch (error) {
      console.error("Error loading footer settings:", error);
    }
  };

  return (
    <footer className="bg-card border-t py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div>
            <h3 className="font-semibold mb-4">{propertyName}</h3>
            <p className="text-sm text-muted-foreground mb-2 flex items-start gap-2">
              <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>
                {footerInfo.address}<br />
                {footerInfo.postalCode && `${footerInfo.postalCode} `}
                {footerInfo.city}, {footerInfo.country}
              </span>
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Contacto</h3>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Mail className="w-4 h-4" />
              {footerInfo.contactEmail}
            </p>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              {footerInfo.contactPhone}
            </p>
          </div>
          
          <div>
            <h3 className="font-semibold mb-4">Horários</h3>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Check-in: {footerInfo.checkInTime}
            </p>
            <p className="text-sm text-muted-foreground mb-2 flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Check-out: {footerInfo.checkOutTime}
            </p>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Links Rápidos</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/rooms" className="hover:text-primary transition-colors">Quartos</Link></li>
              <li><Link href="/about" className="hover:text-primary transition-colors">Sobre Nós</Link></li>
              <li><Link href="/terms" className="hover:text-primary transition-colors">Termos & Condições</Link></li>
              <li><Link href="/privacy" className="hover:text-primary transition-colors">Política de Privacidade</Link></li>
            </ul>
          </div>
        </div>
        
        <div className="border-t pt-8 text-center text-sm text-muted-foreground">
          <p>© 2026 {propertyName}. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}