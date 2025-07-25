"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Users,
  BarChart3,
  Home,
  Menu,
  X,
  ListTodo,
  Plus,
} from "lucide-react";
import { Button } from "./ui/button";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { cn } from "../lib/utils";
import ProtectedRoute from "./ProtectedRoute";
import Image from "next/image";

interface AppLayoutProps {
  children: React.ReactNode;
}

const navigation = [
  { name: "Home", href: "/", icon: Home },
  { name: "Clients", href: "/clients", icon: Users },
  { name: "Transactions", href: "/works", icon: FileText },
  { name: "Todos", href: "/todos", icon: ListTodo },
  { name: "Statistics", href: "/statistics", icon: BarChart3 },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const NavItems = ({ mobile = false }: { mobile?: boolean }) => (
    <>
      {navigation.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href;

        return (
          <Link
            key={item.name}
            href={item.href}
            onClick={() => mobile && setIsOpen(false)}
            className={cn(
              "relative flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-out group",
              isActive
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-100",
              mobile && "w-full justify-start",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-all duration-200 ease-out",
                isActive && "text-white",
                !isActive && "group-hover:scale-105",
              )}
            />
            <span className={mobile ? "" : "hidden lg:inline"}>
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center h-16">
              {/* Logo */}
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
                  <Image
                    src="/icon.png"
                    alt="BestClient Logo"
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-lg font-semibold text-gray-900">
                    BestClient
                  </h1>
                </div>
                <div className="sm:hidden">
                  <span className="text-lg font-semibold text-gray-900">
                    BC
                  </span>
                </div>
              </div>

              {/* Centered Desktop Navigation */}
              <div className="hidden md:flex flex-1 justify-center">
                <nav className="flex items-center gap-1 bg-gray-50/80 backdrop-blur-sm rounded-xl p-1">
                  <NavItems />
                </nav>
              </div>

              {/* Add Transaction Button and Mobile Menu */}
              <div className="flex items-center gap-3 flex-shrink-0">
                {/* Add Transaction Button */}
                <Button
                  asChild
                  className="hidden sm:flex bg-gray-900 hover:bg-gray-800 text-white"
                >
                  <Link href="/works" className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    <span className="hidden lg:inline">Add Transaction</span>
                    <span className="lg:hidden">Add</span>
                  </Link>
                </Button>

                {/* Mobile Add Button */}
                <Button
                  asChild
                  size="icon"
                  className="sm:hidden bg-gray-900 hover:bg-gray-800 text-white h-8 w-8"
                >
                  <Link href="/works">
                    <Plus className="h-4 w-4" />
                  </Link>
                </Button>

                {/* Mobile Menu */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8"
                    >
                      <Menu className="h-4 w-4" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0">
                    <div className="flex flex-col h-full bg-white">
                      {/* Mobile Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-100">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg overflow-hidden">
                            <Image
                              src="/icon.png"
                              alt="BestClient Logo"
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          </div>
                          <div>
                            <h2 className="text-lg font-semibold text-gray-900">
                              BestClient
                            </h2>
                            <p className="text-xs text-gray-500">
                              Transaction Manager
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsOpen(false)}
                          className="text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Mobile Navigation */}
                      <nav className="flex-1 p-6">
                        <div className="space-y-2">
                          <NavItems mobile />
                        </div>
                      </nav>

                      {/* Mobile Add Transaction */}
                      <div className="p-6 border-t border-gray-100">
                        <Button
                          asChild
                          className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                        >
                          <Link
                            href="/works"
                            className="flex items-center justify-center gap-2"
                          >
                            <Plus className="h-4 w-4" />
                            Add Transaction
                          </Link>
                        </Button>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
