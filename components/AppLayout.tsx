"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  FileText,
  Search,
  Users,
  BarChart3,
  Home,
  Menu,
  X,
} from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
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
  { name: "Works", href: "/works", icon: FileText },
  { name: "Statistics", href: "/statistics", icon: BarChart3 },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
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
                ? "text-gray-900 bg-gray-100"
                : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
              mobile ? "w-full" : "",
            )}
          >
            <Icon
              className={cn(
                "h-4 w-4 transition-transform duration-200",
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
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
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

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center gap-1 bg-gray-50/80 backdrop-blur-sm rounded-xl p-1">
                <NavItems />
              </nav>

              {/* Search and Mobile Menu */}
              <div className="flex items-center gap-3">
                {/* Search Bar */}
                <div className="hidden sm:block relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-4 w-4 text-gray-400" />
                  </div>
                  <Input
                    type="text"
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-4 py-2 w-64 bg-gray-50/80 border-gray-200/50 rounded-lg text-sm placeholder-gray-500 focus:bg-white focus:border-gray-300 transition-all duration-200"
                  />
                </div>

                {/* Mobile Search Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg h-8 w-8"
                >
                  <Search className="h-4 w-4" />
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
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg h-8 w-8"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>

                      {/* Mobile Search */}
                      <div className="p-6 border-b border-gray-100">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            type="text"
                            placeholder="Search..."
                            className="pl-10 pr-4 py-2 w-full bg-gray-50/80 border-gray-200/50 rounded-lg text-sm"
                          />
                        </div>
                      </div>

                      {/* Mobile Navigation */}
                      <nav className="flex-1 p-6 space-y-2">
                        <div className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-4">
                          Navigation
                        </div>
                        <NavItems mobile />
                      </nav>

                      {/* Mobile Footer */}
                      <div className="p-6 border-t border-gray-100">
                        <p className="text-xs text-gray-500 text-center">
                          © 2024 BestClient. All rights reserved.
                        </p>
                      </div>
                    </div>
                  </SheetContent>
                </Sheet>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="bg-white rounded-2xl border border-gray-100 min-h-[calc(100vh-8rem)]">
            <div className="p-6 sm:p-8">{children}</div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
