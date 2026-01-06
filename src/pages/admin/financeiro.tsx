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

export default function FinanceiroPage() {
  const [period, setPeriod] = useState<1 | 3 | 6 | 12>(1);
  const [revenue, setRevenue] = useState(0);
  const [expenses, setExpenses] = useState(0);
  const [profit, setProfit] = useState(0);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFinancialData();
  }, [period]);

  const loadFinancialData = async () => {
    try {
      setLoading(true);
      const cutoffDate = subMonths(new Date(), period);
      
      // Load bookings for revenue
      const bookings = await bookingService.getAll();
      const paidBookings = bookings.filter(b => {
        const isValidStatus = b.status === "paid" || b.status === "completed";
        const isInPeriod = new Date(b.created_at) >= cutoffDate;
        return isValidStatus && isInPeriod;
      });
      const totalRevenue = paidBookings.reduce((sum, b) => sum + b.total_amount, 0);
      
      // Load expenses
      const expensesData = await expenseService.getAll();
      const filteredExpenses = expensesData.filter((e: any) => new Date(e.date) >= cutoffDate);
      const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
      
      setRevenue(totalRevenue);
      setExpenses(totalExpenses);
      setProfit(totalRevenue - totalExpenses);
      
      // Combine transactions
      const allTransactions = [
        ...paidBookings.map(b => ({
          id: b.id,
          type: "revenue" as const,
          description: `Reserva #${b.id.slice(0, 8)}`,
          amount: b.total_amount,
          date: b.created_at,
          status: b.status,
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
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">+12.5%</span>
                <span className="ml-1">vs mês anterior</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Despesas</CardTitle>
              <CreditCard className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(expenses)}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingDown className="h-3 w-3 mr-1 text-red-500" />
                <span className="text-red-500">+8.2%</span>
                <span className="ml-1">vs mês anterior</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Lucro Líquido</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(profit)}</div>
              <p className="text-xs text-muted-foreground flex items-center mt-1">
                <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                <span className="text-green-500">+15.3%</span>
                <span className="ml-1">vs mês anterior</span>
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Margem de Lucro</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{profitMargin}%</div>
              <p className="text-xs text-muted-foreground mt-1">
                Percentagem de receita
              </p>
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
              {transactions.map((transaction) => (
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
                      <p className="font-medium">{transaction.description}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
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
                      </p>
                    </div>
                  </div>
                  <div className={`text-lg font-semibold ${
                    transaction.amount > 0 ? "text-green-500" : "text-red-500"
                  }`}>
                    {formatCurrency(Math.abs(transaction.amount))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}