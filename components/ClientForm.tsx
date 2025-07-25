"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { useMutation, useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
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
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import { Skeleton } from "./ui/skeleton";
import { Badge } from "./ui/badge";
import { ClientFormData, WorkType } from "../lib/types";
import { validateClientData } from "../lib/validation";
import { rupeesToPaise, paiseToRupees } from "../lib/utils";
import {
  Save,
  X,
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  CreditCard,
  FileText,
  Briefcase,
  Lock,
  Hash,
  Plus,
} from "lucide-react";

interface ClientFormProps {
  clientId?: Id<"clients">;
  onSave?: (clientId: Id<"clients">) => void;
  onCancel?: () => void;
}

export function ClientForm({ clientId, onSave, onCancel }: ClientFormProps) {
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

  // Update form when existing client data loads
  useEffect(() => {
    if (isEditing && existingClient && !form.formState.isDirty) {
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
    }
  }, [existingClient, isEditing, form]);

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

  const needsPassword = selectedWorkTypes.includes("income-tax");
  const needsPtId = selectedWorkTypes.includes("p-tax");

  const onSubmit = async (data: ClientFormData) => {
    setIsSubmitting(true);
    setError(null);

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
      });

      if (!validation.isValid) {
        const errorMessages = Object.values(validation.errors).join(", ");
        throw new Error(`Validation failed: ${errorMessages}`);
      }

      // Convert balance to paise
      const balanceInPaise = rupeesToPaise(data.balance);

      const clientData = {
        name: data.name,
        dateOfBirth: data.dateOfBirth,
        address: data.address,
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

      onSave?.(resultId);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <ClientFormSkeleton />;
  }

  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl bg-gradient-to-br from-white to-gray-50/50">
        <CardHeader className="bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-3 text-xl">
            <div className="flex items-center justify-center w-10 h-10 bg-white/10 rounded-lg backdrop-blur-sm">
              <User className="h-5 w-5" />
            </div>
            <span>
              {isEditing ? "Edit Client Information" : "Add New Client"}
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-8">
          {error && (
            <Alert
              className="mb-6 border-red-200 bg-red-50"
              variant="destructive"
            >
              <AlertDescription className="text-red-800">
                {error}
              </AlertDescription>
            </Alert>
          )}

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Personal Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-lg">
                    <User className="h-4 w-4 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Personal Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Full Name *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="Enter client's full name"
                              {...field}
                              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>
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
                        <FormLabel className="text-gray-700 font-medium">
                          Date of Birth *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="DD/MM/YYYY"
                              {...field}
                              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500">
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
                      <FormLabel className="text-gray-700 font-medium">
                        Address *
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <MapPin className="absolute left-3 top-4 h-4 w-4 text-gray-400" />
                          <Input
                            placeholder="Enter complete address"
                            {...field}
                            className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                          />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Contact Information Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-lg">
                    <Phone className="h-4 w-4 text-green-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Contact Information
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="9876543210"
                              {...field}
                              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500">
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
                        <FormLabel className="text-gray-700 font-medium">
                          Email Address
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              type="email"
                              placeholder="client@example.com"
                              {...field}
                              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          Optional email address
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Documents Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-lg">
                    <FileText className="h-4 w-4 text-orange-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Documents
                  </h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <FormField
                    control={form.control}
                    name="panNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-gray-700 font-medium">
                          PAN Number
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="ABCDE1234F"
                              {...field}
                              onChange={(e) =>
                                field.onChange(e.target.value.toUpperCase())
                              }
                              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500">
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
                        <FormLabel className="text-gray-700 font-medium">
                          Aadhar Number
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                              placeholder="123456789012"
                              {...field}
                              className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                            />
                          </div>
                        </FormControl>
                        <FormDescription className="text-gray-500">
                          12-digit Aadhar number
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              {/* Work Types Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                  <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-lg">
                    <Briefcase className="h-4 w-4 text-purple-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Work Types
                  </h3>
                </div>

                <FormField
                  control={form.control}
                  name="usualWorkTypes"
                  render={() => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium">
                        Select Work Types *
                      </FormLabel>
                      <div className="space-y-4">
                        {/* Selected work types */}
                        <div className="flex flex-wrap gap-2">
                          {selectedWorkTypes.map((workType) => (
                            <Badge
                              key={workType}
                              variant="secondary"
                              className="px-3 py-1 bg-blue-100 text-blue-800 border border-blue-200"
                            >
                              {getWorkTypeLabel(workType)}
                              {selectedWorkTypes.length > 1 && (
                                <button
                                  type="button"
                                  onClick={() => removeWorkType(workType)}
                                  className="ml-2 text-blue-600 hover:text-blue-800"
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
                          <SelectTrigger className="border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12">
                            <div className="flex items-center gap-2">
                              <Plus className="h-4 w-4 text-gray-400" />
                              <SelectValue placeholder="Add a work type" />
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            {availableWorkTypes
                              .filter(
                                (workType) =>
                                  !selectedWorkTypes.includes(workType),
                              )
                              .map((workType) => (
                                <SelectItem key={workType} value={workType}>
                                  {getWorkTypeLabel(workType)}
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <FormDescription className="text-gray-500">
                        Select one or more work types that this client usually
                        requests
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Conditional Fields */}
              {(needsPassword || needsPtId) && (
                <div className="space-y-6">
                  <div className="flex items-center gap-3 pb-3 border-b border-gray-200">
                    <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-lg">
                      <Lock className="h-4 w-4 text-red-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      Additional Information
                    </h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {needsPassword && (
                      <FormField
                        control={form.control}
                        name="password"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-gray-700 font-medium">
                              Income Tax Password *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  type="password"
                                  placeholder="Enter password for income tax portal"
                                  {...field}
                                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              Required for income tax related work
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
                            <FormLabel className="text-gray-700 font-medium">
                              P-Tax ID *
                            </FormLabel>
                            <FormControl>
                              <div className="relative">
                                <Hash className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <Input
                                  placeholder="Enter P-Tax ID"
                                  {...field}
                                  className="pl-10 border-gray-300 focus:border-blue-500 focus:ring-blue-500 h-12"
                                />
                              </div>
                            </FormControl>
                            <FormDescription className="text-gray-500">
                              Required for P-tax related work
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
              <div className="flex flex-col sm:flex-row justify-end gap-4 pt-8 border-t border-gray-200">
                <Button
                  type="button"
                  variant="outline"
                  onClick={onCancel}
                  disabled={isSubmitting}
                  className="border-gray-300 text-gray-700 hover:bg-gray-50 h-12 px-6"
                >
                  <X className="h-4 w-4 mr-2" />
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-gray-900 hover:bg-gray-800 text-white h-12 px-8"
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isSubmitting
                    ? "Saving..."
                    : isEditing
                      ? "Update Client"
                      : "Create Client"}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

function ClientFormSkeleton() {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <Card className="border-0 shadow-xl">
        <CardHeader>
          <Skeleton className="h-8 w-48" />
        </CardHeader>
        <CardContent className="p-8 space-y-8">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-4">
              <Skeleton className="h-6 w-32" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-12 w-full" />
                </div>
              </div>
            </div>
          ))}
          <div className="flex justify-end gap-4 pt-8">
            <Skeleton className="h-12 w-24" />
            <Skeleton className="h-12 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
