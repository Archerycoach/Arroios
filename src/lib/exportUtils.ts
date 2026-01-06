import * as XLSX from "xlsx";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { PaymentWithDetails } from "@/types";

export interface PaymentFilters {
  startDate?: Date;
  endDate?: Date;
  status?: string;
  paymentType?: string;
  room_id?: string;
  bank_account_id?: string;
  month?: string;
  room?: string;
}

export const PAYMENT_TYPE_LABELS: Record<string, string> = {
  monthly: "Mensalidade",
  biweekly: "Quinzenal",
  deposit: "Caução",
  deposit_refund: "Devolução Caução",
  daily: "Diária",
  other: "Outro",
};

export const PAYMENT_STATUS_LABELS: Record<string, string> = {
  pending: "Pendente",
  paid: "Pago",
  overdue: "Atrasado",
  cancelled: "Cancelado",
  refunded: "Reembolsado",
};

/**
 * Utility functions for exporting data to Excel
 */

export interface ExportColumn {
  header: string;
  key: string;
  format?: (value: any) => string | number;
}

/**
 * Format date to dd/mm/yyyy
 */
export function formatDateDDMMYYYY(date: string | Date | null): string {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  
  const day = String(d.getDate()).padStart(2, "0");
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format currency value
 */
export function formatCurrency(value: number | null): string {
  if (value === null || value === undefined) return "€0.00";
  return `€${value.toFixed(2)}`;
}

/**
 * Export data to Excel file
 */
export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  columns: ExportColumn[],
  filename: string
): void {
  if (!data || data.length === 0) {
    alert("Não há dados para exportar");
    return;
  }

  // Transform data according to columns configuration
  const exportData = data.map(item => {
    const row: Record<string, any> = {};
    columns.forEach(col => {
      const value = item[col.key];
      row[col.header] = col.format ? col.format(value) : value;
    });
    return row;
  });

  // Create workbook and worksheet
  const ws = XLSX.utils.json_to_sheet(exportData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Dados");

  // Auto-size columns
  const maxWidth = 50;
  const colWidths = columns.map(col => {
    const headerLength = col.header.length;
    const maxDataLength = Math.max(
      ...exportData.map(row => String(row[col.header] || "").length)
    );
    return { wch: Math.min(Math.max(headerLength, maxDataLength) + 2, maxWidth) };
  });
  ws["!cols"] = colWidths;

  // Generate filename with timestamp
  const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, "-");
  const fullFilename = `${filename}_${timestamp}.xlsx`;

  // Download file
  XLSX.writeFile(wb, fullFilename);
}

/**
 * Guest export columns configuration
 */
export const guestExportColumns: ExportColumn[] = [
  { header: "Nome", key: "full_name" },
  { header: "Email", key: "email" },
  { header: "Telemóvel", key: "phone" },
  { 
    header: "Data de Nascimento", 
    key: "date_of_birth",
    format: formatDateDDMMYYYY
  },
  { header: "Morada", key: "address" },
  { header: "Cidade", key: "city" },
  { header: "Código Postal", key: "postal_code" },
  { header: "País", key: "country" },
  { header: "Número de Documento", key: "document_number" },
  { header: "Tipo de Documento", key: "document_type" },
  { 
    header: "Data de Registo", 
    key: "created_at",
    format: formatDateDDMMYYYY
  }
];

/**
 * Booking export columns configuration
 */
export const bookingExportColumns: ExportColumn[] = [
  { header: "ID Reserva", key: "id" },
  { header: "Quarto", key: "room_name" },
  { header: "Cliente", key: "guest_name" },
  { header: "Email Cliente", key: "guest_email" },
  { header: "Telemóvel", key: "guest_phone" },
  { 
    header: "Check-in", 
    key: "check_in",
    format: formatDateDDMMYYYY
  },
  { 
    header: "Check-out", 
    key: "check_out",
    format: formatDateDDMMYYYY
  },
  { header: "Número de Hóspedes", key: "num_guests" },
  { 
    header: "Preço Total", 
    key: "total_price",
    format: formatCurrency
  },
  { header: "Estado", key: "status" },
  { header: "Método de Pagamento", key: "payment_method" },
  { header: "Notas", key: "notes" },
  { 
    header: "Data de Criação", 
    key: "created_at",
    format: formatDateDDMMYYYY
  }
];

/**
 * Revenue export columns
 */
export const revenueExportColumns: ExportColumn[] = [
  { 
    header: "Data", 
    key: "date",
    format: formatDateDDMMYYYY
  },
  { header: "Tipo", key: "type" },
  { header: "Cliente", key: "customer" },
  { header: "Quarto", key: "room" },
  { header: "Descrição", key: "description" },
  { header: "Noites", key: "nights" },
  { 
    header: "Valor (€)", 
    key: "amount",
    format: formatCurrency
  },
  { header: "Canal", key: "channel" }
];

