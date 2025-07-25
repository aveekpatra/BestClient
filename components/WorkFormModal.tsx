"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { Work, WorkFormData } from "../lib/types";
import WorkForm from "./WorkForm";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { toast } from "sonner";

interface WorkFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  work?: Work;
}

export default function WorkFormModal({ isOpen, onClose, work }: WorkFormModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const createWork = useMutation(api.works.createWork);
  const updateWork = useMutation(api.works.updateWork);

  const handleSubmit = async (data: WorkFormData) => {
    setIsSubmitting(true);
    
    try {
      if (work) {
        // Update existing work
        await updateWork({
          id: work._id,
          clientId: data.clientId,
          transactionDate: data.transactionDate,
          totalPrice: data.totalPrice,
          paidAmount: data.paidAmount,
          workType: data.workType,
          description: data.description,
        });
        toast.success("Work transaction updated successfully");
      } else {
        // Create new work
        await createWork({
          clientId: data.clientId,
          transactionDate: data.transactionDate,
          totalPrice: data.totalPrice,
          paidAmount: data.paidAmount,
          workType: data.workType,
          description: data.description,
        });
        toast.success("Work transaction created successfully");
      }
      
      onClose();
    } catch (error) {
      console.error("Error saving work:", error);
      toast.error("Failed to save work transaction");
      throw error; // Re-throw to let form handle it
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {work ? "Edit Work Transaction" : "Add New Work Transaction"}
          </DialogTitle>
        </DialogHeader>
        <WorkForm
          work={work}
          onSubmit={handleSubmit}
          onCancel={onClose}
          isSubmitting={isSubmitting}
        />
      </DialogContent>
    </Dialog>
  );
}