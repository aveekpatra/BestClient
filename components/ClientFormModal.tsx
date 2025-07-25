'use client'

import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
import * as z from 'zod'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from './ui/form'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Input } from './ui/input'
import { Button } from './ui/button'
import { Alert, AlertDescription } from './ui/alert'
import { Skeleton } from './ui/skeleton'
import { Separator } from './ui/separator'
import { rupeesToPaise, paiseToRupees } from '../lib/utils'
import { Save, X, User, Phone, CreditCard, Briefcase, IndianRupee } from 'lucide-react'

// Form validation schema
const clientFormSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name must be less than 100 characters'),
  dateOfBirth: z.string().regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Date must be in DD/MM/YYYY format'),
  address: z.string().min(10, 'Address must be at least 10 characters').max(500, 'Address must be less than 500 characters'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Phone must be a valid 10-digit Indian mobile number'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  panNumber: z.string().regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'PAN must be in format AAAAA9999A').optional().or(z.literal('')),
  aadharNumber: z.string().regex(/^\d{12}$/, 'Aadhar must be 12 digits').optional().or(z.literal('')),
  usualWorkType: z.enum(['online-work', 'health-insurance', 'life-insurance', 'income-tax', 'mutual-funds', 'others']),
  balance: z.number(),
})

type ClientFormData = z.infer<typeof clientFormSchema>

interface ClientFormModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  clientId?: Id<"clients">
  onSuccess?: (clientId: Id<"clients">) => void
}

export function ClientFormModal({ open, onOpenChange, clientId, onSuccess }: ClientFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const createClient = useMutation(api.clients.createClient)
  const updateClient = useMutation(api.clients.updateClient)
  
  // Load existing client data if editing
  const existingClient = useQuery(
    api.clients.getClientById,
    clientId ? { id: clientId } : "skip"
  )

  const isEditing = !!clientId
  const isLoading = isEditing && existingClient === undefined

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: '',
      dateOfBirth: '',
      address: '',
      phone: '',
      email: '',
      panNumber: '',
      aadharNumber: '',
      usualWorkType: 'online-work',
      balance: 0,
    },
  })

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (open) {
      setError(null)
      if (isEditing && existingClient) {
        form.reset({
          name: existingClient.name,
          dateOfBirth: existingClient.dateOfBirth,
          address: existingClient.address,
          phone: existingClient.phone,
          email: existingClient.email || '',
          panNumber: existingClient.panNumber || '',
          aadharNumber: existingClient.aadharNumber || '',
          usualWorkType: existingClient.usualWorkType,
          balance: paiseToRupees(existingClient.balance),
        })
      } else if (!isEditing) {
        form.reset({
          name: '',
          dateOfBirth: '',
          address: '',
          phone: '',
          email: '',
          panNumber: '',
          aadharNumber: '',
          usualWorkType: 'online-work',
          balance: 0,
        })
      }
    }
  }, [open, isEditing, existingClient, form])

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Convert balance to paise
      const balanceInPaise = rupeesToPaise(data.balance)

      const clientData = {
        name: data.name.trim(),
        dateOfBirth: data.dateOfBirth,
        address: data.address.trim(),
        phone: data.phone,
        email: data.email || undefined,
        panNumber: data.panNumber || undefined,
        aadharNumber: data.aadharNumber || undefined,
        usualWorkType: data.usualWorkType,
        balance: balanceInPaise,
      }

      let resultId: Id<"clients">

      if (isEditing && clientId) {
        await updateClient({
          id: clientId,
          ...clientData,
        })
        resultId = clientId
      } else {
        resultId = await createClient(clientData)
      }

      onSuccess?.(resultId)
      onOpenChange(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCancel = () => {
    form.reset()
    setError(null)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <span>{isEditing ? 'Edit Client' : 'Add New Client'}</span>
          </DialogTitle>
          <DialogDescription>
            {isEditing 
              ? 'Update client information and save changes.' 
              : 'Fill in the client details to add them to your system.'
            }
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <ClientFormSkeleton />
        ) : (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Basic Information</h3>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter client's full name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="dateOfBirth"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Date of Birth *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="DD/MM/YYYY" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter date in DD/MM/YYYY format
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address *</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder="Enter complete address" 
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Contact Information</h3>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="9876543210" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Enter 10-digit mobile number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email Address</FormLabel>
                          <FormControl>
                            <Input 
                              type="email"
                              placeholder="client@example.com" 
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Optional email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Documents */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <CreditCard className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Documents</h3>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="panNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>PAN Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="ABCDE1234F" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.toUpperCase())}
                            />
                          </FormControl>
                          <FormDescription>
                            Format: AAAAA9999A (5 letters, 4 digits, 1 letter)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="aadharNumber"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Aadhar Number</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="123456789012" 
                              {...field}
                              onChange={(e) => field.onChange(e.target.value.replace(/\D/g, ''))}
                            />
                          </FormControl>
                          <FormDescription>
                            12-digit Aadhar number
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Business Information */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Briefcase className="h-4 w-4 text-muted-foreground" />
                    <h3 className="text-sm font-medium text-foreground">Business Information</h3>
                  </div>
                  <Separator />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="usualWorkType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Usual Work Type *</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select work type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="online-work">Online Work</SelectItem>
                              <SelectItem value="health-insurance">Health Insurance</SelectItem>
                              <SelectItem value="life-insurance">Life Insurance</SelectItem>
                              <SelectItem value="income-tax">Income Tax</SelectItem>
                              <SelectItem value="mutual-funds">Mutual Funds</SelectItem>
                              <SelectItem value="others">Others</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="balance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Current Balance (₹)</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                              <Input 
                                type="number"
                                step="0.01"
                                placeholder="0.00" 
                                className="pl-10"
                                {...field}
                                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                              />
                            </div>
                          </FormControl>
                          <FormDescription>
                            Positive = Client owes you, Negative = You owe client
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex justify-end space-x-3 pt-6 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSubmitting ? 'Saving...' : (isEditing ? 'Update Client' : 'Create Client')}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}

function ClientFormSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 4 }).map((_, sectionIndex) => (
        <div key={sectionIndex} className="space-y-4">
          <Skeleton className="h-4 w-32" />
          <Separator />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
      <div className="flex justify-end space-x-3 pt-6">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  )
}