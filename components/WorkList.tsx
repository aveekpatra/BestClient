"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Work, WorkType, PaymentStatus, Client } from "../lib/types";
import { formatCurrency, getWorkTypeLabel } from "../lib/utils";
import PaymentStatusBadge from "./PaymentStatusBadge";
import { Badge } from "./ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";

import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Search,
  Filter,
  Plus,
  FileText,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
  Edit,
  MoreHorizontal,
} from "lucide-react";
import { Skeleton } from "./ui/skeleton";

interface WorkFilters {
  clientId?: Id<"clients">;
  workType?: WorkType;
  paymentStatus?: PaymentStatus;
  dateFrom?: string;
  dateTo?: string;
  amountMin?: number;
  amountMax?: number;
  search?: string;
}

interface WorkListProps {
  onAddWork?: () => void;
  onEditWork?: (work: Work) => void;
  onDeleteWork?: (work: Work) => void;
  selectedWorks?: Id<"works">[];
  onWorkSelectionChange?: (workIds: Id<"works">[]) => void;
  showSelection?: boolean;
}

type SortField =
  | "transactionDate"
  | "totalPrice"
  | "paidAmount"
  | "clientName"
  | "workTypes"
  | "paymentStatus";
type SortDirection = "asc" | "desc";

export default function WorkList({
  onAddWork,
  onEditWork,
  onDeleteWork,
  selectedWorks = [],
  onWorkSelectionChange,
  showSelection = false,
}: WorkListProps) {
  const [filters, setFilters] = useState<WorkFilters>({});
  const [sortField, setSortField] = useState<SortField>("transactionDate");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [currentPage, setCurrentPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);

  // Fetch data
  const works = useQuery(api.works.getWorks, {}) as Work[] | undefined;
  const clientsData = useQuery(api.clients.getClients, {});

  // Create client lookup map
  const clientMap = useMemo(() => {
    if (!clientsData?.clients) return {};
    return clientsData.clients.reduce(
      (map, client) => {
        map[client._id] = client;
        return map;
      },
      {} as Record<Id<"clients">, Client>,
    );
  }, [clientsData]);

  // Filter and sort works
  const filteredAndSortedWorks = useMemo(() => {
    if (!works) return [];

    const filtered = works.filter((work) => {
      const client = clientMap[work.clientId];

      // Client filter
      if (filters.clientId && work.clientId !== filters.clientId) return false;

      // Work type filter
      if (filters.workType && !work.workTypes.includes(filters.workType))
        return false;

      // Payment status filter
      if (filters.paymentStatus && work.paymentStatus !== filters.paymentStatus)
        return false;

      // Date range filter
      if (filters.dateFrom && work.transactionDate < filters.dateFrom)
        return false;
      if (filters.dateTo && work.transactionDate > filters.dateTo) return false;

      // Amount range filter
      if (
        filters.amountMin !== undefined &&
        work.totalPrice < filters.amountMin * 100
      )
        return false;
      if (
        filters.amountMax !== undefined &&
        work.totalPrice > filters.amountMax * 100
      )
        return false;

      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const clientName = client?.name.toLowerCase() || "";
        const description = work.description.toLowerCase();
        const workTypes = work.workTypes || ["online-work"];
        const workTypeLabel = workTypes
          .map((wt: string) => getWorkTypeLabel(wt))
          .join(" ")
          .toLowerCase();

        if (
          !clientName.includes(searchTerm) &&
          !description.includes(searchTerm) &&
          !workTypeLabel.includes(searchTerm)
        ) {
          return false;
        }
      }

      return true;
    });

    // Sort
    filtered.sort((a, b) => {
      let aValue: string | number;
      let bValue: string | number;

      switch (sortField) {
        case "transactionDate":
          aValue = a.transactionDate;
          bValue = b.transactionDate;
          break;
        case "totalPrice":
          aValue = a.totalPrice;
          bValue = b.totalPrice;
          break;
        case "paidAmount":
          aValue = a.paidAmount;
          bValue = b.paidAmount;
          break;
        case "clientName":
          aValue = clientMap[a.clientId]?.name || "";
          bValue = clientMap[b.clientId]?.name || "";
          break;
        case "workTypes":
          const aWorkTypes = a.workTypes || ["online-work"];
          const bWorkTypes = b.workTypes || ["online-work"];
          aValue = aWorkTypes
            .map((wt: string) => getWorkTypeLabel(wt))
            .join(", ");
          bValue = bWorkTypes
            .map((wt: string) => getWorkTypeLabel(wt))
            .join(", ");
          break;
        case "paymentStatus":
          aValue = a.paymentStatus;
          bValue = b.paymentStatus;
          break;
        default:
          aValue = a.transactionDate;
          bValue = b.transactionDate;
      }

      if (typeof aValue === "string" && typeof bValue === "string") {
        aValue = aValue.toLowerCase();
        bValue = bValue.toLowerCase();
      }

      if (aValue < bValue) return sortDirection === "asc" ? -1 : 1;
      if (aValue > bValue) return sortDirection === "asc" ? 1 : -1;
      return 0;
    });

    return filtered;
  }, [works, clientMap, filters, sortField, sortDirection]);

  // Pagination
  const total = filteredAndSortedWorks.length;
  const totalPages = Math.ceil(total / pageSize);
  const paginatedWorks = filteredAndSortedWorks.slice(
    currentPage * pageSize,
    (currentPage + 1) * pageSize,
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
    setCurrentPage(0);
  };

  const handleFilterChange = (
    key: keyof WorkFilters,
    value: string | number | undefined,
  ) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
    setCurrentPage(0);
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(0);
  };

  const handleWorkSelection = (workId: Id<"works">, selected: boolean) => {
    if (!onWorkSelectionChange) return;

    if (selected) {
      onWorkSelectionChange([...selectedWorks, workId]);
    } else {
      onWorkSelectionChange(selectedWorks.filter((id) => id !== workId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (!onWorkSelectionChange) return;

    if (selected) {
      onWorkSelectionChange(paginatedWorks.map((work) => work._id));
    } else {
      onWorkSelectionChange([]);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  if (!works || !clientsData?.clients) {
    return (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex items-center justify-between">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-32" />
        </div>

        {/* Table Skeleton */}
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-16 w-full" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
            <FileText className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Work Transactions
            </h1>
            <p className="text-sm text-gray-500">{total} total transactions</p>
          </div>
        </div>
        {onAddWork && (
          <Button
            onClick={onAddWork}
            className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
          >
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by client, description, or work type..."
            value={filters.search || ""}
            onChange={(e) => handleFilterChange("search", e.target.value)}
            className="pl-10 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <Select
            value={`${filters.workType || "all"}-${filters.paymentStatus || "all"}-${filters.clientId || "all"}`}
            onValueChange={(value) => {
              // Split by the last two "-" to handle work types with hyphens
              const parts = value.split("-");
              const clientId = parts[parts.length - 1]; // Last part
              const paymentStatus = parts[parts.length - 2]; // Second to last part
              const workType = parts.slice(0, parts.length - 2).join("-"); // Everything before the last two parts

              handleFilterChange(
                "workType",
                workType === "all" ? undefined : (workType as WorkType),
              );
              handleFilterChange(
                "paymentStatus",
                paymentStatus === "all"
                  ? undefined
                  : (paymentStatus as PaymentStatus),
              );
              handleFilterChange(
                "clientId",
                clientId === "all" ? undefined : (clientId as Id<"clients">),
              );
            }}
          >
            <SelectTrigger className="w-auto border-gray-200">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all-all-all">All Transactions</SelectItem>

              {/* Payment Status Filters */}
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
                Payment Status
              </div>
              <SelectItem value="all-paid-all">Paid</SelectItem>
              <SelectItem value="all-partial-all">Partial</SelectItem>
              <SelectItem value="all-unpaid-all">Unpaid</SelectItem>

              {/* Work Type Filters */}
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b border-t mt-1">
                Work Type
              </div>
              <SelectItem value="online-work-all-all">Online Work</SelectItem>
              <SelectItem value="health-insurance-all-all">
                Health Insurance
              </SelectItem>
              <SelectItem value="life-insurance-all-all">
                Life Insurance
              </SelectItem>
              <SelectItem value="income-tax-all-all">Income Tax</SelectItem>
              <SelectItem value="p-tax-all-all">P-Tax</SelectItem>
              <SelectItem value="mutual-funds-all-all">Mutual Funds</SelectItem>
              <SelectItem value="others-all-all">Others</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select
            value={`${sortField}-${sortDirection}`}
            onValueChange={(value) => {
              const [field, direction] = value.split("-") as [
                SortField,
                SortDirection,
              ];
              setSortField(field);
              setSortDirection(direction);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-40 border-gray-200">
              <ChevronUp className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="transactionDate-desc">Newest First</SelectItem>
              <SelectItem value="transactionDate-asc">Oldest First</SelectItem>
              <SelectItem value="totalPrice-desc">Amount High-Low</SelectItem>
              <SelectItem value="totalPrice-asc">Amount Low-High</SelectItem>
              <SelectItem value="clientName-asc">Client A-Z</SelectItem>
              <SelectItem value="clientName-desc">Client Z-A</SelectItem>
              <SelectItem value="workTypes-asc">Work Type A-Z</SelectItem>
              <SelectItem value="paymentStatus-asc">Status A-Z</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters - only show if filters are active */}
          {(filters.search ||
            filters.workType ||
            filters.paymentStatus ||
            filters.clientId ||
            filters.dateFrom ||
            filters.dateTo ||
            filters.amountMin ||
            filters.amountMax ||
            sortField !== "transactionDate" ||
            sortDirection !== "desc") && (
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFilters}
              className="text-gray-500 hover:text-gray-700"
            >
              Clear
            </Button>
          )}
        </div>
      </div>

      {/* Results */}
      {!works || works.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4">
            <FileText className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No work transactions found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or add a new work transaction
          </p>
          {onAddWork && (
            <Button
              onClick={onAddWork}
              className="bg-gray-900 hover:bg-gray-800"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add your first work
            </Button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table View */}
          <div className="hidden lg:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50/50">
                  {showSelection && (
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          paginatedWorks.length > 0 &&
                          paginatedWorks.every((work) =>
                            selectedWorks.includes(work._id),
                          )
                        }
                        onChange={(e) => handleSelectAll(e.target.checked)}
                        className="rounded border-gray-300"
                      />
                    </TableHead>
                  )}
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    onClick={() => handleSort("transactionDate")}
                  >
                    Date {getSortIcon("transactionDate")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    onClick={() => handleSort("clientName")}
                  >
                    Client {getSortIcon("clientName")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    onClick={() => handleSort("workTypes")}
                  >
                    Work Type {getSortIcon("workTypes")}
                  </TableHead>
                  <TableHead className="font-medium">Description</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium text-right"
                    onClick={() => handleSort("totalPrice")}
                  >
                    Total {getSortIcon("totalPrice")}
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium text-right"
                    onClick={() => handleSort("paidAmount")}
                  >
                    Paid {getSortIcon("paidAmount")}
                  </TableHead>
                  <TableHead className="font-medium text-right">
                    Balance
                  </TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    onClick={() => handleSort("paymentStatus")}
                  >
                    Status {getSortIcon("paymentStatus")}
                  </TableHead>
                  <TableHead className="font-medium w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedWorks.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={showSelection ? 10 : 9}
                      className="text-center py-8 text-gray-500"
                    >
                      No work transactions found
                    </TableCell>
                  </TableRow>
                ) : (
                  paginatedWorks.map((work) => {
                    const client = clientMap[work.clientId];
                    const balance = work.totalPrice - work.paidAmount;

                    return (
                      <TableRow
                        key={work._id}
                        className="border-gray-200 hover:bg-gray-50 transition-colors"
                      >
                        {showSelection && (
                          <TableCell className="py-4">
                            <input
                              type="checkbox"
                              checked={selectedWorks.includes(work._id)}
                              onChange={(e) =>
                                handleWorkSelection(work._id, e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                          </TableCell>
                        )}
                        <TableCell className="py-4">
                          <div className="text-sm text-gray-900">
                            {work.transactionDate}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                              {client?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <div className="font-medium text-gray-900">
                              {client?.name || "Unknown Client"}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="text-sm text-gray-900">
                            <div className="flex flex-wrap gap-1">
                              {work.workTypes.map((workType) => (
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
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="max-w-xs truncate text-sm text-gray-900">
                            {work.description}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(work.totalPrice)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div className="font-medium text-gray-900">
                            {formatCurrency(work.paidAmount)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <div
                            className={`font-medium ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-gray-600"}`}
                          >
                            {formatCurrency(balance)}
                          </div>
                        </TableCell>
                        <TableCell className="py-4">
                          <PaymentStatusBadge status={work.paymentStatus} />
                        </TableCell>
                        <TableCell className="py-4">
                          <div className="flex items-center gap-1">
                            {onEditWork && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onEditWork(work)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                            {onDeleteWork && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => onDeleteWork(work)}
                                className="h-8 w-8 p-0 hover:bg-gray-100"
                              >
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                )}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="lg:hidden space-y-3">
            {paginatedWorks.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No work transactions found
              </div>
            ) : (
              paginatedWorks.map((work) => {
                const client = clientMap[work.clientId];
                const balance = work.totalPrice - work.paidAmount;

                return (
                  <div
                    key={work._id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {showSelection && (
                            <input
                              type="checkbox"
                              checked={selectedWorks.includes(work._id)}
                              onChange={(e) =>
                                handleWorkSelection(work._id, e.target.checked)
                              }
                              className="rounded border-gray-300"
                            />
                          )}
                          <div className="flex items-center gap-3">
                            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-lg text-xs font-medium text-gray-600">
                              {client?.name?.charAt(0).toUpperCase() || "?"}
                            </div>
                            <h3 className="font-medium text-gray-900">
                              {client?.name || "Unknown Client"}
                            </h3>
                          </div>
                        </div>
                        <p className="text-sm text-gray-500">
                          {work.transactionDate}
                        </p>
                      </div>
                      <PaymentStatusBadge status={work.paymentStatus} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Work Type:</span>
                        <div className="flex flex-wrap gap-1">
                          {work.workTypes.map((workType) => (
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
                      <div className="text-sm">
                        <span className="text-gray-500">Description:</span>
                        <p className="mt-1 text-gray-900">{work.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(work.totalPrice)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Paid</p>
                        <p className="font-medium text-gray-900">
                          {formatCurrency(work.paidAmount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Balance</p>
                        <p
                          className={`font-medium ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : "text-gray-600"}`}
                        >
                          {formatCurrency(balance)}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t border-gray-200">
                      {onEditWork && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditWork(work)}
                          className="flex-1 border-gray-200"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                      {onDeleteWork && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteWork(work)}
                          className="flex-1 border-gray-200"
                        >
                          <MoreHorizontal className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Pagination */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-gray-200 rounded-lg p-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-500">Rows per page</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={(value) =>
                    handlePageSizeChange(parseInt(value))
                  }
                >
                  <SelectTrigger className="w-auto h-8 border-gray-200">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="text-sm text-gray-500">
                <span className="font-medium">
                  {currentPage * pageSize + 1}-
                  {Math.min((currentPage + 1) * pageSize, total)}
                </span>{" "}
                of <span className="font-medium">{total}</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(0)}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronsLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(0, currentPage - 1))}
                disabled={currentPage === 0}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(currentPage + 1)}
                disabled={currentPage === totalPages - 1}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(totalPages - 1)}
                disabled={currentPage === totalPages - 1}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
