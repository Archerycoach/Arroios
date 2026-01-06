import * as XLSX from "xlsx";

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