"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { Work } from "../../lib/types";
import AppLayout from "../../components/AppLayout";
import WorkList from "../../components/WorkList";
import WorkFormModal from "../../components/WorkFormModal";
import ConfirmDialog from "../../components/ConfirmDialog";
import ReceiptGenerator from "../../components/ReceiptGenerator";
import { Button } from "../../components/ui/button";
import { Card, CardContent } from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
import { FileText } from "lucide-react";
import { toast } from "sonner";

export default function WorksPage() {
  const [selectedWorks, setSelectedWorks] = useState<Id<"works">[]>([]);
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingWork, setEditingWork] = useState<Work | undefined>();
  const [deletingWork, setDeletingWork] = useState<Work | undefined>();
  const [isDeleting, setIsDeleting] = useState(false);
  const [showReceiptGenerator, setShowReceiptGenerator] = useState(false);
  
  const deleteWork = useMutation(api.works.deleteWork);

  const handleAddWork = () => {
    setEditingWork(undefined);
    setIsFormModalOpen(true);
  };

  const handleEditWork = (work: Work) => {
    setEditingWork(work);
    setIsFormModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsFormModalOpen(false);
    setEditingWork(undefined);
  };

  const handleDeleteWork = (work: Work) => {
    setDeletingWork(work);
  };

  const handleConfirmDelete = async () => {
    if (!deletingWork) return;
    
    setIsDeleting(true);
    try {
      await deleteWork({ id: deletingWork._id });
      toast.success("Work transaction deleted successfully");
      setDeletingWork(undefined);
    } catch (error) {
      toast.error("Failed to delete work transaction");
      console.error("Error deleting work:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setDeletingWork(undefined);
  };

  const handleGenerateReceipt = () => {
    if (selectedWorks.length === 0) {
      toast.error("Please select at least one work transaction");
      return;
    }
    setShowReceiptGenerator(true);
  };

  const handleCloseReceiptGenerator = () => {
    setShowReceiptGenerator(false);
  };

  const handlePDFGeneration = async () => {
    try {
      toast.success("Receipt generated successfully!");
      setShowReceiptGenerator(false);
      setSelectedWorks([]);
    } catch (error) {
      toast.error("Failed to generate receipt");
      console.error("Error generating receipt:", error);
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Work Transactions</h1>
            <p className="text-muted-foreground">
              Manage your work transactions and track payments
            </p>
          </div>
        </div>

        {/* Selection Actions */}
        {selectedWorks.length > 0 && (
          <Card>
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Badge variant="secondary">
                    {selectedWorks.length} work{selectedWorks.length !== 1 ? 's' : ''} selected
                  </Badge>
                  <Button
                    variant="outline"
                    onClick={() => setSelectedWorks([])}
                  >
                    Clear Selection
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleGenerateReceipt}
                    className="flex items-center gap-2"
                  >
                    <FileText className="h-4 w-4" />
                    Generate Receipt
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Receipt Generator */}
        {showReceiptGenerator && (
          <ReceiptGenerator
            selectedWorkIds={selectedWorks}
            onClose={handleCloseReceiptGenerator}
            onGenerateReceipt={handlePDFGeneration}
          />
        )}

        {/* Work List */}
        <WorkList
          onAddWork={handleAddWork}
          onEditWork={handleEditWork}
          onDeleteWork={handleDeleteWork}
          selectedWorks={selectedWorks}
          onWorkSelectionChange={setSelectedWorks}
          showSelection={true}
        />

        {/* Work Form Modal */}
        <WorkFormModal
          isOpen={isFormModalOpen}
          onClose={handleCloseModal}
          work={editingWork}
        />

        {/* Delete Confirmation Dialog */}
        <ConfirmDialog
          isOpen={!!deletingWork}
          onClose={handleCancelDelete}
          onConfirm={handleConfirmDelete}
          title="Delete Work Transaction"
          description={`Are you sure you want to delete this work transaction? This action cannot be undone and will recalculate the client's balance.`}
          confirmText="Delete"
          cancelText="Cancel"
          variant="destructive"
          isLoading={isDeleting}
        />
      </div>
    </AppLayout>
  );
}