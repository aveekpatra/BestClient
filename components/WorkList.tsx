"use client";

import { useState, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Work, WorkType, PaymentStatus, Client } from "../lib/types";
import { formatCurrency, getWorkTypeLabel } from "../lib/utils";
import PaymentStatusBadge from "./PaymentStatusBadge";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Search, Filter, SortAsc, SortDesc, Plus } from "lucide-react";
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

type SortField = "transactionDate" | "totalPrice" | "paidAmount" | "clientName" | "workType" | "paymentStatus";
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
  const [currentPage, setCurrentPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const itemsPerPage = 10;

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

  // Filter and sort works
  const filteredAndSortedWorks = useMemo(() => {
    if (!works) return [];

    const filtered = works.filter((work) => {
      const client = clientMap[work.clientId];
      
      // Client filter
      if (filters.clientId && work.clientId !== filters.clientId) return false;
      
      // Work type filter
      if (filters.workType && work.workType !== filters.workType) return false;
      
      // Payment status filter
      if (filters.paymentStatus && work.paymentStatus !== filters.paymentStatus) return false;
      
      // Date range filter
      if (filters.dateFrom && work.transactionDate < filters.dateFrom) return false;
      if (filters.dateTo && work.transactionDate > filters.dateTo) return false;
      
      // Amount range filter
      if (filters.amountMin !== undefined && work.totalPrice < filters.amountMin * 100) return false;
      if (filters.amountMax !== undefined && work.totalPrice > filters.amountMax * 100) return false;
      
      // Search filter
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const clientName = client?.name.toLowerCase() || "";
        const description = work.description.toLowerCase();
        const workTypeLabel = getWorkTypeLabel(work.workType).toLowerCase();
        
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
        case "workType":
          aValue = getWorkTypeLabel(a.workType);
          bValue = getWorkTypeLabel(b.workType);
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
  const totalPages = Math.ceil(filteredAndSortedWorks.length / itemsPerPage);
  const paginatedWorks = filteredAndSortedWorks.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleFilterChange = (key: keyof WorkFilters, value: string | number | undefined) => {
    setFilters(prev => ({ ...prev, [key]: value }));
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setFilters({});
    setCurrentPage(1);
  };

  const handleWorkSelection = (workId: Id<"works">, selected: boolean) => {
    if (!onWorkSelectionChange) return;
    
    if (selected) {
      onWorkSelectionChange([...selectedWorks, workId]);
    } else {
      onWorkSelectionChange(selectedWorks.filter(id => id !== workId));
    }
  };

  const handleSelectAll = (selected: boolean) => {
    if (!onWorkSelectionChange) return;
    
    if (selected) {
      onWorkSelectionChange(paginatedWorks.map(work => work._id));
    } else {
      onWorkSelectionChange([]);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return null;
    return sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />;
  };

  if (!works || !clientsData?.clients) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Work Transactions</CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            {onAddWork && (
              <Button onClick={onAddWork}>
                <Plus className="h-4 w-4 mr-2" />
                Add Work
              </Button>
            )}
          </div>
        </div>

        {showFilters && (
          <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            {/* Mobile-first responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {/* Search - Full width on mobile */}
              <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                <label className="text-sm font-medium">Search</label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search works..."
                    value={filters.search || ""}
                    onChange={(e) => handleFilterChange("search", e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Client</label>
                <Select
                  value={filters.clientId || ""}
                  onValueChange={(value) => handleFilterChange("clientId", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All clients" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All clients</SelectItem>
                    {clientsData?.clients?.map((client) => (
                      <SelectItem key={client._id} value={client._id}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Work Type</label>
                <Select
                  value={filters.workType || ""}
                  onValueChange={(value) => handleFilterChange("workType", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All types</SelectItem>
                    <SelectItem value="online-work">Online Work</SelectItem>
                    <SelectItem value="health-insurance">Health Insurance</SelectItem>
                    <SelectItem value="life-insurance">Life Insurance</SelectItem>
                    <SelectItem value="income-tax">Income Tax</SelectItem>
                    <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                    <SelectItem value="others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Payment Status</label>
                <Select
                  value={filters.paymentStatus || ""}
                  onValueChange={(value) => handleFilterChange("paymentStatus", value || undefined)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All statuses" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All statuses</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="partial">Partial</SelectItem>
                    <SelectItem value="unpaid">Unpaid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Amount Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Date From</label>
                <Input
                  type="date"
                  value={filters.dateFrom || ""}
                  onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Date To</label>
                <Input
                  type="date"
                  value={filters.dateTo || ""}
                  onChange={(e) => handleFilterChange("dateTo", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Min Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="0"
                  value={filters.amountMin || ""}
                  onChange={(e) => handleFilterChange("amountMin", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Max Amount (₹)</label>
                <Input
                  type="number"
                  placeholder="No limit"
                  value={filters.amountMax || ""}
                  onChange={(e) => handleFilterChange("amountMax", e.target.value ? Number(e.target.value) : undefined)}
                />
              </div>
            </div>

            <div className="flex justify-end">
              <Button variant="outline" onClick={clearFilters}>
                Clear Filters
              </Button>
            </div>
          </div>
        )}
      </CardHeader>

      <CardContent>
        {/* Desktop Table View */}
        <div className="hidden lg:block rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                {showSelection && (
                  <TableHead className="w-12">
                    <input
                      type="checkbox"
                      checked={paginatedWorks.length > 0 && paginatedWorks.every(work => selectedWorks.includes(work._id))}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-gray-300"
                    />
                  </TableHead>
                )}
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("transactionDate")}
                    className="h-auto p-0 font-semibold"
                  >
                    Date <SortIcon field="transactionDate" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("clientName")}
                    className="h-auto p-0 font-semibold"
                  >
                    Client <SortIcon field="clientName" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("workType")}
                    className="h-auto p-0 font-semibold"
                  >
                    Work Type <SortIcon field="workType" />
                  </Button>
                </TableHead>
                <TableHead>Description</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("totalPrice")}
                    className="h-auto p-0 font-semibold"
                  >
                    Total <SortIcon field="totalPrice" />
                  </Button>
                </TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("paidAmount")}
                    className="h-auto p-0 font-semibold"
                  >
                    Paid <SortIcon field="paidAmount" />
                  </Button>
                </TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>
                  <Button
                    variant="ghost"
                    onClick={() => handleSort("paymentStatus")}
                    className="h-auto p-0 font-semibold"
                  >
                    Status <SortIcon field="paymentStatus" />
                  </Button>
                </TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedWorks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={showSelection ? 10 : 9} className="text-center py-8 text-gray-500">
                    No work transactions found
                  </TableCell>
                </TableRow>
              ) : (
                paginatedWorks.map((work) => {
                  const client = clientMap[work.clientId];
                  const balance = work.totalPrice - work.paidAmount;

                  return (
                    <TableRow key={work._id}>
                      {showSelection && (
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedWorks.includes(work._id)}
                            onChange={(e) => handleWorkSelection(work._id, e.target.checked)}
                            className="rounded border-gray-300"
                          />
                        </TableCell>
                      )}
                      <TableCell>{work.transactionDate}</TableCell>
                      <TableCell className="font-medium">
                        {client?.name || "Unknown Client"}
                      </TableCell>
                      <TableCell>{getWorkTypeLabel(work.workType)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {work.description}
                      </TableCell>
                      <TableCell>{formatCurrency(work.totalPrice)}</TableCell>
                      <TableCell>{formatCurrency(work.paidAmount)}</TableCell>
                      <TableCell className={balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : ""}>
                        {formatCurrency(Math.abs(balance))}
                      </TableCell>
                      <TableCell>
                        <PaymentStatusBadge status={work.paymentStatus} />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {onEditWork && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEditWork(work)}
                            >
                              Edit
                            </Button>
                          )}
                          {onDeleteWork && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDeleteWork(work)}
                            >
                              Delete
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
        <div className="lg:hidden">
          {paginatedWorks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No work transactions found
            </div>
          ) : (
            <div className="space-y-4">
              {paginatedWorks.map((work) => {
                const client = clientMap[work.clientId];
                const balance = work.totalPrice - work.paidAmount;

                return (
                  <Card key={work._id} className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          {showSelection && (
                            <input
                              type="checkbox"
                              checked={selectedWorks.includes(work._id)}
                              onChange={(e) => handleWorkSelection(work._id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                          )}
                          <h3 className="font-medium text-lg">
                            {client?.name || "Unknown Client"}
                          </h3>
                        </div>
                        <p className="text-sm text-gray-500">{work.transactionDate}</p>
                      </div>
                      <PaymentStatusBadge status={work.paymentStatus} />
                    </div>

                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Work Type:</span>
                        <span className="font-medium">{getWorkTypeLabel(work.workType)}</span>
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-500">Description:</span>
                        <p className="mt-1">{work.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-4 text-sm mb-4">
                      <div>
                        <p className="text-gray-500">Total</p>
                        <p className="font-medium">{formatCurrency(work.totalPrice)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Paid</p>
                        <p className="font-medium">{formatCurrency(work.paidAmount)}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Balance</p>
                        <p className={`font-medium ${balance > 0 ? "text-red-600" : balance < 0 ? "text-green-600" : ""}`}>
                          {formatCurrency(Math.abs(balance))}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-3 border-t">
                      {onEditWork && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onEditWork(work)}
                          className="flex-1"
                        >
                          Edit
                        </Button>
                      )}
                      {onDeleteWork && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => onDeleteWork(work)}
                          className="flex-1"
                        >
                          Delete
                        </Button>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col sm:flex-row items-center justify-between mt-4 gap-4">
            <div className="text-sm text-gray-500 text-center sm:text-left">
              Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
              {Math.min(currentPage * itemsPerPage, filteredAndSortedWorks.length)} of{" "}
              {filteredAndSortedWorks.length} results
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
              >
                Previous
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}