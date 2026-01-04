import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { ProtectedAdminPage } from "@/components/Admin/ProtectedAdminPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Download,
  Percent,
  Users,
  BedDouble,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { expenseService } from "@/services/expenseService";
import { roomService } from "@/services/roomService";
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval, subYears } from "date-fns";
import { pt } from "date-fns/locale";

interface MonthlyStats {
  month: string;
  occupancyRate: number;
  revenue: number;
  expenses: number;
  profit: number;
  adr: number; // Average Daily Rate
  revpar: number; // Revenue Per Available Room
  bookings: number;
}

export default function RelatoriosPage() {
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("12"); // months
  const [monthlyStats, setMonthlyStats] = useState<MonthlyStats[]>([]);
  const [bookings, setBookings] = useState<any[]>([]);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [rooms, setRooms] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [period]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [bookingsData, expensesData, roomsData] = await Promise.all([
        bookingService.getAll(),
        expenseService.getAll(),
        roomService.getAll(),
      ]);

      setBookings(bookingsData);
      setExpenses(expensesData);
      setRooms(roomsData);

      // Calculate monthly stats
      calculateMonthlyStats(bookingsData, expensesData, roomsData);
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = (bookings: any[], expenses: any[], rooms: any[]) => {
    const monthsToShow = parseInt(period);
    const endDate = new Date();
    const startDate = subMonths(startOfMonth(endDate), monthsToShow - 1);

    const months = eachMonthOfInterval({ start: startDate, end: endDate });

    const stats: MonthlyStats[] = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      // Filter bookings for this month
      const monthBookings = bookings.filter(b => {
        const checkIn = new Date(b.check_in_date);
        return checkIn >= monthStart && checkIn <= monthEnd;
      });

      // Filter expenses for this month
      const monthExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.date);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      // Calculate revenue (only paid/completed bookings)
      const revenue = monthBookings
        .filter(b => b.status === "paid" || b.status === "completed")
        .reduce((sum, b) => sum + b.total_amount, 0);

      // Calculate expenses
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + e.amount, 0);

      // Calculate profit
      const profit = revenue - totalExpenses;

      // Calculate occupied nights
      const occupiedNights = monthBookings
        .filter(b => b.status === "paid" || b.status === "completed")
        .reduce((sum, b) => {
          const checkIn = new Date(b.check_in_date);
          const checkOut = new Date(b.check_out_date);
          const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));
          return sum + nights;
        }, 0);

      // Calculate total available nights
      const daysInMonth = monthEnd.getDate();
      const totalAvailableNights = rooms.length * daysInMonth;

      // Calculate occupancy rate
      const occupancyRate = totalAvailableNights > 0 
        ? (occupiedNights / totalAvailableNights) * 100 
        : 0;

      // Calculate ADR (Average Daily Rate)
      const adr = occupiedNights > 0 ? revenue / occupiedNights : 0;

      // Calculate RevPAR (Revenue Per Available Room)
      const revpar = totalAvailableNights > 0 ? revenue / rooms.length : 0;

      return {
        month: format(month, "MMM yyyy", { locale: pt }),
        occupancyRate: Math.round(occupancyRate * 10) / 10,
        revenue: Math.round(revenue * 100) / 100,
        expenses: Math.round(totalExpenses * 100) / 100,
        profit: Math.round(profit * 100) / 100,
        adr: Math.round(adr * 100) / 100,
        revpar: Math.round(revpar * 100) / 100,
        bookings: monthBookings.length,
      };
    });

    setMonthlyStats(stats);
  };

  // Calculate summary stats
  const totalRevenue = monthlyStats.reduce((sum, s) => sum + s.revenue, 0);
  const totalExpenses = monthlyStats.reduce((sum, s) => sum + s.expenses, 0);
  const totalProfit = totalRevenue - totalExpenses;
  const avgOccupancy = monthlyStats.length > 0 
    ? monthlyStats.reduce((sum, s) => sum + s.occupancyRate, 0) / monthlyStats.length 
    : 0;
  const profitMargin = totalRevenue > 0 ? (totalProfit / totalRevenue) * 100 : 0;

  // Calculate YoY comparison
  const currentPeriodStats = monthlyStats.slice(-parseInt(period));
  const previousYearStart = subYears(subMonths(startOfMonth(new Date()), parseInt(period) - 1), 1);
  const previousYearEnd = subYears(new Date(), 1);
  
  const previousYearBookings = bookings.filter(b => {
    const checkIn = new Date(b.check_in_date);
    return checkIn >= previousYearStart && checkIn <= previousYearEnd;
  });

  const previousYearRevenue = previousYearBookings
    .filter(b => b.status === "paid" || b.status === "completed")
    .reduce((sum, b) => sum + b.total_amount, 0);

  const revenueGrowth = previousYearRevenue > 0 
    ? ((totalRevenue - previousYearRevenue) / previousYearRevenue) * 100 
    : 0;

  const exportToPDF = () => {
    alert("Exportação PDF será implementada com biblioteca de relatórios");
  };

  const exportToCSV = () => {
    const csvContent = [
      ["Mês", "Taxa Ocupação (%)", "Receita (€)", "Despesas (€)", "Lucro (€)", "ADR (€)", "RevPAR (€)", "Reservas"],
      ...monthlyStats.map(stat => [
        stat.month,
        stat.occupancyRate.toString(),
        stat.revenue.toString(),
        stat.expenses.toString(),
        stat.profit.toString(),
        stat.adr.toString(),
        stat.revpar.toString(),
        stat.bookings.toString(),
      ])
    ].map(row => row.join(",")).join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `relatorio-${period}-meses-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar relatórios...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ProtectedAdminPage>
        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold">Relatórios e Análise</h1>
              <p className="text-muted-foreground mt-2">
                Métricas financeiras e operacionais
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Últimos 3 meses</SelectItem>
                  <SelectItem value="6">Últimos 6 meses</SelectItem>
                  <SelectItem value="12">Últimos 12 meses</SelectItem>
                  <SelectItem value="24">Últimos 24 meses</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={exportToCSV}>
                <Download className="h-4 w-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                PDF
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalRevenue.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground flex items-center mt-1">
                  {revenueGrowth > 0 ? (
                    <>
                      <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
                      <span className="text-green-500">+{revenueGrowth.toFixed(1)}%</span>
                    </>
                  ) : (
                    <>
                      <ArrowDownRight className="h-3 w-3 mr-1 text-red-500" />
                      <span className="text-red-500">{revenueGrowth.toFixed(1)}%</span>
                    </>
                  )}
                  <span className="ml-1">vs ano anterior</span>
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Despesas Totais</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">€{totalExpenses.toFixed(2)}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {period} meses
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                  €{totalProfit.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Margem: {profitMargin.toFixed(1)}%
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ocupação Média</CardTitle>
                <Percent className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{avgOccupancy.toFixed(1)}%</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {period} meses
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-4">
            <TabsList>
              <TabsTrigger value="overview">Visão Geral</TabsTrigger>
              <TabsTrigger value="pl">P&L</TabsTrigger>
              <TabsTrigger value="metrics">Métricas</TabsTrigger>
              <TabsTrigger value="expenses">Despesas</TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Evolução Mensal</CardTitle>
                  <CardDescription>Receita, despesas e lucro por mês</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {monthlyStats.map((stat, index) => {
                      const maxValue = Math.max(...monthlyStats.map(s => Math.max(s.revenue, s.expenses)));
                      const revenueWidth = (stat.revenue / maxValue) * 100;
                      const expenseWidth = (stat.expenses / maxValue) * 100;

                      return (
                        <div key={index} className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">{stat.month}</span>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              <span>Ocupação: {stat.occupancyRate}%</span>
                              <span>Reservas: {stat.bookings}</span>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <div className="w-20 text-xs text-right text-muted-foreground">Receita:</div>
                              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-green-500 flex items-center justify-end px-2"
                                  style={{ width: `${revenueWidth}%` }}
                                >
                                  <span className="text-xs font-medium text-white">
                                    €{stat.revenue.toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 text-xs text-right text-muted-foreground">Despesas:</div>
                              <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                                <div 
                                  className="h-full bg-red-500 flex items-center justify-end px-2"
                                  style={{ width: `${expenseWidth}%` }}
                                >
                                  <span className="text-xs font-medium text-white">
                                    €{stat.expenses.toFixed(0)}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="w-20 text-xs text-right font-medium">Lucro:</div>
                              <div className={`text-sm font-bold ${stat.profit >= 0 ? "text-green-600" : "text-red-600"}`}>
                                €{stat.profit.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* P&L Tab */}
            <TabsContent value="pl" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Demonstração de Resultados (P&L)</CardTitle>
                  <CardDescription>Análise financeira detalhada - {period} meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    {/* Revenue Section */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Receitas</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Reservas de Quartos</span>
                          <span className="font-medium">€{totalRevenue.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-semibold">Total Receitas</span>
                          <span className="font-bold text-lg">€{totalRevenue.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Expenses Section */}
                    <div>
                      <h3 className="font-semibold text-lg mb-3">Despesas</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Custos Operacionais</span>
                          <span className="font-medium">€{totalExpenses.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="font-semibold">Total Despesas</span>
                          <span className="font-bold text-lg">€{totalExpenses.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Profit Section */}
                    <div className="pt-4 border-t-2 border-foreground/20">
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-xl">Lucro Líquido</span>
                        <span className={`font-bold text-2xl ${totalProfit >= 0 ? "text-green-600" : "text-red-600"}`}>
                          €{totalProfit.toFixed(2)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center mt-2 text-sm">
                        <span className="text-muted-foreground">Margem de Lucro</span>
                        <span className={`font-medium ${profitMargin >= 0 ? "text-green-600" : "text-red-600"}`}>
                          {profitMargin.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Metrics Tab */}
            <TabsContent value="metrics" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <Card>
                  <CardHeader>
                    <CardTitle>ADR - Average Daily Rate</CardTitle>
                    <CardDescription>Receita média por noite ocupada</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthlyStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{stat.month}</span>
                          <span className="font-semibold">€{stat.adr.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-semibold">Média</span>
                        <span className="font-bold text-lg">
                          €{(monthlyStats.reduce((sum, s) => sum + s.adr, 0) / monthlyStats.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>RevPAR - Revenue Per Available Room</CardTitle>
                    <CardDescription>Receita por quarto disponível</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {monthlyStats.map((stat, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className="text-sm text-muted-foreground">{stat.month}</span>
                          <span className="font-semibold">€{stat.revpar.toFixed(2)}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between pt-3 border-t">
                        <span className="font-semibold">Média</span>
                        <span className="font-bold text-lg">
                          €{(monthlyStats.reduce((sum, s) => sum + s.revpar, 0) / monthlyStats.length).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Taxa de Ocupação por Mês</CardTitle>
                  <CardDescription>Percentagem de quartos ocupados</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {monthlyStats.map((stat, index) => {
                      const maxOccupancy = Math.max(...monthlyStats.map(s => s.occupancyRate));
                      const width = (stat.occupancyRate / maxOccupancy) * 100;

                      return (
                        <div key={index} className="space-y-1">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-muted-foreground">{stat.month}</span>
                            <span className="font-semibold">{stat.occupancyRate.toFixed(1)}%</span>
                          </div>
                          <div className="h-4 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-blue-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Expenses Tab */}
            <TabsContent value="expenses" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Despesas por Categoria</CardTitle>
                  <CardDescription>Análise de custos - {period} meses</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {(() => {
                      // Group expenses by category
                      const expensesByCategory: { [key: string]: number } = {};
                      
                      expenses.forEach(expense => {
                        const categoryName = expense.expense_categories?.name || "Sem Categoria";
                        expensesByCategory[categoryName] = (expensesByCategory[categoryName] || 0) + expense.amount;
                      });

                      const categories = Object.entries(expensesByCategory)
                        .sort(([, a], [, b]) => b - a);

                      const maxAmount = Math.max(...categories.map(([, amount]) => amount));

                      return categories.map(([category, amount]) => {
                        const percentage = (amount / totalExpenses) * 100;
                        const width = (amount / maxAmount) * 100;

                        return (
                          <div key={category} className="space-y-1">
                            <div className="flex items-center justify-between text-sm">
                              <span className="font-medium">{category}</span>
                              <div className="flex items-center gap-3">
                                <span className="text-muted-foreground">{percentage.toFixed(1)}%</span>
                                <span className="font-semibold">€{amount.toFixed(2)}</span>
                              </div>
                            </div>
                            <div className="h-6 bg-muted rounded-full overflow-hidden">
                              <div 
                                className="h-full bg-orange-500 flex items-center justify-end px-2"
                                style={{ width: `${width}%` }}
                              >
                                {width > 20 && (
                                  <span className="text-xs font-medium text-white">
                                    €{amount.toFixed(0)}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </ProtectedAdminPage>
    </AdminLayout>
  );
}