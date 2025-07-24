'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Id } from '../convex/_generated/dataModel'
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card'
import { Alert, AlertDescription } from './ui/alert'
import { Skeleton } from './ui/skeleton'
import { ClientFormData } from '../lib/types'
import { validateClientData } from '../lib/validation'
import { rupeesToPaise, paiseToRupees } from '../lib/utils'
import { Save, X, User } from 'lucide-react'

interface ClientFormProps {
  clientId?: Id<"clients">
  onSave?: (clientId: Id<"clients">) => void
  onCancel?: () => void
}

export function ClientForm({ clientId, onSave, onCancel }: ClientFormProps) {
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

  // Update form when existing client data loads
  if (isEditing && existingClient && !form.formState.isDirty) {
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
  }

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true)
    setError(null)

    try {
      // Validate the data
      const validation = validateClientData({
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
        phone: data.phone,
        email: data.email,
        panNumber: data.panNumber,
        aadharNumber: data.aadharNumber,
      })

      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(', ')
        throw new Error(`Validation failed: ${errorMessages}`)
      }

      // Convert balance to paise
      const balanceInPaise = rupeesToPaise(data.balance)

      const clientData = {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
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

      onSave?.(resultId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isLoading) {
    return <ClientFormSkeleton />
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <User className="h-5 w-5" />
          <span>{isEditing ? 'Edit Client' : 'Add New Client'}</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert className="mb-6" variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Basic Information</h3>
              
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
              <h3 className="text-lg font-medium">Contact Information</h3>
              
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

            {/* Documents */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Documents</h3>
              
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

            {/* Business Information */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Business Information</h3>
              
              <FormField
                control={form.control}
                name="usualWorkType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Usual Work Type *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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
                      <Input 
                        type="number"
                        step="0.01"
                        placeholder="0.00" 
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Positive = Client owes you, Negative = You owe client
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
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
      </CardContent>
    </Card>
  )
}

function ClientFormSkeleton() {
  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <Skeleton className="h-6 w-32" />
      </CardHeader>
      <CardContent className="space-y-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        ))}
        <div className="flex justify-end space-x-4 pt-6">
          <Skeleton className="h-10 w-20" />
          <Skeleton className="h-10 w-32" />
        </div>
      </CardContent>
    </Card>
  )
}