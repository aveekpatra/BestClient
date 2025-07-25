"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Work, Client } from "../lib/types";
import { formatCurrency, getWorkTypeLabel } from "../lib/utils";
import { generateReceiptPDF } from "../lib/pdfGenerator";
import PaymentStatusBadge from "./PaymentStatusBadge";
import ReceiptPreview from "./ReceiptPreview";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "./ui/card";
import { Button } from "./ui/button";
import { Separator } from "./ui/separator";
import { Badge } from "./ui/badge";
import { FileText, Download, X, Eye } from "lucide-react";

interface ReceiptGeneratorProps {
  selectedWorkIds: Id<"works">[];
  onClose: () => void;
  onGenerateReceipt: () => void;
}

interface GroupedWork {
  client: Client;
  works: Work[];
  totalAmount: number;
  totalPaid: number;
  totalBalance: number;
}

export default function ReceiptGenerator({
  selectedWorkIds,
  onClose,
  onGenerateReceipt,
}: ReceiptGeneratorProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  // Fetch data
  const works = useQuery(api.works.getWorks, {}) as Work[] | undefined;
  const clientsData = useQuery(api.clients.getClients, {});

  // Create client lookup map
  const clientMap = useMemo(() => {
    if (!clientsData?.clients) return {};
    return clientsData.clients.reduce((map, client) => {
      map[client._id] = client;
      return map;
    }, {} as Record<Id<"clients">, Client>);
  }, [clientsData]);

  // Get selected works and group by client
  const groupedWorks = useMemo(() => {
    if (!works || !clientMap) return [];

    const selectedWorks = works.filter(work => selectedWorkIds.includes(work._id));
    
    // Group works by client
    const grouped = selectedWorks.reduce((acc, work) => {
      const client = clientMap[work.clientId];
      if (!client) return acc;

      const clientId = client._id;
      if (!acc[clientId]) {
        acc[clientId] = {
          client,
          works: [],
          totalAmount: 0,
          totalPaid: 0,
          totalBalance: 0,
        };
      }

      acc[clientId].works.push(work);
      acc[clientId].totalAmount += work.totalPrice;
      acc[clientId].totalPaid += work.paidAmount;
      acc[clientId].totalBalance += (work.totalPrice - work.paidAmount);

      return acc;
    }, {} as Record<Id<"clients">, GroupedWork>);

    return Object.values(grouped);
  }, [works, clientMap, selectedWorkIds]);

  const handleGenerateReceipt = async () => {
    setIsGenerating(true);
    try {
      const selectedWorks = works?.filter(work => selectedWorkIds.includes(work._id)) || [];
      const { dataUri, filename } = generateReceiptPDF(selectedWorks, clientMap);
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      onGenerateReceipt();
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const handleDownloadFromPreview = async () => {
    setIsGenerating(true);
    try {
      const selectedWorks = works?.filter(work => selectedWorkIds.includes(work._id)) || [];
      const { dataUri, filename } = generateReceiptPDF(selectedWorks, clientMap);
      
      // Download the PDF
      const link = document.createElement('a');
      link.href = dataUri;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setShowPreview(false);
    } finally {
      setIsGenerating(false);
    }
  };

  if (!works || !clientsData?.clients) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Loading...</CardTitle>
        </CardHeader>
      </Card>
    );
  }

  if (selectedWorkIds.length === 0) {
    return (
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Receipt Generator</CardTitle>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
            <p>No works selected for receipt generation.</p>
            <p className="text-sm mt-2">Select works from the list above to generate receipts.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const totalWorks = selectedWorkIds.length;
  const totalClients = groupedWorks.length;
  const grandTotal = groupedWorks.reduce((sum, group) => sum + group.totalAmount, 0);
  const grandPaid = groupedWorks.reduce((sum, group) => sum + group.totalPaid, 0);
  const grandBalance = grandTotal - grandPaid;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Receipt Generator
          </CardTitle>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <Badge variant="secondary">{totalWorks} works selected</Badge>
          <Badge variant="secondary">{totalClients} client{totalClients !== 1 ? 's' : ''}</Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Summary */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h3 className="font-semibold mb-3">Receipt Summary</h3>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600">Total Amount</p>
              <p className="font-semibold text-lg">{formatCurrency(grandTotal)}</p>
            </div>
            <div>
              <p className="text-gray-600">Total Paid</p>
              <p className="font-semibold text-lg text-green-600">{formatCurrency(grandPaid)}</p>
            </div>
            <div>
              <p className="text-gray-600">Balance Due</p>
              <p className={`font-semibold text-lg ${grandBalance > 0 ? 'text-red-600' : grandBalance < 0 ? 'text-green-600' : ''}`}>
                {formatCurrency(Math.abs(grandBalance))}
                {grandBalance < 0 && ' (Overpaid)'}
              </p>
            </div>
          </div>
        </div>

        {/* Grouped Works Preview */}
        <div className="space-y-4">
          <h3 className="font-semibold">Works by Client</h3>
          {groupedWorks.map((group) => (
            <div key={group.client._id} className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h4 className="font-medium">{group.client.name}</h4>
                  <p className="text-sm text-gray-600">{group.client.address}</p>
                  {group.client.phone && (
                    <p className="text-sm text-gray-600">Phone: {group.client.phone}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">{group.works.length} work{group.works.length !== 1 ? 's' : ''}</p>
                  <p className="font-semibold">{formatCurrency(group.totalAmount)}</p>
                </div>
              </div>

              <div className="space-y-2">
                {group.works.map((work) => (
                  <div key={work._id} className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded text-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{work.transactionDate}</span>
                        <Badge variant="outline" className="text-xs">
                          {getWorkTypeLabel(work.workType)}
                        </Badge>
                        <PaymentStatusBadge status={work.paymentStatus} />
                      </div>
                      <p className="text-gray-600 mt-1">{work.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <p className="font-medium">{formatCurrency(work.totalPrice)}</p>
                      <p className="text-xs text-gray-600">
                        Paid: {formatCurrency(work.paidAmount)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              <Separator className="my-3" />
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
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-sm text-gray-600">
            {totalClients === 1 ? 
              `Single client receipt with ${totalWorks} work${totalWorks !== 1 ? 's' : ''}` :
              `Multi-client receipt with ${totalWorks} works across ${totalClients} clients`
            }
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button 
              variant="outline"
              onClick={handlePreview}
              className="flex items-center gap-2"
            >
              <Eye className="h-4 w-4" />
              Preview
            </Button>
            <Button 
              onClick={handleGenerateReceipt}
              disabled={isGenerating}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              {isGenerating ? 'Generating...' : 'Generate PDF'}
            </Button>
          </div>
        </div>

        {/* Receipt Preview Modal */}
        {works && (
          <ReceiptPreview
            isOpen={showPreview}
            onClose={() => setShowPreview(false)}
            works={works.filter(work => selectedWorkIds.includes(work._id))}
            clients={clientMap}
            onDownload={handleDownloadFromPreview}
            isGenerating={isGenerating}
          />
        )}
      </CardContent>
    </Card>
  );
}