import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { 
  LayoutDashboard, 
  BedDouble, 
  CalendarDays, 
  Users, 
  Settings, 
  LogOut, 
  Menu,
  X,
  CreditCard,
  PieChart,
  Calendar,
  Wallet,
  TrendingUp,
  CalendarCheck,
  DollarSign,
  Palette,
  Type,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { ThemeSwitch } from "@/components/ThemeSwitch";

interface AdminLayoutProps {
  children: React.ReactNode;
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const router = useRouter();
  const { logout, isAdmin } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const navItems = [
    { name: "Dashboard", href: "/admin", icon: LayoutDashboard, adminOnly: false },
    { name: "Calendário", href: "/admin/calendar", icon: Calendar, adminOnly: false },
    { name: "Reservas", href: "/admin/bookings", icon: CalendarCheck, adminOnly: false },
    { name: "Quartos", href: "/admin/rooms", icon: BedDouble, adminOnly: false },
    { name: "Receitas", href: "/admin/receitas", icon: TrendingUp, adminOnly: false },
    { name: "Despesas", href: "/admin/expenses", icon: Wallet, adminOnly: false },
    { name: "Financeiro", href: "/admin/financeiro", icon: DollarSign, adminOnly: true },
    { name: "Relatórios", href: "/admin/relatorios", icon: TrendingUp, adminOnly: true },
    { name: "Clientes", href: "/admin/clientes", icon: Users, adminOnly: false },
    { name: "Utilizadores", href: "/admin/utilizadores", icon: Users, adminOnly: true },
    { name: "Configurações", href: "/admin/configuracoes", icon: Settings, adminOnly: true },
    { name: "Config. Frontend", href: "/admin/configuracoes-frontend", icon: Palette, adminOnly: true },
    { name: "Textos Frontend", href: "/admin/textos-frontend", icon: Type, adminOnly: true },
  ];

  // Filter nav items based on user role
  const filteredNavItems = navItems.filter(item => !item.adminOnly || isAdmin);

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <div className="min-h-screen bg-muted/20 flex">
      {/* Sidebar */}
      <aside 
        className={`fixed inset-y-0 left-0 z-50 bg-card border-r w-64 transition-transform duration-300 ease-in-out ${
          isSidebarOpen ? "translate-x-0" : "-translate-x-full"
        } lg:relative lg:translate-x-0`}
      >
        <div className="h-full flex flex-col">
          <div className="p-6 border-b flex items-center justify-between">
            <Link href="/admin" className="flex items-center gap-2 font-bold text-xl">
              <div className="w-8 h-8 bg-brand-primary rounded flex items-center justify-center text-white text-sm">
                A
              </div>
              <span>Admin</span>
            </Link>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
            {filteredNavItems.map((item) => {
              const isActive = router.pathname === item.href;
              return (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant={isActive ? "secondary" : "ghost"}
                    className={`w-full justify-start gap-3 ${isActive ? "bg-muted font-medium" : "text-muted-foreground"}`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.name}
                  </Button>
                </Link>
              );
            })}
          </nav>

          <div className="p-4 border-t space-y-2">
            <div className="flex items-center justify-between px-2 py-2">
              <span className="text-xs text-muted-foreground font-medium">MODO ESCURO</span>
              <ThemeSwitch />
            </div>
            <Button 
              variant="ghost" 
              className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleLogout}
            >
              <LogOut className="w-4 h-4" />
              Sair
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-background border-b h-16 px-6 flex items-center justify-between lg:justify-end sticky top-0 z-40">
          <Button 
            variant="ghost" 
            size="icon" 
            className="lg:hidden"
            onClick={() => setIsSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </Button>

          <div className="flex items-center gap-4">
            <Link href="/" target="_blank" rel="noopener noreferrer">
              <Button variant="outline" size="sm" className="gap-2">
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Ver Frontend</span>
              </Button>
            </Link>

            <div className="text-right hidden sm:block">
              <p className="text-sm font-medium">Administrador</p>
              <p className="text-xs text-muted-foreground">admin@arroios.pt</p>
            </div>
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold">
              AD
            </div>
          </div>
        </header>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>

      {/* Mobile Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}
    </div>
  );
}