/**
 * Expense export columns
 */
export const expenseExportColumns: ExportColumn[] = [
  { 
    header: "Data", 
    key: "date",
    format: formatDateDDMMYYYY
  },
  { header: "Descrição", key: "description" },
  { header: "Categoria", key: "category" },
  { header: "Fornecedor", key: "supplier" },
  { header: "Método de Pagamento", key: "payment_method" },
  { 
    header: "Valor (€)", 
    key: "amount",
    format: formatCurrency
  },
  { header: "Notas", key: "notes" }
];

export function exportPaymentsToExcel(
  payments: PaymentWithDetails[],
  filters: PaymentFilters,
  customFilename?: string
) {
  const workbook = XLSX.utils.book_new();

  const data = payments.map((payment) => ({
    "Nº Reserva": payment.bookings?.booking_number || "N/A",
    "Quarto": payment.bookings?.rooms?.room_number 
      ? `Quarto ${payment.bookings.rooms.room_number}` 
      : payment.bookings?.rooms?.name || "N/A",
    "Conta Bancária": payment.bank_accounts?.name || "Não associada",
    "Cliente": payment.bookings?.guests?.full_name || "N/A",
    "Tipo": PAYMENT_TYPE_LABELS[payment.payment_type] || payment.payment_type,
    "Valor": `€${payment.amount.toFixed(2)}`,
    "Data de Vencimento": payment.due_date 
      ? format(new Date(payment.due_date), "dd/MM/yyyy", { locale: pt })
      : "N/A",
    "Estado": PAYMENT_STATUS_LABELS[payment.status] || payment.status,
    "Data de Pagamento": payment.payment_date
      ? format(new Date(payment.payment_date), "dd/MM/yyyy", { locale: pt })
      : "Não pago",
    "Método de Pagamento": payment.payment_method || "N/A",
    "Notas": payment.notes || "",
  }));

  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet["!cols"] = [
    { wch: 15 }, // Nº Reserva
    { wch: 15 }, // Quarto
    { wch: 20 }, // Conta Bancária
    { wch: 25 }, // Cliente
    { wch: 12 }, // Tipo
    { wch: 12 }, // Valor
    { wch: 18 }, // Data de Vencimento
    { wch: 12 }, // Estado
    { wch: 18 }, // Data de Pagamento
    { wch: 18 }, // Método de Pagamento
    { wch: 30 }, // Notas
  ];

  XLSX.utils.book_append_sheet(workbook, worksheet, "Pagamentos");

  // Add summary sheet
  const summary = createSummarySheet(payments);
  const summaryWorksheet = XLSX.utils.json_to_sheet(summary);
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, "Resumo");

  // Generate filename
  if (customFilename) {
    const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
    XLSX.writeFile(workbook, `${customFilename}_${timestamp}.xlsx`);
    return;
  }

  const timestamp = format(new Date(), "yyyy-MM-dd_HH-mm");
  let filename = `pagamentos_${timestamp}`;

  if (filters.startDate && filters.endDate) {
    const start = format(new Date(filters.startDate), "dd-MM-yyyy");
    const end = format(new Date(filters.endDate), "dd-MM-yyyy");
    filename = `pagamentos_${start}_a_${end}`;
  }

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

function createSummarySheet(payments: PaymentWithDetails[]) {
  const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = payments
    .filter((p) => p.status === "paid")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalPending = payments
    .filter((p) => p.status === "pending")
    .reduce((sum, p) => sum + p.amount, 0);

  const byType = payments.reduce((acc, p) => {
    const type = PAYMENT_TYPE_LABELS[p.payment_type] || p.payment_type;
    acc[type] = (acc[type] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const byAccount = payments.reduce((acc, p) => {
    const account = p.bank_accounts?.name || "Não associada";
    acc[account] = (acc[account] || 0) + p.amount;
    return acc;
  }, {} as Record<string, number>);

  const summaryData = [
    { "Categoria": "Totais Gerais", "Valor": "" },
    { "Categoria": "Total Previsto", "Valor": `€${totalAmount.toFixed(2)}` },
    { "Categoria": "Total Pago", "Valor": `€${totalPaid.toFixed(2)}` },
    { "Categoria": "Total Pendente", "Valor": `€${totalPending.toFixed(2)}` },
    { "Categoria": "", "Valor": "" },
    { "Categoria": "Por Tipo", "Valor": "" },
    ...Object.entries(byType).map(([type, amount]) => ({
      "Categoria": type,
      "Valor": `€${amount.toFixed(2)}`,
    })),
    { "Categoria": "", "Valor": "" },
    { "Categoria": "Por Conta Bancária", "Valor": "" },
    ...Object.entries(byAccount).map(([account, amount]) => ({
      "Categoria": account,
      "Valor": `€${amount.toFixed(2)}`,
    })),
  ];

  return summaryData;
}