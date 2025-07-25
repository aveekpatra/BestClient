"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FileText, Search, Users, BarChart3, Home, Menu, X } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Sheet, SheetContent, SheetTrigger } from "./ui/sheet";
import { cn } from "../lib/utils";
import ProtectedRoute from "./ProtectedRoute";

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
              "flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium nav-transition relative group",
              isActive
                ? "text-white bg-gradient-to-r from-blue-600 to-blue-700 shadow-lg shadow-blue-500/25"
                : "text-gray-600 hover:text-gray-900 hover:bg-white hover:shadow-sm",
              mobile ? "w-full justify-start" : "justify-center min-w-[90px]"
            )}
          >
            <Icon className={cn("h-4 w-4", isActive ? "text-white" : "group-hover:scale-110 nav-transition")} />
            <span className={mobile ? "" : "hidden sm:inline"}>{item.name}</span>
            {isActive && !mobile && (
              <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1.5 h-1.5 bg-white rounded-full shadow-sm" />
            )}
          </Link>
        );
      })}
    </>
  );

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full navbar-glass border-b border-gray-200/50 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              {/* Logo */}
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg hover:shadow-xl nav-transition logo-pulse">
                  <FileText className="h-5 w-5 text-white" />
                </div>
                <div className="hidden sm:block">
                  <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    BestClient
                  </h1>
                  <p className="text-xs text-gray-500 -mt-1 font-medium">Transaction Manager</p>
                </div>
                <div className="sm:hidden">
                  <span className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                    CTM
                  </span>
                </div>
              </div>

              {/* Desktop Navigation */}
              <nav className="hidden md:flex items-center space-x-1 bg-gray-50/80 backdrop-blur-sm rounded-xl p-1.5 shadow-sm border border-gray-200/50">
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
                    className="search-input pl-10 pr-4 py-2.5 w-72 bg-gray-50/80 backdrop-blur-sm border-gray-200/50 rounded-xl text-sm placeholder-gray-500 focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 nav-transition shadow-sm"
                  />
                </div>

                {/* Mobile Search Button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="sm:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl nav-transition"
                >
                  <Search className="h-5 w-5" />
                </Button>

                {/* Mobile Menu */}
                <Sheet open={isOpen} onOpenChange={setIsOpen}>
                  <SheetTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="md:hidden text-gray-600 hover:text-gray-900 hover:bg-gray-100/80 rounded-xl nav-transition"
                    >
                      <Menu className="h-5 w-5" />
                      <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="left" className="w-80 p-0 mobile-menu-enter">
                    <div className="flex flex-col h-full bg-gradient-to-b from-white to-gray-50">
                      {/* Mobile Header */}
                      <div className="flex items-center justify-between p-6 border-b border-gray-200/50 bg-white/80 backdrop-blur-sm">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-700 rounded-xl shadow-lg">
                            <FileText className="h-5 w-5 text-white" />
                          </div>
                          <div>
                            <h2 className="text-lg font-bold bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">
                              BestClient
                            </h2>
                            <p className="text-xs text-gray-500 -mt-1 font-medium">Transaction Manager</p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setIsOpen(false)}
                          className="text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl nav-transition"
                        >
                          <X className="h-5 w-5" />
                        </Button>
                      </div>

                      {/* Mobile Search */}
                      <div className="p-6 border-b border-gray-200/50">
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search className="h-4 w-4 text-gray-400" />
                          </div>
                          <Input
                            type="text"
                            placeholder="Search..."
                            className="search-input pl-10 pr-4 py-2.5 w-full bg-gray-50/80 backdrop-blur-sm border-gray-200/50 rounded-xl text-sm nav-transition shadow-sm"
                          />
                        </div>
                      </div>

                      {/* Mobile Navigation */}
                      <nav className="flex-1 p-6 space-y-3">
                        <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">
                          Navigation
                        </div>
                        <NavItems mobile />
                      </nav>

                      {/* Mobile Footer */}
                      <div className="p-6 border-t border-gray-200/50 bg-white/50 backdrop-blur-sm">
                        <p className="text-xs text-gray-500 text-center font-medium">
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
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200/50 min-h-[calc(100vh-8rem)] backdrop-blur-sm">
            <div className="p-6 sm:p-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}