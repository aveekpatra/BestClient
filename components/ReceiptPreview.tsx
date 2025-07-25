"use client";


import { Work, Client } from "../lib/types";
import { formatCurrency, getWorkTypeLabel } from "../lib/utils";
import PaymentStatusBadge from "./PaymentStatusBadge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { Download, Eye } from "lucide-react";

interface ReceiptPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  works: Work[];
  clients: Record<string, Client>;
  onDownload: () => void;
  isGenerating?: boolean;
}

interface GroupedWork {
  client: Client;
  works: Work[];
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

export default function ReceiptPreview({
  isOpen,
  onClose,
  works,
  clients,
  onDownload,
  isGenerating = false,
}: ReceiptPreviewProps) {
  // Group works by client
  const groupedWorks: GroupedWork[] = works.reduce((acc, work) => {
    const client = clients[work.clientId];
    if (!client) return acc;

    let group = acc.find(g => g.client._id === client._id);
    if (!group) {
      group = {
        client,
        works: [],
        totalAmount: 0,
        totalPaid: 0,
        totalBalance: 0,
      };
      acc.push(group);
    }

    group.works.push(work);
    group.totalAmount += work.totalPrice;
    group.totalPaid += work.paidAmount;
    group.totalBalance += (work.totalPrice - work.paidAmount);

    return acc;
  }, [] as GroupedWork[]);

  const grandTotal = works.reduce((sum, work) => sum + work.totalPrice, 0);
  const grandPaid = works.reduce((sum, work) => sum + work.paidAmount, 0);
  const grandBalance = grandTotal - grandPaid;

  const isMultiClient = groupedWorks.length > 1;
  const receiptDate = new Date().toLocaleDateString('en-IN');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Receipt Preview
            </DialogTitle>
            <Button
              onClick={onDownload}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Download PDF'}
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Business Header */}
          <div className="text-center border-b pb-4">
            <h1 className="text-2xl font-bold">Your Business Name</h1>
            <p className="text-sm text-gray-600">Your Business Address, City, State - PIN</p>
            <p className="text-sm text-gray-600">Phone: +91-XXXXXXXXXX | Email: your.email@business.com</p>
          </div>

          {/* Receipt Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-xl font-bold">RECEIPT</h2>
              <p className="text-sm text-gray-600">Receipt No: RCP-{Date.now().toString().slice(-8)}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Date: {receiptDate}</p>
              {isMultiClient && (
                <Badge variant="secondary" className="mt-1">Multi-Client Receipt</Badge>
              )}
            </div>
          </div>

          {/* Client Groups */}
          {groupedWorks.map((group, groupIndex) => (
            <div key={group.client._id} className="space-y-4">
              {/* Client Info */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold">Bill To:</h3>
                <div className="mt-2 text-sm">
                  <p className="font-medium">{group.client.name}</p>
                  <p>{group.client.address}</p>
                  <p>Phone: {group.client.phone}</p>
                  {group.client.email && <p>Email: {group.client.email}</p>}
                  {group.client.panNumber && <p>PAN: {group.client.panNumber}</p>}
                </div>
              </div>

              {/* Works Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr className="text-left text-sm">
                      <th className="p-3 font-semibold">Date</th>
                      <th className="p-3 font-semibold">Description</th>
                      <th className="p-3 font-semibold">Work Type</th>
                      <th className="p-3 font-semibold">Status</th>
                      <th className="p-3 font-semibold text-right">Amount</th>
                      <th className="p-3 font-semibold text-right">Paid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.works.map((work, index) => (
                      <tr key={work._id} className={index % 2 === 1 ? "bg-gray-50" : ""}>
                        <td className="p-3 text-sm">{work.transactionDate}</td>
                        <td className="p-3 text-sm">{work.description}</td>
                        <td className="p-3 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {getWorkTypeLabel(work.workType)}
                          </Badge>
                        </td>
                        <td className="p-3 text-sm">
                          <PaymentStatusBadge status={work.paymentStatus} />
                        </td>
                        <td className="p-3 text-sm text-right font-medium">
                          {formatCurrency(work.totalPrice)}
                        </td>
                        <td className="p-3 text-sm text-right">
                          {formatCurrency(work.paidAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Client Totals */}
              <div className="bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="font-medium">Client Total:</span>
                  <div className="text-right">
                    <p className="font-semibold">{formatCurrency(group.totalAmount)}</p>
                    <p className="text-xs text-gray-600">
                      Paid: {formatCurrency(group.totalPaid)} | 
                      Balance: {formatCurrency(Math.abs(group.totalBalance))}
                      {group.totalBalance < 0 && ' (Overpaid)'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Separator between clients */}
              {isMultiClient && groupIndex < groupedWorks.length - 1 && (
                <Separator className="my-6" />
              )}
            </div>
          ))}

          {/* Grand Total for multi-client receipts */}
          {isMultiClient && (
            <div className="border-t-2 pt-4">
              <h3 className="text-lg font-bold text-center mb-4">GRAND TOTAL</h3>
              <div className="bg-blue-50 p-4 rounded-lg">
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div>
                    <p className="text-sm text-gray-600">Total Amount</p>
                    <p className="text-lg font-bold">{formatCurrency(grandTotal)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Paid</p>
                    <p className="text-lg font-bold text-green-600">{formatCurrency(grandPaid)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Balance Due</p>
                    <p className={`text-lg font-bold ${grandBalance > 0 ? 'text-red-600' : grandBalance < 0 ? 'text-green-600' : ''}`}>
                      {formatCurrency(Math.abs(grandBalance))}
                      {grandBalance < 0 && ' (Overpaid)'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center text-sm text-gray-500 border-t pt-4">
            <p>Thank you for your business!</p>
            <p className="text-xs">This is a computer generated receipt.</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}