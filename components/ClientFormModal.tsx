"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
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
import { Badge } from "./ui/badge";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { rupeesToPaise, paiseToRupees } from "../lib/utils";
import { WorkType } from "../lib/types";
import { Plus, AlertTriangle } from "lucide-react";

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
  usualWorkTypes: z
    .array(
      z.enum([
        "online-work",
        "health-insurance",
        "life-insurance",
        "income-tax",
        "p-tax",
        "mutual-funds",
        "others",
      ]),
    )
    .min(1, "Please select at least one work type"),
  balance: z.number(),
  password: z.string().optional().or(z.literal("")),
  ptId: z.string().optional().or(z.literal("")),
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
  const [selectedWorkTypes, setSelectedWorkTypes] = useState<WorkType[]>([
    "online-work",
  ]);

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
      usualWorkTypes: ["online-work"],
      balance: 0,
      password: "",
      ptId: "",
    },
  });

  const getWorkTypeLabel = (workType: WorkType): string => {
    const labels: Record<WorkType, string> = {
      "online-work": "Online Work",
      "health-insurance": "Health Insurance",
      "life-insurance": "Life Insurance",
      "income-tax": "Income Tax",
      "p-tax": "P-Tax",
      "mutual-funds": "Mutual Funds",
      others: "Others",
    };
    return labels[workType];
  };

  const availableWorkTypes: WorkType[] = [
    "online-work",
    "health-insurance",
    "life-insurance",
    "income-tax",
    "p-tax",
    "mutual-funds",
    "others",
  ];

  const addWorkType = (workType: WorkType) => {
    if (!selectedWorkTypes.includes(workType)) {
      const newWorkTypes = [...selectedWorkTypes, workType];
      setSelectedWorkTypes(newWorkTypes);
      form.setValue("usualWorkTypes", newWorkTypes);
    }
  };

  const removeWorkType = (workType: WorkType) => {
    if (selectedWorkTypes.length > 1) {
      const newWorkTypes = selectedWorkTypes.filter((wt) => wt !== workType);
      setSelectedWorkTypes(newWorkTypes);
      form.setValue("usualWorkTypes", newWorkTypes);
    }
  };

  const needsPassword = selectedWorkTypes.includes("income-tax");
  const needsPtId = selectedWorkTypes.includes("p-tax");

  // Reset form when modal opens/closes or client changes
  useEffect(() => {
    if (open) {
      setError(null);
      if (isEditing && existingClient) {
        const clientData = {
          name: existingClient.name,
          dateOfBirth: existingClient.dateOfBirth,
          address: existingClient.address,
          phone: existingClient.phone,
          email: existingClient.email || "",
          panNumber: existingClient.panNumber || "",
          aadharNumber: existingClient.aadharNumber || "",
          usualWorkTypes: existingClient.usualWorkTypes,
          balance: paiseToRupees(existingClient.balance),
          password: existingClient.password || "",
          ptId: existingClient.ptId || "",
        };
        form.reset(clientData);
        setSelectedWorkTypes(existingClient.usualWorkTypes);
      } else if (!isEditing) {
        form.reset({
          name: "",
          dateOfBirth: "",
          address: "",
          phone: "",
          email: "",
          panNumber: "",
          aadharNumber: "",
          usualWorkTypes: ["online-work"],
          balance: 0,
          password: "",
          ptId: "",
        });
        setSelectedWorkTypes(["online-work"]);
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
        usualWorkTypes: selectedWorkTypes,
        balance: balanceInPaise,
        password: needsPassword ? data.password : undefined,
        ptId: needsPtId ? data.ptId : undefined,
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
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Client" : "Add New Client"}
          </DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <ClientFormSkeleton />
        ) : (
          <>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Basic Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Full Name *</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Enter client's full name"
                              {...field}
                            />
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
                            <Input placeholder="DD/MM/YYYY" {...field} />
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
                  <h3 className="text-lg font-medium">Contact Information</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone Number *</FormLabel>
                          <FormControl>
                            <Input placeholder="9876543210" {...field} />
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
                  <h3 className="text-lg font-medium">Documents</h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                            />
                          </FormControl>
                          <FormDescription>Format: AAAAA9999A</FormDescription>
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
                            <Input placeholder="123456789012" {...field} />
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

                {/* Work Types */}
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Work Types</h3>

                  <FormField
                    control={form.control}
                    name="usualWorkTypes"
                    render={() => (
                      <FormItem>
                        <FormLabel>Select Work Types *</FormLabel>
                        <div className="space-y-3">
                          {/* Selected work types */}
                          <div className="flex flex-wrap gap-2">
                            {selectedWorkTypes.map((workType) => (
                              <Badge
                                key={workType}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {getWorkTypeLabel(workType)}
                                {selectedWorkTypes.length > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => removeWorkType(workType)}
                                    className="ml-1 text-xs hover:text-red-600"
                                  >
                                    ×
                                  </button>
                                )}
                              </Badge>
                            ))}
                          </div>

                          {/* Add work type dropdown */}
                          <Select
                            onValueChange={(value) =>
                              addWorkType(value as WorkType)
                            }
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Add a work type" />
                            </SelectTrigger>
                            <SelectContent>
                              {availableWorkTypes
                                .filter(
                                  (workType) =>
                                    !selectedWorkTypes.includes(workType),
                                )
                                .map((workType) => (
                                  <SelectItem key={workType} value={workType}>
                                    <div className="flex items-center gap-2">
                                      <Plus className="h-3 w-3" />
                                      {getWorkTypeLabel(workType)}
                                    </div>
                                  </SelectItem>
                                ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <FormDescription>
                          Select one or more work types for this client
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Conditional Fields */}
                {(needsPassword || needsPtId) && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-medium">
                      Additional Information
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {needsPassword && (
                        <FormField
                          control={form.control}
                          name="password"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Income Tax Password *</FormLabel>
                              <FormControl>
                                <Input
                                  type="password"
                                  placeholder="Enter password for income tax portal"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Required for income tax work
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}

                      {needsPtId && (
                        <FormField
                          control={form.control}
                          name="ptId"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>P-Tax ID *</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="Enter P-Tax ID"
                                  {...field}
                                />
                              </FormControl>
                              <FormDescription>
                                Required for P-tax work
                              </FormDescription>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleCancel}
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isSubmitting}>
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
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="h-5 w-32" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-10 w-full" />
            </div>
          </div>
        </div>
      ))}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-24" />
      </div>
    </div>
  );
}
