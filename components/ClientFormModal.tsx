"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "./ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { rupeesToPaise, paiseToRupees } from "../lib/utils";
import {
  Save,
  X,
  User,
  Phone,
  CreditCard,
  Briefcase,
  IndianRupee,
  AlertTriangle,
} from "lucide-react";

// Form validation schema
const clientFormSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters")
    .max(100, "Name must be less than 100 characters"),
  dateOfBirth: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Date must be in DD/MM/YYYY format"),
  address: z
    .string()
    .min(10, "Address must be at least 10 characters")
    .max(500, "Address must be less than 500 characters"),
  phone: z
    .string()
    .regex(
      /^[6-9]\d{9}$/,
      "Phone must be a valid 10-digit Indian mobile number",
    ),
  email: z.string().email("Invalid email address").optional().or(z.literal("")),
  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, "PAN must be in format AAAAA9999A")
    .optional()
    .or(z.literal("")),
  aadharNumber: z
    .string()
    .regex(/^\d{12}$/, "Aadhar must be 12 digits")
    .optional()
    .or(z.literal("")),
  usualWorkType: z.enum([
    "online-work",
    "health-insurance",
    "life-insurance",
    "income-tax",
    "mutual-funds",
    "others",
  ]),
  balance: z.number(),
});

type ClientFormData = z.infer<typeof clientFormSchema>;

interface ClientFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId?: Id<"clients">;
  onSuccess?: (clientId: Id<"clients">) => void;
}

export function ClientFormModal({
  open,
  onOpenChange,
  clientId,
  onSuccess,
}: ClientFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createClient = useMutation(api.clients.createClient);
  const updateClient = useMutation(api.clients.updateClient);

  // Load existing client data if editing
  const existingClient = useQuery(
    api.clients.getClientById,
    clientId ? { id: clientId } : "skip",
  );

  const isEditing = !!clientId;
  const isLoading = isEditing && existingClient === undefined;

  const form = useForm<ClientFormData>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      dateOfBirth: "",
      address: "",
      phone: "",
      email: "",
      panNumber: "",
      aadharNumber: "",
      usualWorkType: "online-work",
      balance: 0,
    },
  });

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (isEditing && existingClient) {
        form.reset({
          name: existingClient.name,
          dateOfBirth: existingClient.dateOfBirth,
          address: existingClient.address,
          phone: existingClient.phone,
          email: existingClient.email || "",
          panNumber: existingClient.panNumber || "",
          aadharNumber: existingClient.aadharNumber || "",
          usualWorkType: existingClient.usualWorkType,
          balance: paiseToRupees(existingClient.balance),
        });
      } else if (!isEditing) {
        form.reset({
          name: "",
          dateOfBirth: "",
          address: "",
          phone: "",
          email: "",
          panNumber: "",
          aadharNumber: "",
          usualWorkType: "online-work",
          balance: 0,
        });
      }
    }
  }, [open, isEditing, existingClient, form]);

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Convert balance to paise
      const balanceInPaise = rupeesToPaise(data.balance);

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
      };

      let resultId: Id<"clients">;

      if (isEditing && clientId) {
        await updateClient({
          id: clientId,
          ...clientData,
        });
        resultId = clientId;
      } else {
        resultId = await createClient(clientData);
      }

      onSuccess?.(resultId);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    form.reset();
    setError(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-6">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
              <User className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <DialogTitle className="text-xl font-semibold text-gray-900">
                {isEditing ? "Edit Client" : "Add New Client"}
              </DialogTitle>
              <DialogDescription className="text-gray-500 mt-1">
                {isEditing
                  ? "Update client information and save changes."
                  : "Fill in the client details to add them to your system."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {isLoading ? (
          <ClientFormSkeleton />
        ) : (
          <>
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-sm text-red-800">{error}</span>
                </div>
              </div>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">
                      Basic Information
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Full Name *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter client's full name"
                              className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dateOfBirth"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Date of Birth *
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="DD/MM/YYYY"
                                className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                                {...field}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              Enter date in DD/MM/YYYY format
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="usualWorkType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Usual Work Type *
                            </FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              value={field.value}
                            >
                              <FormControl>
                                <SelectTrigger className="border-gray-200 focus:border-gray-300 focus:ring-gray-200">
                                  <SelectValue placeholder="Select work type" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="online-work">
                                  Online Work
                                </SelectItem>
                                <SelectItem value="health-insurance">
                                  Health Insurance
                                </SelectItem>
                                <SelectItem value="life-insurance">
                                  Life Insurance
                                </SelectItem>
                                <SelectItem value="income-tax">
                                  Income Tax
                                </SelectItem>
                                <SelectItem value="mutual-funds">
                                  Mutual Funds
                                </SelectItem>
                                <SelectItem value="others">Others</SelectItem>
                              </SelectContent>
                            </Select>
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
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Address *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter complete address"
                              className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">
                      Contact Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Phone Number *
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="9876543210"
                              className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
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
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Email Address
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="client@example.com"
                              className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Optional email address
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Documents & Financial */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 pb-2">
                    <CreditCard className="h-4 w-4 text-gray-500" />
                    <h3 className="text-sm font-medium text-gray-900">
                      Documents & Financial
                    </h3>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="panNumber"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-sm font-medium text-gray-700">
                              PAN Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="ABCDE1234F"
                                className="border-gray-200 focus:border-gray-300 focus:ring-gray-200 uppercase"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .toUpperCase()
                                      .replace(/[^A-Z0-9]/g, ""),
                                  )
                                }
                                maxLength={10}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
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
                            <FormLabel className="text-sm font-medium text-gray-700">
                              Aadhar Number
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="123456789012"
                                className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      .replace(/\D/g, "")
                                      .slice(0, 12),
                                  )
                                }
                                maxLength={12}
                              />
                            </FormControl>
                            <FormDescription className="text-xs text-gray-500">
                              12-digit Aadhar number
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="balance"
                      render={({ field }) => (
                        <FormItem className="max-w-xs">
                          <FormLabel className="text-sm font-medium text-gray-700">
                            Current Balance (₹)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <IndianRupee className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="0.00"
                                className="pl-10 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                                {...field}
                                onChange={(e) =>
                                  field.onChange(
                                    parseFloat(e.target.value) || 0,
                                  )
                                }
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-xs text-gray-500">
                            Positive = Client owes you, Negative = You owe
                            client
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-end gap-3 pt-6 border-t border-gray-200">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                    className="w-full sm:w-auto border-gray-200 text-gray-600 hover:bg-gray-50"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full sm:w-auto bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    {isSubmitting
                      ? "Saving..."
                      : isEditing
                        ? "Update Client"
                        : "Create Client"}
                  </Button>
                </div>
              </form>
            </Form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ClientFormSkeleton() {
  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, fieldIndex) => (
            <div key={fieldIndex} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>

      {/* Documents & Financial */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 pb-2">
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 2 }).map((_, fieldIndex) => (
              <div key={fieldIndex} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-3 w-48" />
              </div>
            ))}
          </div>
          <div className="space-y-2 max-w-xs">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-3 w-48" />
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-6 border-t border-gray-200">
        <Skeleton className="h-10 w-full sm:w-20" />
        <Skeleton className="h-10 w-full sm:w-32" />
      </div>
    </div>
  );
}
