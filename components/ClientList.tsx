"use client";

import { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "./ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Skeleton } from "./ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  formatCurrency,
  formatPhone,
  getWorkTypeLabel,
  debounce,
} from "../lib/utils";
import { WorkType } from "../lib/types";
import {
  Search,
  Filter,
  Plus,
  Edit,
  MoreHorizontal,
  ChevronUp,
  ChevronDown,
  Users,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from "lucide-react";

interface ClientListProps {
  onClientSelect?: (clientId: string) => void;
  onClientEdit?: (clientId: string) => void;
  onClientCreate?: () => void;
}

type SortField = "name" | "balance" | "usualWorkTypes" | "createdAt";
type SortOrder = "asc" | "desc";

export function ClientList({
  onClientSelect,
  onClientEdit,
  onClientCreate,
}: ClientListProps) {
  const [searchInput, setSearchInput] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType | "all">("all");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(0);
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [pageSize, setPageSize] = useState(10);

  const deleteClient = useMutation(api.clients.deleteClient);

  // Debounced search to avoid too many API calls
  const debouncedSearch = useMemo(
    () =>
      debounce((term: string) => {
        setSearchTerm(term);
        setCurrentPage(0); // Reset to first page when search term changes
      }, 300),
    [],
  );

  const clientsData = useQuery(api.clients.getClients, {
    limit: pageSize,
    offset: currentPage * pageSize,
    sortBy: sortField,
    sortOrder,
    workTypeFilter: workTypeFilter === "all" ? undefined : workTypeFilter,
    searchTerm: searchTerm || undefined,
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
    setCurrentPage(0); // Reset to first page when sorting changes
  };

  const handleFilterChange = () => {
    setCurrentPage(0); // Reset to first page when filters change
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setPageSize(newPageSize);
    setCurrentPage(0); // Reset to first page when page size changes
  };

  const clearFilters = () => {
    setSearchInput("");
    setSearchTerm("");
    setWorkTypeFilter("all");
    setSortField("name");
    setSortOrder("asc");
    setCurrentPage(0);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteClientId) return;

    setIsDeleting(true);
    try {
      await deleteClient({ id: deleteClientId as Id<"clients"> });
      setDeleteClientId(null);
    } catch (error) {
      console.error("Failed to delete client:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortOrder === "asc" ? (
      <ChevronUp className="h-4 w-4 inline ml-1" />
    ) : (
      <ChevronDown className="h-4 w-4 inline ml-1" />
    );
  };

  const getBalanceColor = (balance: number) => {
    // Display: Positive DB values (client owes) as negative red values
    // Display: Negative DB values (overpaid) as positive green values
    if (balance > 0) return "text-red-600"; // Client owes = debt = red
    if (balance < 0) return "text-green-600"; // Overpaid = credit = green
    return "text-gray-600";
  };

  const total = clientsData?.total ?? 0;

  if (clientsData === undefined) {
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
            <Users className="h-5 w-5 text-gray-600" />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-gray-900">Clients</h1>
            <p className="text-sm text-gray-500">{total} total clients</p>
          </div>
        </div>
        <Button
          onClick={onClientCreate}
          className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" />
          Add Client
        </Button>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email, phone, or address..."
            className="pl-10 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              debouncedSearch(e.target.value);
            }}
          />
        </div>

        <div className="flex items-center gap-3">
          {/* Filter Dropdown */}
          <Select
            value={workTypeFilter}
            onValueChange={(value) => {
              const workType = value as WorkType | "all";
              setWorkTypeFilter(workType);
              handleFilterChange();
            }}
          >
            <SelectTrigger className="w-auto border-gray-200">
              <Filter className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Clients</SelectItem>

              {/* Work Type Filters */}
              <div className="px-2 py-1.5 text-xs font-medium text-gray-500 border-b">
                Work Type
              </div>
              <SelectItem value="online-work">Online Work</SelectItem>
              <SelectItem value="health-insurance">Health Insurance</SelectItem>
              <SelectItem value="life-insurance">Life Insurance</SelectItem>
              <SelectItem value="income-tax">Income Tax</SelectItem>
              <SelectItem value="p-tax">P-Tax</SelectItem>
              <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
              <SelectItem value="others">Others</SelectItem>
            </SelectContent>
          </Select>

          {/* Sort Dropdown */}
          <Select
            value={`${sortField}-${sortOrder}`}
            onValueChange={(value) => {
              const [field, order] = value.split("-") as [SortField, SortOrder];
              setSortField(field);
              setSortOrder(order);
              setCurrentPage(0);
            }}
          >
            <SelectTrigger className="w-40 border-gray-200">
              <ChevronUp className="h-4 w-4 mr-2 text-gray-500" />
              <SelectValue placeholder="Sort" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name-asc">Name A-Z</SelectItem>
              <SelectItem value="name-desc">Name Z-A</SelectItem>
              <SelectItem value="balance-desc">Balance High-Low</SelectItem>
              <SelectItem value="balance-asc">Balance Low-High</SelectItem>
              <SelectItem value="usualWorkTypes-asc">Work Type A-Z</SelectItem>
              <SelectItem value="createdAt-desc">Newest First</SelectItem>
              <SelectItem value="createdAt-asc">Oldest First</SelectItem>
            </SelectContent>
          </Select>

          {/* Clear Filters - only show if filters are active */}
          {(workTypeFilter !== "all" ||
            searchInput ||
            sortField !== "name" ||
            sortOrder !== "asc") && (
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
      {!clientsData?.clients || clientsData.clients.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <div className="flex items-center justify-center w-16 h-16 bg-gray-100 rounded-lg mx-auto mb-4">
            <Users className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No clients found
          </h3>
          <p className="text-gray-500 mb-4">
            Try adjusting your filters or add a new client
          </p>
          <Button
            onClick={onClientCreate}
            className="bg-gray-900 hover:bg-gray-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            Add your first client
          </Button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block bg-white border border-gray-200 rounded-lg overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="border-gray-200 bg-gray-50/50">
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    onClick={() => handleSort("name")}
                  >
                    Name {getSortIcon("name")}
                  </TableHead>
                  <TableHead className="font-medium">Email</TableHead>
                  <TableHead className="font-medium">Location</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium"
                    onClick={() => handleSort("usualWorkTypes")}
                  >
                    Status {getSortIcon("usualWorkTypes")}
                  </TableHead>
                  <TableHead className="font-medium">Work Type</TableHead>
                  <TableHead
                    className="cursor-pointer hover:bg-gray-100 transition-colors font-medium text-right"
                    onClick={() => handleSort("balance")}
                  >
                    Balance {getSortIcon("balance")}
                  </TableHead>
                  <TableHead className="font-medium w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientsData?.clients?.map((client) => (
                  <TableRow
                    key={client._id}
                    className="cursor-pointer hover:bg-gray-50 transition-colors border-gray-200"
                    onClick={() => onClientSelect?.(client._id)}
                  >
                    <TableCell className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                          {client.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {client.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatPhone(client.phone)}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-900">
                        {client.email || "No email"}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="text-sm text-gray-900">
                        {client.address}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <Badge
                        variant={client.balance >= 0 ? "default" : "secondary"}
                        className={
                          client.balance >= 0
                            ? "bg-gray-900 text-white"
                            : "bg-gray-100 text-gray-600"
                        }
                      >
                        {client.balance >= 0 ? "Active" : "Inactive"}
                      </Badge>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex flex-wrap gap-1">
                        {(client.usualWorkTypes || ["online-work"]).map(
                          (workType: string) => (
                            <Badge
                              key={workType}
                              variant="outline"
                              className="text-xs"
                            >
                              {getWorkTypeLabel(workType)}
                            </Badge>
                          ),
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="py-4 text-right">
                      <div
                        className={`font-medium ${getBalanceColor(client.balance)}`}
                      >
                        {formatCurrency(-client.balance)}
                      </div>
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onClientEdit?.(client._id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setDeleteClientId(client._id);
                          }}
                          className="h-8 w-8 p-0 hover:bg-gray-100"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden space-y-3">
            {clientsData?.clients?.map((client) => (
              <div
                key={client._id}
                className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => onClientSelect?.(client._id)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg text-sm font-medium text-gray-600">
                      {client.name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {client.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {formatPhone(client.phone)}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        onClientEdit?.(client._id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteClientId(client._id);
                      }}
                      className="h-8 w-8 p-0"
                    >
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Email</span>
                    <span className="text-sm text-gray-900">
                      {client.email || "No email"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Status</span>
                    <Badge
                      variant={client.balance >= 0 ? "default" : "secondary"}
                      className={
                        client.balance >= 0
                          ? "bg-gray-900 text-white"
                          : "bg-gray-100 text-gray-600"
                      }
                    >
                      {client.balance >= 0 ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">Balance</span>
                    <span
                      className={`text-sm font-medium ${getBalanceColor(client.balance)}`}
                    >
                      {formatCurrency(-client.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
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
                disabled={!clientsData?.hasMore}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  const totalPages = Math.ceil(total / pageSize);
                  setCurrentPage(totalPages - 1);
                }}
                disabled={!clientsData?.hasMore}
                className="h-8 w-8 p-0 border-gray-200"
              >
                <ChevronsRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteClientId}
        onOpenChange={() => setDeleteClientId(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteClientId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
