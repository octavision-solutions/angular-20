import { Injectable } from '@angular/core';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';

export interface ExportOptions {
  filename: string;
  title?: string;
  subtitle?: string;
  orientation?: 'portrait' | 'landscape';
  pageSize?: 'a4' | 'a3' | 'letter';
}

@Injectable({
  providedIn: 'root'
})
export class ExportService {

  constructor() { }

  // Export data to PDF
  exportToPDF(data: Record<string, unknown>[], columns: { key: string; title: string }[], options: ExportOptions): void {
    try {
      const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: options.pageSize || 'a4'
      });

      // Add title and subtitle
      if (options.title) {
        pdf.setFontSize(16);
        pdf.text(options.title, 20, 20);
      }

      if (options.subtitle) {
        pdf.setFontSize(12);
        pdf.text(options.subtitle, 20, 30);
      }

      // Prepare table data
      const headers = columns.map(col => col.title);
      const rows = data.map(item => 
        columns.map(col => this.formatCellValue(item[col.key]))
      );

      // Add table to PDF
      const startY = options.title ? 40 : 20;
      this.addTableToPDF(pdf, headers, rows, startY);

      // Save the PDF
      pdf.save(options.filename + '.pdf');
    } catch (error) {
      console.error('Error exporting to PDF:', error);
      throw new Error('Failed to export PDF');
    }
  }

  // Export data to Excel
  exportToExcel(data: Record<string, unknown>[], columns: { key: string; title: string }[], options: ExportOptions): void {
    try {
      // Create workbook and worksheet
      const wb = XLSX.utils.book_new();
      
      // Prepare data for Excel
      const excelData = data.map(item => {
        const row: Record<string, unknown> = {};
        columns.forEach(col => {
          row[col.title] = this.formatCellValue(item[col.key]);
        });
        return row;
      });

      // Create worksheet from data
      const ws = XLSX.utils.json_to_sheet(excelData);

      // Set column widths
      const colWidths = columns.map(() => ({ width: 15 }));
      ws['!cols'] = colWidths;

      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(wb, ws, 'Data');

      // Save the Excel file
      XLSX.writeFile(wb, options.filename + '.xlsx');
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      throw new Error('Failed to export Excel');
    }
  }

  // Helper method to add table to PDF
  private addTableToPDF(pdf: jsPDF, headers: string[], rows: string[][], startY: number): void {
    const pageHeight = pdf.internal.pageSize.height;
    const pageWidth = pdf.internal.pageSize.width;
    const margin = 20;
    const tableWidth = pageWidth - 2 * margin;
    const colWidth = tableWidth / headers.length;
    const rowHeight = 8;
    
    let currentY = startY;

    // Draw headers
    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    
    headers.forEach((header, index) => {
      const x = margin + index * colWidth;
      pdf.rect(x, currentY, colWidth, rowHeight);
      pdf.text(header, x + 2, currentY + 5);
    });

    currentY += rowHeight;

    // Draw data rows
    pdf.setFontSize(9);
    
    rows.forEach(row => {
      // Check if we need a new page
      if (currentY + rowHeight > pageHeight - margin) {
        pdf.addPage();
        currentY = margin;
        
        // Redraw headers on new page
        headers.forEach((header, index) => {
          const x = margin + index * colWidth;
          pdf.rect(x, currentY, colWidth, rowHeight);
          pdf.text(header, x + 2, currentY + 5);
        });
        currentY += rowHeight;
      }

      row.forEach((cell, index) => {
        const x = margin + index * colWidth;
        pdf.rect(x, currentY, colWidth, rowHeight);
        
        // Truncate text if too long
        let text = cell.toString();
        if (text.length > 15) {
          text = text.substring(0, 12) + '...';
        }
        
        pdf.text(text, x + 2, currentY + 5);
      });

      currentY += rowHeight;
    });
  }

  // Format cell values for export
  private formatCellValue(value: unknown): string {
    if (value === null || value === undefined) {
      return '';
    }

    if (typeof value === 'number') {
      // Format numbers with appropriate decimal places
      return value % 1 === 0 ? value.toString() : value.toFixed(2);
    }

    if (value instanceof Date) {
      // Format dates in a readable format
      return value.toLocaleDateString() + ' ' + value.toLocaleTimeString();
    }

    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }

    return value.toString();
  }

  // Export invoice as PDF with proper formatting
  exportInvoicePDF(invoice: Record<string, unknown>, details: Record<string, unknown>[], company: Record<string, unknown>): void {
    try {
      const pdf = new jsPDF();
      
      // Company header
      pdf.setFontSize(16);
      pdf.text(company['companyname'] as string || 'Company Name', 20, 20);
      
      pdf.setFontSize(10);
      pdf.text(company['address'] as string || 'Company Address', 20, 30);
      pdf.text(company['phone'] as string || 'Phone: XXX-XXX-XXXX', 20, 35);

      // Invoice details
      pdf.setFontSize(14);
      pdf.text('SALES INVOICE', 20, 50);
      
      pdf.setFontSize(10);
      pdf.text(`Invoice #: ${invoice['invoiceid'] || 'N/A'}`, 20, 60);
      pdf.text(`Date: ${this.formatCellValue(invoice['date'])}`, 20, 65);
      pdf.text(`Customer: ${invoice['customer_name'] || 'N/A'}`, 20, 70);
      pdf.text(`Salesman: ${invoice['salesman_name'] || 'N/A'}`, 120, 60);
      pdf.text(`Route: ${invoice['route_name'] || 'N/A'}`, 120, 65);

      // Invoice items table
      const headers = ['Product', 'Qty', 'Rate', 'Amount'];
      const rows = details.map(item => [
        item['product_name'] as string || 'N/A',
        this.formatCellValue(item['qty']),
        this.formatCellValue(item['sprice']),
        this.formatCellValue(item['net_amount'])
      ]);

      this.addTableToPDF(pdf, headers, rows, 80);

      // Invoice totals
      const totalY = 80 + (details.length + 1) * 8 + 10;
      pdf.text(`Subtotal: ${this.formatCellValue(invoice['amount'])}`, 120, totalY);
      pdf.text(`Discount: ${this.formatCellValue(invoice['discount'])}`, 120, totalY + 5);
      pdf.text(`Tax: ${this.formatCellValue(invoice['tax'])}`, 120, totalY + 10);
      pdf.setFontSize(12);
      pdf.text(`Net Total: ${this.formatCellValue(invoice['net_amount'])}`, 120, totalY + 18);

      // Save
      pdf.save(`invoice_${invoice['invoiceid']}.pdf`);
    } catch (error) {
      console.error('Error exporting invoice PDF:', error);
      throw new Error('Failed to export invoice PDF');
    }
  }

  // Export multiple sheets to Excel
  exportMultiSheetExcel(sheets: { name: string; data: Record<string, unknown>[]; columns: { key: string; title: string }[] }[], filename: string): void {
    try {
      const wb = XLSX.utils.book_new();

      sheets.forEach(sheet => {
        const excelData = sheet.data.map(item => {
          const row: Record<string, unknown> = {};
          sheet.columns.forEach(col => {
            row[col.title] = this.formatCellValue(item[col.key]);
          });
          return row;
        });

        const ws = XLSX.utils.json_to_sheet(excelData);
        const colWidths = sheet.columns.map(() => ({ width: 15 }));
        ws['!cols'] = colWidths;

        XLSX.utils.book_append_sheet(wb, ws, sheet.name);
      });

      XLSX.writeFile(wb, filename + '.xlsx');
    } catch (error) {
      console.error('Error exporting multi-sheet Excel:', error);
      throw new Error('Failed to export Excel');
    }
  }
}