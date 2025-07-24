'use client'

import { useState } from 'react'
import { useQuery, useMutation } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table'
import {
  formatCurrency,
  formatPhone,
  formatPAN,
  formatAadhar,
  formatDate,
  getWorkTypeLabel,
  getPaymentStatusInfo
} from '../lib/utils'
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
  History
} from 'lucide-react'

interface ClientDetailsProps {
  clientId: Id<"clients">
  onEdit?: () => void
  onDelete?: () => void
  onClose?: () => void
}

export function ClientDetails({ clientId, onEdit, onDelete, onClose }: ClientDetailsProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)

  const client = useQuery(api.clients.getClientById, { id: clientId })
  const clientWorks = useQuery(api.works.getWorksByClient, { clientId })
  const deleteClient = useMutation(api.clients.deleteClient)

  const handleDelete = async () => {
    setIsDeleting(true)
    try {
      await deleteClient({ id: clientId })
      onDelete?.()
    } catch (error) {
      console.error('Failed to delete client:', error)
      // TODO: Show error message
    } finally {
      setIsDeleting(false)
      setShowDeleteDialog(false)
    }
  }

  if (client === undefined) {
    return <ClientDetailsSkeleton />
  }

  if (client === null) {
    return (
      <Alert>
        <AlertDescription>
          Client not found or has been deleted.
        </AlertDescription>
      </Alert>
    )
  }

  const getBalanceInfo = (balance: number) => {
    if (balance > 0) {
      return {
        label: 'Client Owes',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
      }
    } else if (balance < 0) {
      return {
        label: 'You Owe',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
      }
    } else {
      return {
        label: 'Balanced',
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
      }
    }
  }

  const balanceInfo = getBalanceInfo(client.balance)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-blue-100 rounded-full">
            <User className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">{client.name}</h1>
            <p className="text-gray-500">Client Details</p>
          </div>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowDeleteDialog(true)}
            className="text-red-600 hover:text-red-700"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
          {onClose && (
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          )}
        </div>
      </div>

      {/* Balance Card */}
      <Card className={balanceInfo.bgColor}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IndianRupee className={`h-8 w-8 ${balanceInfo.color}`} />
              <div>
                <p className="text-sm text-gray-600">{balanceInfo.label}</p>
                <p className={`text-2xl font-bold ${balanceInfo.color}`}>
                  {formatCurrency(Math.abs(client.balance))}
                </p>
              </div>
            </div>
            <Badge variant="outline" className={balanceInfo.color}>
              {client.balance > 0 ? 'Receivable' : client.balance < 0 ? 'Payable' : 'Clear'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Personal Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Date of Birth</p>
                <p className="font-medium">{client.dateOfBirth}</p>
              </div>
            </div>
            
            <div className="flex items-start space-x-3">
              <MapPin className="h-4 w-4 text-gray-400 mt-1" />
              <div>
                <p className="text-sm text-gray-500">Address</p>
                <p className="font-medium">{client.address}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Phone className="h-5 w-5" />
              <span>Contact Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center space-x-3">
              <Phone className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-gray-500">Phone</p>
                <p className="font-medium">{formatPhone(client.phone)}</p>
              </div>
            </div>
            
            {client.email && (
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Email</p>
                  <p className="font-medium">{client.email}</p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Documents */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="h-5 w-5" />
              <span>Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {client.panNumber && (
              <div className="flex items-center space-x-3">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">PAN Number</p>
                  <p className="font-medium font-mono">{formatPAN(client.panNumber)}</p>
                </div>
              </div>
            )}
            
            {client.aadharNumber && (
              <div className="flex items-center space-x-3">
                <CreditCard className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-gray-500">Aadhar Number</p>
                  <p className="font-medium font-mono">{formatAadhar(client.aadharNumber)}</p>
                </div>
              </div>
            )}

            {!client.panNumber && !client.aadharNumber && (
              <p className="text-gray-500 text-sm">No documents on file</p>
            )}
          </CardContent>
        </Card>

        {/* Business Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Business Information</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-gray-500">Usual Work Type</p>
              <Badge variant="outline" className="mt-1">
                {getWorkTypeLabel(client.usualWorkType)}
              </Badge>
            </div>
            
            <div>
              <p className="text-sm text-gray-500">Client Since</p>
              <p className="font-medium">{formatDate(new Date(client.createdAt))}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Work History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <History className="h-5 w-5" />
            <span>Work History</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientWorks === undefined ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : clientWorks === null || clientWorks.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <History className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No work history found</p>
              <p className="text-sm">Work transactions will appear here</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Work Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clientWorks.map((work) => {
                  const statusInfo = getPaymentStatusInfo(work.paymentStatus)
                  return (
                    <TableRow key={work._id}>
                      <TableCell>{work.transactionDate}</TableCell>
                      <TableCell>{work.description}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {getWorkTypeLabel(work.workType)}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(work.totalPrice)}</TableCell>
                      <TableCell>
                        <Badge className={statusInfo.colorClass}>
                          {statusInfo.label}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Client</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete {client.name}? This action cannot be undone.
              All associated work records must be deleted first.
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
              {isDeleting ? 'Deleting...' : 'Delete Client'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ClientDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-32 mt-2" />
          </div>
        </div>
        <div className="flex space-x-2">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-20" />
        </div>
      </div>

      <Skeleton className="h-24 w-full" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-32" />
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}