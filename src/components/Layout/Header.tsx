import Link from "next/link";
import { useRouter } from "next/router";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { useState, useEffect } from "react";
import { ThemeSwitch } from "@/components/ThemeSwitch";
import { settingsService } from "@/services/settingsService";
import Image from "next/image";

export function Header() {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);
  const [propertyName, setPropertyName] = useState("Gestão Arroios");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const [logo, name] = await Promise.all([
        settingsService.get("logo_url"),
        settingsService.get("property_name"),
      ]);
      
      if (logo && typeof logo === "string") setLogoUrl(logo);
      if (name && typeof name === "string") setPropertyName(name);
    } catch (error) {
      console.error("Error loading header settings:", error);
    }
  };

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/rooms", label: "Quartos" },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-2">
            {logoUrl ? (
              <div className="relative h-10 w-10 overflow-hidden rounded-lg">
                <Image
                  src={logoUrl}
                  alt={propertyName}
                  fill
                  className="object-cover"
                />
              </div>
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-brand-primary to-brand-secondary">
                <span className="text-xl font-bold text-white">
                  {propertyName.substring(0, 2).toUpperCase()}
                </span>
              </div>
            )}
            <span className="hidden text-xl font-bold sm:inline-block">
              {propertyName}
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex md:items-center md:gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-medium transition-colors hover:text-brand-primary ${
                  router.pathname === link.href
                    ? "text-brand-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex md:items-center md:gap-4">
            <ThemeSwitch />
            <Link
              href="/admin"
              className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition-all hover:shadow-xl hover:scale-105"
            >
              <LayoutDashboard className="h-4 w-4" />
              Admin
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex items-center gap-3 md:hidden">
            <ThemeSwitch />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="inline-flex items-center justify-center rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              {mobileMenuOpen ? (
                <X className="h-6 w-6" />
              ) : (
                <Menu className="h-6 w-6" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="border-t md:hidden">
          <nav className="container mx-auto space-y-1 px-4 py-4">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block rounded-lg px-3 py-2 text-base font-medium transition-colors hover:bg-accent ${
                  router.pathname === link.href
                    ? "bg-accent text-brand-primary"
                    : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-2.5 text-base font-semibold text-white shadow-lg"
            >
              <LayoutDashboard className="h-5 w-5" />
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}