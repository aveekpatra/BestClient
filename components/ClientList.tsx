'use client'

import { useState, useMemo } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Skeleton } from './ui/skeleton'
import { Alert, AlertDescription } from './ui/alert'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { 
  formatCurrency, 
  formatPhone, 
  formatPAN, 
  formatAadhar, 
  getWorkTypeLabel,
  debounce 
} from '../lib/utils'
import { WorkType } from '../lib/types'
import { Search, Filter, Plus, Edit, Trash2, User } from 'lucide-react'

interface ClientListProps {
  onClientSelect?: (clientId: string) => void
  onClientEdit?: (clientId: string) => void
  onClientCreate?: () => void
}

type SortField = 'name' | 'balance' | 'createdAt' | 'usualWorkType'
type SortOrder = 'asc' | 'desc'

export function ClientList({ onClientSelect, onClientEdit, onClientCreate }: ClientListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [workTypeFilter, setWorkTypeFilter] = useState<WorkType | 'all'>('all')
  const [balanceMin, setBalanceMin] = useState<string>('')
  const [balanceMax, setBalanceMax] = useState<string>('')
  const [balanceTypeFilter, setBalanceTypeFilter] = useState<'all' | 'positive' | 'negative' | 'zero'>('all')
  const [sortField, setSortField] = useState<SortField>('name')
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc')
  const [currentPage, setCurrentPage] = useState(0)
  const [deleteClientId, setDeleteClientId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  const deleteClient = useMutation(api.clients.deleteClient)

  const pageSize = 20

  // Debounced search to avoid too many API calls
  const debouncedSearch = useMemo(
    () => debounce((term: string) => setSearchTerm(term), 300),
    []
  )

  const clientsData = useQuery(api.clients.getClients, {
    limit: pageSize,
    offset: currentPage * pageSize,
    sortBy: sortField,
    sortOrder,
    workTypeFilter: workTypeFilter === 'all' ? undefined : workTypeFilter,
    balanceTypeFilter: balanceTypeFilter === 'all' ? undefined : balanceTypeFilter,
    balanceMin: balanceMin ? parseFloat(balanceMin) * 100 : undefined, // Convert to paise
    balanceMax: balanceMax ? parseFloat(balanceMax) * 100 : undefined, // Convert to paise
    searchTerm: searchTerm || undefined,
  })

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortOrder('asc')
    }
    setCurrentPage(0) // Reset to first page when sorting changes
  }

  const handleFilterChange = () => {
    setCurrentPage(0) // Reset to first page when filters change
  }

  const clearFilters = () => {
    setSearchTerm('')
    setWorkTypeFilter('all')
    setBalanceMin('')
    setBalanceMax('')
    setBalanceTypeFilter('all')
    setSortField('name')
    setSortOrder('asc')
    setCurrentPage(0)
  }

  const getSortIcon = (field: SortField) => {
    if (sortField !== field) return '↕️'
    return sortOrder === 'asc' ? '↑' : '↓'
  }

  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-green-600' // Client owes business
    if (balance < 0) return 'text-red-600'   // Business owes client
    return 'text-gray-600'                   // Zero balance
  }

  const getBalanceLabel = (balance: number) => {
    if (balance > 0) return 'Owes'
    if (balance < 0) return 'Owed'
    return 'Clear'
  }

  if (clientsData === undefined) {
    return <ClientListSkeleton />
  }

  if (clientsData === null) {
    return (
      <Alert>
        <AlertDescription>
          Failed to load clients. Please try again.
        </AlertDescription>
      </Alert>
    )
  }

  const { total, hasMore } = clientsData || { clients: [], total: 0, hasMore: false }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6" />
          <h2 className="text-2xl font-semibold">Clients</h2>
          <Badge variant="secondary">{total}</Badge>
        </div>
        <Button onClick={onClientCreate} className="flex items-center space-x-2">
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Mobile-first responsive grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Search - Full width on mobile */}
            <div className="relative sm:col-span-2 lg:col-span-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search clients..."
                className="pl-10"
                onChange={(e) => debouncedSearch(e.target.value)}
              />
            </div>

            {/* Work Type Filter */}
            <Select
              value={workTypeFilter}
              onValueChange={(value: WorkType | 'all') => {
                setWorkTypeFilter(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Work Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Work Types</SelectItem>
                <SelectItem value="online-work">Online Work</SelectItem>
                <SelectItem value="health-insurance">Health Insurance</SelectItem>
                <SelectItem value="life-insurance">Life Insurance</SelectItem>
                <SelectItem value="income-tax">Income Tax</SelectItem>
                <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                <SelectItem value="others">Others</SelectItem>
              </SelectContent>
            </Select>

            {/* Balance Type Filter */}
            <Select
              value={balanceTypeFilter}
              onValueChange={(value: 'all' | 'positive' | 'negative' | 'zero') => {
                setBalanceTypeFilter(value)
                handleFilterChange()
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Balance Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Balances</SelectItem>
                <SelectItem value="positive">Client Owes (₹+)</SelectItem>
                <SelectItem value="negative">You Owe (₹-)</SelectItem>
                <SelectItem value="zero">Balanced (₹0)</SelectItem>
              </SelectContent>
            </Select>

            {/* Balance Range - Stack on mobile */}
            <div className="sm:col-span-2 lg:col-span-2 xl:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                type="number"
                placeholder="Min Balance (₹)"
                value={balanceMin}
                onChange={(e) => {
                  setBalanceMin(e.target.value)
                  handleFilterChange()
                }}
              />
              <Input
                type="number"
                placeholder="Max Balance (₹)"
                value={balanceMax}
                onChange={(e) => {
                  setBalanceMax(e.target.value)
                  handleFilterChange()
                }}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardContent className="p-0">
          {!clientsData?.clients || clientsData.clients.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <User className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p className="text-lg font-medium">No clients found</p>
              <p className="text-sm">Try adjusting your filters or add a new client</p>
            </div>
          ) : (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('name')}
                      >
                        Name {getSortIcon('name')}
                      </TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('usualWorkType')}
                      >
                        Work Type {getSortIcon('usualWorkType')}
                      </TableHead>
                      <TableHead 
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => handleSort('balance')}
                      >
                        Balance {getSortIcon('balance')}
                      </TableHead>
                      <TableHead>Documents</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {clientsData?.clients?.map((client) => (
                      <TableRow 
                        key={client._id}
                        className="cursor-pointer hover:bg-gray-50"
                        onClick={() => onClientSelect?.(client._id)}
                      >
                        <TableCell>
                          <div>
                            <div className="font-medium">{client.name}</div>
                            <div className="text-sm text-gray-500">{client.address}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm">{formatPhone(client.phone)}</div>
                            {client.email && (
                              <div className="text-sm text-gray-500">{client.email}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {getWorkTypeLabel(client.usualWorkType)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${getBalanceColor(client.balance)}`}>
                            {formatCurrency(Math.abs(client.balance))}
                          </div>
                          <div className="text-xs text-gray-500">
                            {getBalanceLabel(client.balance)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {client.panNumber && (
                              <div className="text-xs">PAN: {formatPAN(client.panNumber)}</div>
                            )}
                            {client.aadharNumber && (
                              <div className="text-xs">Aadhar: {formatAadhar(client.aadharNumber)}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                onClientEdit?.(client._id)
                              }}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation()
                                setDeleteClientId(client._id)
                              }}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-4 p-4">
                {clientsData?.clients?.map((client) => (
                  <Card 
                    key={client._id}
                    className="cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onClientSelect?.(client._id)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-lg">{client.name}</h3>
                          <p className="text-sm text-gray-500 mt-1">{client.address}</p>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              onClientEdit?.(client._id)
                            }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              setDeleteClientId(client._id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Phone</p>
                          <p className="font-medium">{formatPhone(client.phone)}</p>
                          {client.email && (
                            <>
                              <p className="text-gray-500 mt-2">Email</p>
                              <p className="font-medium">{client.email}</p>
                            </>
                          )}
                        </div>
                        <div>
                          <p className="text-gray-500">Work Type</p>
                          <Badge variant="outline" className="mt-1">
                            {getWorkTypeLabel(client.usualWorkType)}
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-4 pt-3 border-t">
                        <div>
                          <p className="text-gray-500 text-sm">Balance</p>
                          <div className={`font-medium ${getBalanceColor(client.balance)}`}>
                            {formatCurrency(Math.abs(client.balance))} 
                            <span className="text-xs ml-1">({getBalanceLabel(client.balance)})</span>
                          </div>
                        </div>
                        {(client.panNumber || client.aadharNumber) && (
                          <div className="text-right text-xs text-gray-500">
                            {client.panNumber && <div>PAN: {formatPAN(client.panNumber)}</div>}
                            {client.aadharNumber && <div>Aadhar: {formatAadhar(client.aadharNumber)}</div>}
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Pagination */}
              <div className="flex flex-col sm:flex-row items-center justify-between p-4 border-t gap-4">
                <div className="text-sm text-gray-500 text-center sm:text-left">
                  Showing {currentPage * pageSize + 1} to {Math.min((currentPage + 1) * pageSize, total)} of {total} clients
                </div>
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 0}
                    onClick={() => setCurrentPage(currentPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!hasMore}
                    onClick={() => setCurrentPage(currentPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteClientId !== null} onOpenChange={() => setDeleteClientId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this client? This action cannot be undone.
              All associated work records must be deleted first.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button 
              variant="outline" 
              disabled={isDeleting}
              onClick={() => setDeleteClientId(null)}
            >
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              disabled={isDeleting}
              onClick={async () => {
                if (!deleteClientId) return
                
                setIsDeleting(true)
                try {
                  await deleteClient({ id: deleteClientId as Id<"clients"> })
                  setDeleteClientId(null)
                } catch (error) {
                  console.error('Failed to delete client:', error)
                  // TODO: Show error toast
                } finally {
                  setIsDeleting(false)
                }
              }}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClientListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-10 w-32" />
      </div>
      
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-24" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="space-y-4 p-4">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-4">
                <Skeleton className="h-12 w-12 rounded-full" />
                <div className="space-y-2 flex-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
                <Skeleton className="h-6 w-20" />
                <Skeleton className="h-4 w-16" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}