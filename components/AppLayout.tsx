"use client";

import { FileText } from "lucide-react";
import AppNavigation from "./AppNavigation";
import ProtectedRoute from "./ProtectedRoute";

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <div className="container flex h-16 items-center justify-between px-4">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <FileText className="h-6 w-6" />
              <span className="font-semibold text-lg hidden sm:inline">Client Transaction Manager</span>
              <span className="font-semibold text-lg sm:hidden">CTM</span>
            </div>

            {/* Navigation */}
            <div className="flex items-center gap-4">
              <AppNavigation />
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-6">
          {children}
        </main>
      </div>
    </ProtectedRoute>
  );
}