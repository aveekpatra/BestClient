"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Badge } from "./ui/badge";
import { Button } from "./ui/button";
import { Skeleton } from "./ui/skeleton";
import { Alert, AlertDescription } from "./ui/alert";
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
  formatDate,
  getWorkTypeLabel,
  getPaymentStatusInfo,
} from "../lib/utils";
import {
  History,
  TrendingUp,
  TrendingDown,
  Minus,
  Plus,
  Calendar,
  FileText,
  CheckCircle,
} from "lucide-react";

interface ClientBalanceHistoryProps {
  clientId: Id<"clients">;
}

export function ClientBalanceHistory({ clientId }: ClientBalanceHistoryProps) {
  const [showFullHistory, setShowFullHistory] = useState(false);

  const balanceTimeline = useQuery(
    api.balanceHistory.getClientBalanceTimeline,
    {
      clientId,
      limit: showFullHistory ? 200 : 20,
    },
  );

  const balanceHistory = useQuery(api.balanceHistory.getClientBalanceHistory, {
    clientId,
    limit: showFullHistory ? 100 : 10,
  });

  if (balanceTimeline === undefined || balanceHistory === undefined) {
    return <BalanceHistorySkeleton />;
  }

  if (balanceTimeline === null || balanceHistory === null) {
    return (
      <Alert>
        <AlertDescription>Failed to load balance history.</AlertDescription>
      </Alert>
    );
  }

  const getChangeIcon = (changeType: string, balanceChange: number) => {
    const iconClass = "h-4 w-4";

    if (balanceChange > 0) {
      return <TrendingDown className={`${iconClass} text-red-600`} />;
    } else if (balanceChange < 0) {
      return <TrendingUp className={`${iconClass} text-green-600`} />;
    } else {
      return <Minus className={`${iconClass} text-gray-400`} />;
    }
  };

  const getChangeTypeLabel = (changeType: string) => {
    switch (changeType) {
      case "work_created":
        return "Work Added";
      case "work_updated":
        return "Work Updated";
      case "work_deleted":
        return "Work Deleted";
      case "manual_adjustment":
        return "Manual Adjustment";
      case "balance_correction":
        return "Balance Correction";
      default:
        return changeType;
    }
  };

  const getChangeTypeColor = (changeType: string) => {
    switch (changeType) {
      case "work_created":
        return "bg-green-100 text-green-800";
      case "work_updated":
        return "bg-blue-100 text-blue-800";
      case "work_deleted":
        return "bg-red-100 text-red-800";
      case "manual_adjustment":
        return "bg-yellow-100 text-yellow-800";
      case "balance_correction":
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return "text-red-600"; // Client owes = debt = red
    if (balance < 0) return "text-green-600"; // Overpaid = credit = green
    return "text-gray-600";
  };

  return (
    <div className="space-y-6">
      {/* Balance Timeline Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Balance Timeline</span>
            <Badge variant="secondary">
              {balanceTimeline.totalEntries} entries
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceTimeline.timeline.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No balance history found</p>
              <p className="text-sm">Balance changes will appear here</p>
            </div>
          ) : (
            <div className="space-y-4">
              {/* Current Balance */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <CheckCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">Current Balance</p>
                    <p className="text-sm text-gray-500">As of now</p>
                  </div>
                </div>
                <div
                  className={`text-right ${getBalanceColor(balanceTimeline.currentBalance)}`}
                >
                  <p className="text-lg font-bold">
                    {formatCurrency(-balanceTimeline.currentBalance)}
                  </p>
                  <p className="text-xs">
                    {balanceTimeline.currentBalance > 0
                      ? "Client Owes"
                      : balanceTimeline.currentBalance < 0
                        ? "You Owe"
                        : "Balanced"}
                  </p>
                </div>
              </div>

              {/* Timeline */}
              <div className="space-y-3">
                {balanceTimeline.timeline
                  .slice(0, showFullHistory ? undefined : 10)
                  .map((entry) => (
                    <div
                      key={entry._id}
                      className="flex items-start space-x-3 p-3 border rounded-lg"
                    >
                      <div className="flex-shrink-0 mt-1">
                        {getChangeIcon(entry.changeType, entry.balanceChange)}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge
                              className={getChangeTypeColor(entry.changeType)}
                            >
                              {getChangeTypeLabel(entry.changeType)}
                            </Badge>
                            <span className="text-sm text-gray-500">
                              {formatDate(new Date(entry.createdAt))}
                            </span>
                          </div>

                          <div className="text-right">
                            <div
                              className={`font-medium ${getBalanceColor(entry.runningBalance)}`}
                            >
                              {formatCurrency(-entry.runningBalance)}
                            </div>
                            {entry.balanceChange !== 0 && (
                              <div
                                className={`text-xs ${entry.balanceChange > 0 ? "text-red-600" : "text-green-600"}`}
                              >
                                {entry.balanceChange > 0 ? "-" : "+"}
                                {formatCurrency(Math.abs(entry.balanceChange))}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="text-sm text-gray-600 mt-1">
                          {entry.description}
                        </p>

                        {entry.workDetails && (
                          <div className="mt-2 p-2 bg-gray-50 rounded text-xs">
                            <div className="flex items-center justify-between">
                              <span className="font-medium">
                                {entry.workDetails.description}
                              </span>
                              <div className="flex flex-wrap gap-1">
                                {entry.workDetails.workTypes.map((workType) => (
                                  <Badge
                                    key={workType}
                                    variant="outline"
                                    className="text-xs"
                                  >
                                    {getWorkTypeLabel(workType)}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                            <div className="flex items-center justify-between mt-1 text-gray-500">
                              <span>
                                Total:{" "}
                                {formatCurrency(entry.workDetails.totalPrice)}
                              </span>
                              <span>
                                Paid:{" "}
                                {formatCurrency(entry.workDetails.paidAmount)}
                              </span>
                              <Badge
                                className={
                                  getPaymentStatusInfo(
                                    entry.workDetails.paymentStatus,
                                  ).colorClass
                                }
                              >
                                {
                                  getPaymentStatusInfo(
                                    entry.workDetails.paymentStatus,
                                  ).label
                                }
                              </Badge>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
              </div>

              {balanceTimeline.timeline.length > 10 && (
                <div className="text-center">
                  <Button
                    variant="outline"
                    onClick={() => setShowFullHistory(!showFullHistory)}
                  >
                    {showFullHistory
                      ? "Show Less"
                      : `Show All ${balanceTimeline.totalEntries} Entries`}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detailed History Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5" />
            <span>Detailed History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {balanceHistory.history.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No detailed history found</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Previous</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>New Balance</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {balanceHistory.history.map((entry) => (
                  <TableRow key={entry._id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="h-4 w-4 text-gray-400" />
                        <span className="text-sm">
                          {formatDate(new Date(entry.createdAt))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getChangeTypeColor(entry.changeType)}>
                        {getChangeTypeLabel(entry.changeType)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div>
                        <p className="text-sm">{entry.description}</p>
                        {entry.workDetails && (
                          <p className="text-xs text-gray-500 mt-1">
                            Work: {entry.workDetails.description}
                          </p>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getBalanceColor(entry.previousBalance)}>
                        {formatCurrency(-entry.previousBalance)}
                      </span>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        {entry.balanceChange > 0 ? (
                          <Minus className="h-3 w-3 text-red-600" />
                        ) : entry.balanceChange < 0 ? (
                          <Plus className="h-3 w-3 text-green-600" />
                        ) : (
                          <Minus className="h-3 w-3 text-gray-400" />
                        )}
                        <span
                          className={
                            entry.balanceChange > 0
                              ? "text-red-600"
                              : entry.balanceChange < 0
                                ? "text-green-600"
                                : "text-gray-600"
                          }
                        >
                          {formatCurrency(Math.abs(entry.balanceChange))}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={getBalanceColor(entry.newBalance)}>
                        {formatCurrency(-entry.newBalance)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {balanceHistory.hasMore && (
            <div className="text-center mt-4">
              <Button variant="outline" size="sm">
                Load More History
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function BalanceHistorySkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-16 w-full" />
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
