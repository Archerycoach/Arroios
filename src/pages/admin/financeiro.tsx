import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/Admin/AdminLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  Wallet,
  Download,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { bookingService } from "@/services/bookingService";
import { expenseService } from "@/services/expenseService";
import { format, subMonths } from "date-fns";
import { pt } from "date-fns/locale";
import { extraRevenueService } from "@/services/extraRevenueService";

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<1 | 3 | 6 | 12>(1);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [profit, setProfit] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [previousRevenue, setPreviousRevenue] = useState(0);

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const cutoffDate = subMonths(new Date(), period);
      
      console.log('=== FINANCIAL DATA DEBUG ===');
      console.log('Period:', period, 'months');
      console.log('Cutoff date:', cutoffDate.toISOString());
      
      // Load all extra revenues (includes payments synced from bookings)
      const allExtraRevenues = await extraRevenueService.getAll();
      console.log('Total extra revenues in database:', allExtraRevenues.length);
      
      // Filter revenues by date
      const revenuesInPeriod = allExtraRevenues.filter(r => {
        const revenueDate = new Date(r.date);
        const isInPeriod = revenueDate >= cutoffDate && revenueDate <= new Date();
        
        if (isInPeriod) {
          console.log(`Revenue ${r.id}:`, {
            date: revenueDate.toISOString(),
            amount: r.amount,
            type: r.type,
            description: r.description
          });
        }
        
        return isInPeriod;
      });
      
      console.log('Revenues in current period:', revenuesInPeriod.length);
      
      // Separate booking-related revenues (Mensalidades, Cauções) from true extra revenues
      const bookingRevenues = revenuesInPeriod.filter(r => 
        r.type === "Mensalidades" || r.type === "Cauções"
      );
      const extraRevenues = revenuesInPeriod.filter(r => 
        r.type !== "Mensalidades" && r.type !== "Cauções"
      );
      
      const bookingRevenueTotal = bookingRevenues.reduce((sum, r) => sum + r.amount, 0);
      const extraRevenueTotal = extraRevenues.reduce((sum, r) => sum + r.amount, 0);
      
      console.log('Booking revenues (Mensalidades + Cauções):', bookingRevenueTotal);
      console.log('Extra revenues (others):', extraRevenueTotal);
      
      // Total revenue = booking revenues + extra revenues
      const totalRevenue = bookingRevenueTotal + extraRevenueTotal;
      console.log('TOTAL REVENUE:', totalRevenue);
      
      // Calculate previous period for comparison
      const previousCutoffDate = subMonths(cutoffDate, period);
      const previousRevenues = allExtraRevenues.filter(r => {
        const revenueDate = new Date(r.date);
        return revenueDate >= previousCutoffDate && revenueDate < cutoffDate;
      });
      
      const prevTotalRevenue = previousRevenues.reduce((sum, r) => sum + r.amount, 0);
      console.log('Previous period revenue:', prevTotalRevenue);
      setPreviousRevenue(prevTotalRevenue);
      
      // Load expenses
      const expensesData = await expenseService.getAll();
      const filteredExpenses = expensesData.filter((e: any) => {
        const expenseDate = new Date(e.date);
        return expenseDate >= cutoffDate && expenseDate <= new Date();
      });
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      console.log('Total expenses:', totalExpenses);
      console.log('=== END DEBUG ===');
      
      setRevenue(totalRevenue);
      setExpenses(totalExpenses);
      setProfit(totalRevenue - totalExpenses);
      
      // Combine transactions
      const allTransactions = [
        ...revenuesInPeriod.map(r => ({
          id: r.id,
          type: "revenue" as const,
          description: r.description,
          amount: r.amount,
          date: r.date,
          category: r.type || "Receita",
        })),
        ...filteredExpenses.map(e => ({
          id: e.id,
          type: "expense" as const,
          description: e.description,
          amount: -e.amount,
          date: e.date,
          category: (e as any).category || "Despesa",
        })),
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      
      setTransactions(allTransactions.slice(0, 20));
    } catch (error) {
      console.error("Error loading financial data:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("pt-PT", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  const profitMargin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : "0";
  
  // Calculate revenue growth
  const revenueGrowth = previousRevenue > 0 
    ? (((revenue - previousRevenue) / previousRevenue) * 100).toFixed(1)
    : revenue > 0 ? "100" : "0";

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-muted-foreground">A carregar dados financeiros...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Financeiro</h1>
            <p className="text-muted-foreground mt-2">
              Visão geral de receitas, despesas e lucros
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={period.toString()} onValueChange={(v) => setPeriod(Number(v) as 1 | 3 | 6 | 12)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Último Mês</SelectItem>
                <SelectItem value="3">Últimos 3 Meses</SelectItem>
                <SelectItem value="6">Últimos 6 Meses</SelectItem>
                <SelectItem value="12">Últimos 12 Meses</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Exportar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(revenue)}</div>
              <div className="text-xs text-muted-foreground flex items-center mt-1">
                {parseFloat(revenueGrowth) >= 0 ? (
                  <>
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    <span className="text-green-500">+{revenueGrowth}%</span>
                  </>
                ) : (
                  <>
                    <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                    <span className="text-red-500">{revenueGrowth}%</span>
                  </>
                )}
                <span className="ml-1">vs período anterior</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                {period} {period === 1 ? "mês" : "meses"}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(profit)}</div>
              <div className="text-xs text-muted-foreground mt-1">
                Margem: {profitMargin}%
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profitMargin}%</div>
              <div className="text-xs text-muted-foreground mt-1">
                Percentagem de receita
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Transactions Table */}
        <Card>
          <CardHeader>
            <CardTitle>Transações Recentes</CardTitle>
            <CardDescription>
              Últimas 20 transações de receitas e despesas
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {transactions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Nenhuma transação encontrada para o período selecionado
                </div>
              ) : (
                transactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="flex items-center justify-between p-3 rounded-lg border hover:bg-accent/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-full ${
                        transaction.type === "revenue" 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-red-500/10 text-red-500"
                      }`}>
                        {transaction.type === "revenue" ? (
                          <ArrowUpRight className="h-4 w-4" />
                        ) : (
                          <ArrowDownRight className="h-4 w-4" />
                        )}
                      </div>
                      <div>
                        <div className="font-medium">{transaction.description}</div>
                        <div className="text-sm text-muted-foreground flex items-center gap-2">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(transaction.date), "dd MMM yyyy", { locale: pt })}
                          {transaction.category && (
                            <>
                              <span>•</span>
                              <Badge variant="outline" className="text-xs">
                                {transaction.category}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className={`text-lg font-semibold ${
                      transaction.amount > 0 ? "text-green-500" : "text-red-500"
                    }`}>
                      {formatCurrency(Math.abs(transaction.amount))}
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}