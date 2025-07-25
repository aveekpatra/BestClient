import jsPDF from "jspdf";
import { Work, Client } from "./types";
import { formatCurrency, getWorkTypeLabel } from "./utils";

interface ReceiptData {
  works: Work[];
  clients: Record<string, Client>;
  businessInfo: {
    name: string;
    address: string;
    phone: string;
    email: string;
    gst?: string;
  };
}

interface GroupedWork {
  client: Client;
  works: Work[];
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

export class PDFReceiptGenerator {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private doc: any;
  private pageWidth: number;
  private pageHeight: number;
  private margin: number;
  private currentY: number;

  constructor() {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    this.doc = new (jsPDF as any)();
    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
    this.margin = 20;
    this.currentY = this.margin;
  }

  private addBusinessHeader(businessInfo: ReceiptData["businessInfo"]) {
    // Business name
    this.doc.setFontSize(20);
    this.doc.setFont("helvetica", "bold");
    this.doc.text(businessInfo.name, this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 10;

    // Business details
    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(businessInfo.address, this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 6;

    const contactInfo = `Phone: ${businessInfo.phone} | Email: ${businessInfo.email}`;
    this.doc.text(contactInfo, this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 6;

    if (businessInfo.gst) {
      this.doc.text(
        `GST No: ${businessInfo.gst}`,
        this.pageWidth / 2,
        this.currentY,
        { align: "center" },
      );
      this.currentY += 6;
    }

    // Horizontal line
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.currentY + 5,
      this.pageWidth - this.margin,
      this.currentY + 5,
    );
    this.currentY += 15;
  }

  private addReceiptHeader(receiptNumber: string, date: string) {
    this.doc.setFontSize(16);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("RECEIPT", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 15;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(`Receipt No: ${receiptNumber}`, this.margin, this.currentY);
    this.doc.text(
      `Date: ${date}`,
      this.pageWidth - this.margin,
      this.currentY,
      { align: "right" },
    );
    this.currentY += 15;
  }

  private addClientInfo(client: Client) {
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Bill To:", this.margin, this.currentY);
    this.currentY += 8;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");
    this.doc.text(client.name, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.text(client.address, this.margin, this.currentY);
    this.currentY += 6;
    this.doc.text(`Phone: ${client.phone}`, this.margin, this.currentY);
    this.currentY += 6;

    if (client.email) {
      this.doc.text(`Email: ${client.email}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    if (client.panNumber) {
      this.doc.text(`PAN: ${client.panNumber}`, this.margin, this.currentY);
      this.currentY += 6;
    }

    this.currentY += 10;
  }

  private addWorkTable(works: Work[]) {
    const tableStartY = this.currentY;
    const colWidths = [25, 60, 35, 35, 35]; // Date, Description, Work Type, Amount, Paid
    const colPositions = [
      this.margin,
      this.margin + colWidths[0],
      this.margin + colWidths[0] + colWidths[1],
      this.margin + colWidths[0] + colWidths[1] + colWidths[2],
      this.margin + colWidths[0] + colWidths[1] + colWidths[2] + colWidths[3],
    ];

    // Table header
    this.doc.setFillColor(240, 240, 240);
    this.doc.rect(
      this.margin,
      this.currentY,
      this.pageWidth - 2 * this.margin,
      8,
      "F",
    );

    this.doc.setFontSize(9);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("Date", colPositions[0] + 2, this.currentY + 6);
    this.doc.text("Description", colPositions[1] + 2, this.currentY + 6);
    this.doc.text("Work Type", colPositions[2] + 2, this.currentY + 6);
    this.doc.text("Amount", colPositions[3] + 2, this.currentY + 6);
    this.doc.text("Paid", colPositions[4] + 2, this.currentY + 6);
    this.currentY += 8;

    // Table rows
    this.doc.setFont("helvetica", "normal");
    works.forEach((work, index) => {
      const rowY = this.currentY;

      // Alternate row background
      if (index % 2 === 1) {
        this.doc.setFillColor(250, 250, 250);
        this.doc.rect(
          this.margin,
          rowY,
          this.pageWidth - 2 * this.margin,
          8,
          "F",
        );
      }

      this.doc.text(work.transactionDate, colPositions[0] + 2, rowY + 6);

      // Truncate description if too long
      const description =
        work.description.length > 25
          ? work.description.substring(0, 22) + "..."
          : work.description;
      this.doc.text(description, colPositions[1] + 2, rowY + 6);

      const workTypesText = work.workTypes.map(getWorkTypeLabel).join(", ");
      this.doc.text(workTypesText, colPositions[2] + 2, rowY + 6);
      this.doc.text(
        formatCurrency(work.totalPrice),
        colPositions[3] + 2,
        rowY + 6,
      );
      this.doc.text(
        formatCurrency(work.paidAmount),
        colPositions[4] + 2,
        rowY + 6,
      );

      this.currentY += 8;
    });

    // Table border
    this.doc.setDrawColor(0, 0, 0);
    this.doc.setLineWidth(0.1);
    this.doc.rect(
      this.margin,
      tableStartY,
      this.pageWidth - 2 * this.margin,
      this.currentY - tableStartY,
    );

    // Vertical lines
    colPositions.slice(1).forEach((pos) => {
      this.doc.line(pos, tableStartY, pos, this.currentY);
    });

    this.currentY += 10;
  }

  private addTotals(totalAmount: number, totalPaid: number) {
    const balance = totalAmount - totalPaid;
    const rightAlign = this.pageWidth - this.margin;

    this.doc.setFontSize(10);
    this.doc.setFont("helvetica", "normal");

    // Total Amount
    this.doc.text("Total Amount:", rightAlign - 60, this.currentY);
    this.doc.text(formatCurrency(totalAmount), rightAlign, this.currentY, {
      align: "right",
    });
    this.currentY += 6;

    // Total Paid
    this.doc.text("Total Paid:", rightAlign - 60, this.currentY);
    this.doc.text(formatCurrency(totalPaid), rightAlign, this.currentY, {
      align: "right",
    });
    this.currentY += 6;

    // Balance
    this.doc.setFont("helvetica", "bold");
    const balanceLabel =
      balance > 0 ? "Balance Due:" : balance < 0 ? "Overpaid:" : "Balance:";
    this.doc.text(balanceLabel, rightAlign - 60, this.currentY);
    this.doc.text(
      formatCurrency(Math.abs(balance)),
      rightAlign,
      this.currentY,
      { align: "right" },
    );

    // Horizontal line above totals
    this.doc.setLineWidth(0.5);
    this.doc.line(
      rightAlign - 80,
      this.currentY - 20,
      rightAlign,
      this.currentY - 20,
    );

    this.currentY += 15;
  }

  private addFooter() {
    const footerY = this.pageHeight - 30;

    this.doc.setFontSize(8);
    this.doc.setFont("helvetica", "italic");
    this.doc.text("Thank you for your business!", this.pageWidth / 2, footerY, {
      align: "center",
    });
    this.doc.text(
      "This is a computer generated receipt.",
      this.pageWidth / 2,
      footerY + 6,
      { align: "center" },
    );
  }

  private checkPageBreak(requiredSpace: number = 30) {
    if (this.currentY + requiredSpace > this.pageHeight - 40) {
      this.doc.addPage();
      this.currentY = this.margin;
      return true;
    }
    return false;
  }

  generateSingleClientReceipt(data: ReceiptData): string {
    const businessInfo = data.businessInfo;
    const works = data.works;
    const clientId = works[0]?.clientId;
    const client = data.clients[clientId];

    if (!client) {
      throw new Error("Client not found");
    }

    // Generate receipt number
    const receiptNumber = `RCP-${Date.now().toString().slice(-8)}`;
    const currentDate = new Date().toLocaleDateString("en-IN");

    // Add content
    this.addBusinessHeader(businessInfo);
    this.addReceiptHeader(receiptNumber, currentDate);
    this.addClientInfo(client);
    this.addWorkTable(works);

    const totalAmount = works.reduce((sum, work) => sum + work.totalPrice, 0);
    const totalPaid = works.reduce((sum, work) => sum + work.paidAmount, 0);
    this.addTotals(totalAmount, totalPaid);
    this.addFooter();

    return this.doc.output("datauristring");
  }

  generateMultiClientReceipt(data: ReceiptData): string {
    const businessInfo = data.businessInfo;
    const works = data.works;

    // Group works by client
    const groupedWorks: Record<string, GroupedWork> = {};
    works.forEach((work) => {
      const client = data.clients[work.clientId];
      if (!client) return;

      if (!groupedWorks[work.clientId]) {
        groupedWorks[work.clientId] = {
          client,
          works: [],
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }

      groupedWorks[work.clientId].works.push(work);
      groupedWorks[work.clientId].totalAmount += work.totalPrice;
      groupedWorks[work.clientId].totalPaid += work.paidAmount;
      groupedWorks[work.clientId].totalBalance +=
        work.totalPrice - work.paidAmount;
    });

    // Generate receipt number
    const receiptNumber = `RCP-MULTI-${Date.now().toString().slice(-8)}`;
    const currentDate = new Date().toLocaleDateString("en-IN");

    // Add header
    this.addBusinessHeader(businessInfo);
    this.addReceiptHeader(receiptNumber, currentDate);

    // Add each client's works
    Object.values(groupedWorks).forEach((group, index) => {
      if (index > 0) {
        this.checkPageBreak(50);
        this.currentY += 10;
      }

      this.addClientInfo(group.client);
      this.addWorkTable(group.works);
      this.addTotals(group.totalAmount, group.totalPaid);

      if (index < Object.values(groupedWorks).length - 1) {
        // Add separator between clients
        this.doc.setLineWidth(0.5);
        this.doc.line(
          this.margin,
          this.currentY,
          this.pageWidth - this.margin,
          this.currentY,
        );
        this.currentY += 10;
      }
    });

    // Grand totals
    const grandTotal = works.reduce((sum, work) => sum + work.totalPrice, 0);
    const grandPaid = works.reduce((sum, work) => sum + work.paidAmount, 0);

    this.currentY += 10;
    this.doc.setFontSize(12);
    this.doc.setFont("helvetica", "bold");
    this.doc.text("GRAND TOTAL", this.pageWidth / 2, this.currentY, {
      align: "center",
    });
    this.currentY += 10;

    this.addTotals(grandTotal, grandPaid);
    this.addFooter();

    return this.doc.output("datauristring");
  }

  downloadPDF(dataUri: string, filename: string) {
    const link = document.createElement("a");
    link.href = dataUri;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}

export function generateReceiptPDF(
  works: Work[],
  clients: Record<string, Client>,
  businessInfo?: Partial<ReceiptData["businessInfo"]>,
): { dataUri: string; filename: string } {
  const generator = new PDFReceiptGenerator();

  // Default business info
  const defaultBusinessInfo: ReceiptData["businessInfo"] = {
    name: "Your Business Name",
    address: "Your Business Address, City, State - PIN",
    phone: "+91-XXXXXXXXXX",
    email: "your.email@business.com",
    ...businessInfo,
  };

  const data: ReceiptData = {
    works,
    clients,
    businessInfo: defaultBusinessInfo,
  };

  // Check if single or multi-client receipt
  const uniqueClients = new Set(works.map((work) => work.clientId));
  const isMultiClient = uniqueClients.size > 1;

  const dataUri = isMultiClient
    ? generator.generateMultiClientReceipt(data)
    : generator.generateSingleClientReceipt(data);

  // Generate filename
  const timestamp = new Date().toISOString().slice(0, 10);
  const clientName = isMultiClient
    ? "Multi-Client"
    : clients[works[0]?.clientId]?.name?.replace(/[^a-zA-Z0-9]/g, "-") ||
      "Unknown";

  const filename = `Receipt-${clientName}-${timestamp}.pdf`;

  return { dataUri, filename };
}
