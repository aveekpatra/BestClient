"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Work } from "../lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  formatCurrency,
  formatPhone,
  formatPAN,
  formatAadhar,
  formatDate,
  getWorkTypeLabel,
  getPaymentStatusInfo,
} from "../lib/utils";
import { ClientBalanceHistory } from "./ClientBalanceHistory";
import {
  User,
  Phone,
  Mail,
  MapPin,
  CreditCard,
  FileText,
  Edit,
  Trash2,
  Calendar,
  IndianRupee,
  History,
  AlertTriangle,
  Clock,
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  MoreHorizontal,
} from "lucide-react";

interface ClientDetailsProps {
  clientId: Id<"clients">;
  onEdit?: () => void;
  onDelete?: () => void;
  onClose?: () => void;
}

export function ClientDetails({
  clientId,
  onEdit,
  onDelete,
  onClose,
}: ClientDetailsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "overview" | "history" | "balance"
  >("overview");

  const client = useQuery(api.clients.getClientById, { id: clientId });
  const clientWorks = useQuery(api.works.getWorksByClient, { clientId });
  const deleteClient = useMutation(api.clients.deleteClient);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteClient({ id: clientId });
      onDelete?.();
    } catch (error) {
      console.error("Failed to delete client:", error);
      // TODO: Show error message
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
    }
  };

  if (client === undefined) {
    return <ClientDetailsSkeleton />;
  }

  if (client === null) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
        <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-lg mx-auto mb-4">
          <AlertTriangle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Client not found
        </h3>
        <p className="text-gray-500">
          This client may have been deleted or doesn't exist.
        </p>
      </div>
    );
  }

  const getBalanceInfo = (balance: number) => {
    if (balance > 0) {
      return {
        label: "Client Owes",
        color: "text-green-600",
        bgColor: "bg-green-50",
        iconColor: "text-green-600",
      };
    } else if (balance < 0) {
      return {
        label: "You Owe",
        color: "text-red-600",
        bgColor: "bg-red-50",
        iconColor: "text-red-600",
      };
    } else {
      return {
        label: "Balanced",
        color: "text-gray-600",
        bgColor: "bg-gray-50",
        iconColor: "text-gray-600",
      };
    }
  };

  const balanceInfo = getBalanceInfo(client.balance);

  // Helper function to check if work is overdue (unpaid/partial after 30 days)
  const isWorkOverdue = (work: Work) => {
    if (work.paymentStatus === "paid") return false;

    const workDate = new Date(
      work.transactionDate.split("/").reverse().join("-"),
    );
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    return workDate < thirtyDaysAgo;
  };

  // Calculate running balance for work history
  const getWorkHistoryWithRunningBalance = () => {
    if (!clientWorks) return [];

    // Sort works by date (oldest first) for running balance calculation
    const sortedWorks = [...clientWorks].sort((a, b) => {
      const dateA = new Date(a.transactionDate.split("/").reverse().join("-"));
      const dateB = new Date(b.transactionDate.split("/").reverse().join("-"));
      return dateA.getTime() - dateB.getTime();
    });

    let runningBalance = 0;
    return sortedWorks
      .map((work) => {
        const workBalance = work.totalPrice - work.paidAmount;
        runningBalance += workBalance;

        return {
          ...work,
          workBalance,
          runningBalance,
          isOverdue: isWorkOverdue(work),
        };
      })
      .reverse(); // Show newest first in the table
  };

  const workHistoryWithBalance = getWorkHistoryWithRunningBalance();
  const overdueWorks = workHistoryWithBalance.filter((work) => work.isOverdue);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {onClose && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
          )}
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 bg-gray-100 rounded-lg text-lg font-medium text-gray-600">
              {client.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                {client.name}
              </h1>
              <p className="text-sm text-gray-500">
                Client since {formatDate(new Date(client.createdAt))}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={onEdit}
            className="border-gray-200"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setShowDeleteDialog(true)}
            className="h-8 w-8 text-gray-600 hover:text-red-600 hover:bg-red-50"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Balance Overview */}
      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`flex items-center justify-center w-12 h-12 ${balanceInfo.bgColor} rounded-lg`}
            >
              <IndianRupee className={`h-6 w-6 ${balanceInfo.iconColor}`} />
            </div>
            <div>
              <p className="text-sm text-gray-500">{balanceInfo.label}</p>
              <p className={`text-2xl font-semibold ${balanceInfo.color}`}>
                {formatCurrency(Math.abs(client.balance))}
              </p>
            </div>
          </div>
          <div className="text-right space-y-2">
            <Badge
              variant={client.balance === 0 ? "secondary" : "default"}
              className={
                client.balance === 0
                  ? "bg-gray-100 text-gray-600"
                  : "bg-gray-900 text-white"
              }
            >
              {client.balance > 0
                ? "Receivable"
                : client.balance < 0
                  ? "Payable"
                  : "Clear"}
            </Badge>
            {overdueWorks.length > 0 && (
              <div className="flex items-center gap-1 text-orange-600 text-sm">
                <AlertTriangle className="h-4 w-4" />
                <span>{overdueWorks.length} overdue</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
        {[
          { id: "overview", label: "Overview" },
          { id: "history", label: "Work History" },
          { id: "balance", label: "Balance History" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all duration-200 ${
              activeTab === tab.id
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === "overview" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Personal Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Calendar className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Date of Birth</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.dateOfBirth}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                <div>
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="text-sm font-medium text-gray-900">
                    {client.address}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <Phone className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Contact Information
              </h3>
            </div>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="text-sm font-medium text-gray-900">
                    {formatPhone(client.phone)}
                  </p>
                </div>
              </div>

              {client.email ? (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900">
                      {client.email}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="text-sm text-gray-400">No email provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <FileText className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">Documents</h3>
            </div>
            <div className="space-y-4">
              {client.panNumber ? (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="text-sm font-medium font-mono text-gray-900">
                      {formatPAN(client.panNumber)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">PAN Number</p>
                    <p className="text-sm text-gray-400">Not provided</p>
                  </div>
                </div>
              )}

              {client.aadharNumber ? (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Aadhar Number</p>
                    <p className="text-sm font-medium font-mono text-gray-900">
                      {formatAadhar(client.aadharNumber)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-sm text-gray-500">Aadhar Number</p>
                    <p className="text-sm text-gray-400">Not provided</p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Business Information */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-gray-500" />
              <h3 className="text-lg font-medium text-gray-900">
                Business Information
              </h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-500 mb-2">Usual Work Type</p>
                <Badge variant="outline" className="border-gray-200">
                  {getWorkTypeLabel(client.usualWorkType)}
                </Badge>
              </div>

              <div>
                <p className="text-sm text-gray-500">Total Transactions</p>
                <p className="text-sm font-medium text-gray-900">
                  {clientWorks?.length || 0} completed
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === "history" && (
        <div className="bg-white border border-gray-200 rounded-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <History className="h-5 w-5 text-gray-500" />
                <h3 className="text-lg font-medium text-gray-900">
                  Work History
                </h3>
                {clientWorks && (
                  <Badge
                    variant="secondary"
                    className="bg-gray-100 text-gray-600"
                  >
                    {clientWorks.length} transactions
                  </Badge>
                )}
              </div>
              {overdueWorks.length > 0 && (
                <Badge
                  variant="destructive"
                  className="flex items-center gap-1"
                >
                  <AlertTriangle className="h-3 w-3" />
                  <span>{overdueWorks.length} overdue</span>
                </Badge>
              )}
            </div>
          </div>

          <div className="p-6">
            {clientWorks === undefined ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : clientWorks === null || clientWorks.length === 0 ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4">
                  <History className="h-8 w-8 text-gray-400" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  No work history
                </h4>
                <p className="text-gray-500">
                  Work transactions will appear here once created
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="border-gray-200">
                      <TableHead className="font-medium">Date</TableHead>
                      <TableHead className="font-medium">Description</TableHead>
                      <TableHead className="font-medium">Work Type</TableHead>
                      <TableHead className="font-medium text-right">
                        Total
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Paid
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Balance
                      </TableHead>
                      <TableHead className="font-medium text-right">
                        Running Total
                      </TableHead>
                      <TableHead className="font-medium">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {workHistoryWithBalance.map((work) => {
                      const statusInfo = getPaymentStatusInfo(
                        work.paymentStatus,
                      );
                      return (
                        <TableRow
                          key={work._id}
                          className={`border-gray-200 ${work.isOverdue ? "bg-orange-50 border-l-4 border-l-orange-400" : ""}`}
                        >
                          <TableCell className="py-4">
                            <div className="flex items-center gap-2">
                              {work.isOverdue && (
                                <AlertTriangle className="h-4 w-4 text-orange-500" />
                              )}
                              <span className="text-sm text-gray-900">
                                {work.transactionDate}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <div>
                              <p className="text-sm text-gray-900">
                                {work.description}
                              </p>
                              {work.isOverdue && (
                                <div className="flex items-center gap-1 mt-1">
                                  <Clock className="h-3 w-3 text-orange-600" />
                                  <span className="text-xs text-orange-600">
                                    Overdue
                                  </span>
                                </div>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant="outline"
                              className="border-gray-200"
                            >
                              {getWorkTypeLabel(work.workType)}
                            </Badge>
                          </TableCell>
                          <TableCell className="py-4 text-right text-sm text-gray-900">
                            {formatCurrency(work.totalPrice)}
                          </TableCell>
                          <TableCell className="py-4 text-right text-sm text-gray-900">
                            {formatCurrency(work.paidAmount)}
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {work.workBalance > 0 ? (
                                <TrendingUp className="h-3 w-3 text-green-600" />
                              ) : work.workBalance < 0 ? (
                                <TrendingDown className="h-3 w-3 text-red-600" />
                              ) : null}
                              <span
                                className={`text-sm ${work.workBalance > 0 ? "text-green-600" : work.workBalance < 0 ? "text-red-600" : "text-gray-600"}`}
                              >
                                {formatCurrency(Math.abs(work.workBalance))}
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="py-4 text-right">
                            <span
                              className={`text-sm font-medium ${work.runningBalance > 0 ? "text-green-600" : work.runningBalance < 0 ? "text-red-600" : "text-gray-600"}`}
                            >
                              {formatCurrency(Math.abs(work.runningBalance))}
                            </span>
                          </TableCell>
                          <TableCell className="py-4">
                            <Badge
                              variant={
                                work.paymentStatus === "paid"
                                  ? "default"
                                  : "secondary"
                              }
                              className={
                                work.paymentStatus === "paid"
                                  ? "bg-green-100 text-green-800"
                                  : "bg-gray-100 text-gray-600"
                              }
                            >
                              {statusInfo.label}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === "balance" && <ClientBalanceHistory clientId={clientId} />}

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.name}? This action cannot
              be undone. All associated work records must be deleted first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Client"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ClientDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <div className="flex items-center gap-3">
            <Skeleton className="h-12 w-12 rounded-lg" />
            <div>
              <Skeleton className="h-7 w-48" />
              <Skeleton className="h-4 w-32 mt-2" />
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-8 w-8" />
        </div>
      </div>

      <Skeleton className="h-24 w-full rounded-lg" />
      <Skeleton className="h-12 w-full rounded-lg" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white border border-gray-200 rounded-lg p-6"
          >
            <Skeleton className="h-6 w-32 mb-4" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
