"use client";

import { useState, useEffect, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Id } from "../convex/_generated/dataModel";
import { Work, WorkType, WorkFormData } from "../lib/types";
import { validateWorkData } from "../lib/validation";
import {
  formatCurrency,
  rupeesToPaise,
  paiseToRupees,
  getCurrentDate,
} from "../lib/utils";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";

import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Alert, AlertDescription } from "./ui/alert";
import {
  Loader2,
  Calculator,
  Check,
  ChevronsUpDown,
  Search,
} from "lucide-react";

interface WorkFormProps {
  work?: Work;
  onSubmit: (data: WorkFormData) => Promise<void>;
  onCancel: () => void;
  isSubmitting?: boolean;
}

export default function WorkForm({
  work,
  onSubmit,
  onCancel,
  isSubmitting = false,
}: WorkFormProps) {
  const [formData, setFormData] = useState<WorkFormData>({
    clientId: work?.clientId || ("" as Id<"clients">),
    transactionDate: work?.transactionDate || getCurrentDate(),
    totalPrice: work?.totalPrice || 0,
    paidAmount: work?.paidAmount || 0,
    workTypes: work?.workTypes || ["online-work"],
    description: work?.description || "",
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [totalPriceRupees, setTotalPriceRupees] = useState(
    work ? paiseToRupees(work.totalPrice).toString() : "",
  );
  const [paidAmountRupees, setPaidAmountRupees] = useState(
    work ? paiseToRupees(work.paidAmount).toString() : "",
  );

  // Client search state
  const [clientSearch, setClientSearch] = useState("");
  const [isClientDropdownOpen, setIsClientDropdownOpen] = useState(false);
  const clientDropdownRef = useRef<HTMLDivElement>(null);

  // Fetch clients for dropdown
  const clientsData = useQuery(api.clients.getClients, {});

  // Filter clients based on search
  const filteredClients =
    clientsData?.clients?.filter((client) =>
      client.name.toLowerCase().includes(clientSearch.toLowerCase()),
    ) || [];

  // Get selected client name for display
  const selectedClient = clientsData?.clients?.find(
    (client) => client._id === formData.clientId,
  );

  // Calculate work balance and payment status
  const workBalance = formData.totalPrice - formData.paidAmount;
  const overpayment = formData.paidAmount - formData.totalPrice;
  const paymentStatus =
    formData.paidAmount >= formData.totalPrice
      ? "paid"
      : formData.paidAmount > 0
        ? "partial"
        : "unpaid";

  // Update form data when amounts change
  useEffect(() => {
    const totalPaise = totalPriceRupees
      ? rupeesToPaise(parseFloat(totalPriceRupees) || 0)
      : 0;
    const paidPaise = paidAmountRupees
      ? rupeesToPaise(parseFloat(paidAmountRupees) || 0)
      : 0;

    setFormData((prev) => ({
      ...prev,
      totalPrice: totalPaise,
      paidAmount: paidPaise,
    }));
  }, [totalPriceRupees, paidAmountRupees]);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        clientDropdownRef.current &&
        !clientDropdownRef.current.contains(event.target as Node)
      ) {
        setIsClientDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form data
    const validation = validateWorkData({
      transactionDate: formData.transactionDate,
      totalPrice: formData.totalPrice,
      paidAmount: formData.paidAmount,
      description: formData.description,
    });

    // Additional validations
    const newErrors: Record<string, string> = { ...validation.errors };

    if (!formData.clientId) {
      newErrors.clientId = "Please select a client";
    }

    if (!formData.workTypes || formData.workTypes.length === 0) {
      newErrors.workTypes = "Please select at least one work type";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});

    try {
      await onSubmit(formData);
    } catch (error) {
      console.error("Error submitting work form:", error);
      setErrors({ submit: "Failed to save work. Please try again." });
    }
  };

  const handleInputChange = (
    field: keyof WorkFormData,
    value: string | WorkType | Id<"clients">,
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAmountChange = (
    field: "totalPrice" | "paidAmount",
    value: string,
  ) => {
    // Only allow valid number input
    if (value === "" || /^\d*\.?\d*$/.test(value)) {
      if (field === "totalPrice") {
        setTotalPriceRupees(value);
      } else {
        setPaidAmountRupees(value);
      }

      // Clear error when user starts typing
      if (errors[field]) {
        setErrors((prev) => ({ ...prev, [field]: "" }));
      }
    }
  };

  if (!clientsData?.clients) {
    return (
      <Card>
        <CardContent className="py-8">
          <div className="flex items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin mr-2" />
            Loading clients...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {work ? "Edit Work Transaction" : "Add New Work Transaction"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {errors.submit && (
            <Alert variant="destructive">
              <AlertDescription>{errors.submit}</AlertDescription>
            </Alert>
          )}

          {/* Client Selection */}
          <div className="space-y-2">
            <Label htmlFor="clientId">Client *</Label>
            <div className="relative" ref={clientDropdownRef}>
              <Button
                type="button"
                variant="outline"
                role="combobox"
                aria-expanded={isClientDropdownOpen}
                className={`w-full justify-between ${errors.clientId ? "border-red-500" : ""}`}
                onClick={() => setIsClientDropdownOpen(!isClientDropdownOpen)}
              >
                {selectedClient ? selectedClient.name : "Select a client..."}
                <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
              </Button>

              {isClientDropdownOpen && (
                <div className="absolute top-full z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg">
                  {/* Search Input */}
                  <div className="p-2 border-b border-gray-200">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <Input
                        placeholder="Search clients..."
                        value={clientSearch}
                        onChange={(e) => setClientSearch(e.target.value)}
                        className="pl-9 h-8 border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Client List */}
                  <div className="max-h-60 overflow-y-auto p-1">
                    {filteredClients.length === 0 ? (
                      <div className="py-2 px-3 text-sm text-gray-500">
                        No clients found
                      </div>
                    ) : (
                      filteredClients.map((client) => (
                        <button
                          key={client._id}
                          type="button"
                          className={`w-full text-left px-3 py-2 text-sm rounded-sm hover:bg-gray-100 flex items-center gap-2 ${
                            formData.clientId === client._id
                              ? "bg-gray-100"
                              : ""
                          }`}
                          onClick={() => {
                            handleInputChange("clientId", client._id);
                            setIsClientDropdownOpen(false);
                            setClientSearch("");
                          }}
                        >
                          {formData.clientId === client._id && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                          <span
                            className={
                              formData.clientId === client._id
                                ? "font-medium"
                                : ""
                            }
                          >
                            {client.name}
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
            {errors.clientId && (
              <p className="text-sm text-red-500">{errors.clientId}</p>
            )}
          </div>

          {/* Transaction Date */}
          <div className="space-y-2">
            <Label htmlFor="transactionDate">Transaction Date *</Label>
            <Input
              id="transactionDate"
              type="date"
              value={formData.transactionDate.split("/").reverse().join("-")} // Convert DD/MM/YYYY to YYYY-MM-DD for input
              onChange={(e) => {
                // Convert YYYY-MM-DD back to DD/MM/YYYY
                const [year, month, day] = e.target.value.split("-");
                const ddmmyyyy = `${day}/${month}/${year}`;
                handleInputChange("transactionDate", ddmmyyyy);
              }}
              className={errors.transactionDate ? "border-red-500" : ""}
            />
            {errors.transactionDate && (
              <p className="text-sm text-red-500">{errors.transactionDate}</p>
            )}
          </div>

          {/* Work Types */}
          <div className="space-y-2">
            <Label htmlFor="workTypes">Work Types *</Label>
            <div className="grid grid-cols-2 gap-3 p-3 border border-gray-200 rounded-lg">
              {[
                { value: "online-work", label: "Online Work" },
                { value: "health-insurance", label: "Health Insurance" },
                { value: "life-insurance", label: "Life Insurance" },
                { value: "income-tax", label: "Income Tax" },
                { value: "p-tax", label: "P-Tax" },
                { value: "mutual-funds", label: "Mutual Funds" },
                { value: "others", label: "Others" },
              ].map((workType) => (
                <label
                  key={workType.value}
                  className="flex items-center space-x-2 cursor-pointer"
                >
                  <input
                    type="checkbox"
                    checked={
                      formData.workTypes?.includes(
                        workType.value as WorkType,
                      ) || false
                    }
                    onChange={(e) => {
                      const currentValues = formData.workTypes || [];
                      if (e.target.checked) {
                        setFormData((prev) => ({
                          ...prev,
                          workTypes: [
                            ...currentValues,
                            workType.value as WorkType,
                          ],
                        }));
                      } else {
                        setFormData((prev) => ({
                          ...prev,
                          workTypes: currentValues.filter(
                            (v) => v !== workType.value,
                          ),
                        }));
                      }
                      // Clear error when user makes selection
                      if (errors.workTypes) {
                        setErrors((prev) => ({ ...prev, workTypes: "" }));
                      }
                    }}
                    className="rounded border-gray-300 text-gray-900 focus:ring-gray-200"
                  />
                  <span className="text-sm text-gray-700">
                    {workType.label}
                  </span>
                </label>
              ))}
            </div>
            {errors.workTypes && (
              <p className="text-sm text-red-500">{errors.workTypes}</p>
            )}
          </div>

          {/* Amount Fields */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="totalPrice">Total Price (₹) *</Label>
              <Input
                id="totalPrice"
                type="text"
                placeholder="0.00"
                value={totalPriceRupees}
                onChange={(e) =>
                  handleAmountChange("totalPrice", e.target.value)
                }
                className={errors.totalPrice ? "border-red-500" : ""}
              />
              {errors.totalPrice && (
                <p className="text-sm text-red-500">{errors.totalPrice}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="paidAmount">Paid Amount (₹) *</Label>
              <Input
                id="paidAmount"
                type="text"
                placeholder="0.00"
                value={paidAmountRupees}
                onChange={(e) =>
                  handleAmountChange("paidAmount", e.target.value)
                }
                className={errors.paidAmount ? "border-red-500" : ""}
              />
              {errors.paidAmount && (
                <p className="text-sm text-red-500">{errors.paidAmount}</p>
              )}
            </div>
          </div>

          {/* Balance Calculation Display */}
          {(formData.totalPrice > 0 || formData.paidAmount > 0) && (
            <div className="p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Calculator className="h-4 w-4" />
                <span className="font-medium">Payment Summary</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Work Amount:</span>
                  <div className="font-medium">
                    {formatCurrency(formData.totalPrice)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Payment:</span>
                  <div className="font-medium">
                    {formatCurrency(formData.paidAmount)}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">
                    {overpayment > 0 ? "Overpayment:" : "Remaining:"}
                  </span>
                  <div
                    className={`font-medium ${overpayment > 0 ? "text-green-600" : workBalance > 0 ? "text-red-600" : "text-gray-600"}`}
                  >
                    {formatCurrency(
                      Math.abs(overpayment > 0 ? overpayment : workBalance),
                    )}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        paymentStatus === "paid"
                          ? "bg-green-100 text-green-800"
                          : paymentStatus === "partial"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                      }`}
                    >
                      {paymentStatus.charAt(0).toUpperCase() +
                        paymentStatus.slice(1)}
                      {overpayment > 0 && " + Overpaid"}
                    </span>
                  </div>
                </div>
              </div>
              {overpayment > 0 && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-green-800 text-sm font-medium">
                      Overpayment of {formatCurrency(overpayment)} will be
                      credited to client&apos;s account
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description *</Label>
            <Textarea
              id="description"
              placeholder="Describe the work performed..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className={errors.description ? "border-red-500" : ""}
              rows={3}
            />
            {errors.description && (
              <p className="text-sm text-red-500">{errors.description}</p>
            )}
          </div>

          {/* Form Actions */}
          <div className="flex items-center gap-4 pt-4">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              )}
              {work ? "Update Work" : "Add Work"}
            </Button>
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
