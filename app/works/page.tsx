"use client";

import AppLayout from "@/components/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileText, Plus } from "lucide-react";

export default function WorksPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Works</h1>
            <p className="text-muted-foreground">
              Manage work transactions and payments
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Work
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Work Transaction Management
            </CardTitle>
            <CardDescription>
              This section will contain work transaction management functionality
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Work transaction management features will be implemented in the next tasks.
            </p>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}