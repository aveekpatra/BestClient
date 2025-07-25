"use client";

import AppLayout from "../components/AppLayout";
import { Button } from "../components/ui/button";
import {
  Users,
  FileText,
  BarChart3,
  ListTodo,
  ArrowRight,
  DollarSign,
  CreditCard,
  TrendingUp,
} from "lucide-react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import Link from "next/link";

export default function Home() {
  const overviewStats = useQuery(api.analytics.getOverviewStats, {});

  const quickActions = [
    {
      title: "Manage Clients",
      description:
        "Add, edit, and organize all your client information efficiently",
      icon: Users,
      href: "/clients",
      color: "bg-blue-50 border-blue-200",
      iconColor: "text-blue-600",
      buttonText: "View Clients",
    },
    {
      title: "Track Work",
      description: "Monitor projects, payments, and work progress in real-time",
      icon: FileText,
      href: "/works",
      color: "bg-green-50 border-green-200",
      iconColor: "text-green-600",
      buttonText: "View Works",
    },
    {
      title: "Todo Board",
      description: "Organize tasks with an intuitive Kanban board interface",
      icon: ListTodo,
      href: "/todos",
      color: "bg-purple-50 border-purple-200",
      iconColor: "text-purple-600",
      buttonText: "View Todos",
    },
    {
      title: "Analytics",
      description: "Get insights into business performance and growth metrics",
      icon: BarChart3,
      href: "/statistics",
      color: "bg-orange-50 border-orange-200",
      iconColor: "text-orange-600",
      buttonText: "View Statistics",
    },
  ];

  const getFinancialStats = () => {
    if (!overviewStats) {
      return [
        {
          label: "Total Revenue",
          value: "Loading...",
          icon: DollarSign,
          color: "text-green-600",
        },
        {
          label: "Amount Due",
          value: "Loading...",
          icon: CreditCard,
          color: "text-red-600",
        },
        {
          label: "Collection Rate",
          value: "Loading...",
          icon: TrendingUp,
          color: "text-blue-600",
        },
      ];
    }

    const collectionRate =
      overviewStats.totalValue > 0
        ? (
            (overviewStats.totalIncome / overviewStats.totalValue) *
            100
          ).toFixed(1) + "%"
        : "0%";

    return [
      {
        label: "Total Revenue",
        value: formatCurrency(overviewStats.totalIncome),
        icon: DollarSign,
        color: "text-green-600",
      },
      {
        label: "Amount Due",
        value: formatCurrency(overviewStats.totalDue),
        icon: CreditCard,
        color: "text-red-600",
      },
      {
        label: "Collection Rate",
        value: collectionRate,
        icon: TrendingUp,
        color: "text-blue-600",
      },
    ];
  };

  return (
    <AppLayout>
      <div className="space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-2xl mb-4">
            <div className="w-10 h-10 bg-gray-900 rounded-lg flex items-center justify-center">
              <span className="text-white font-bold text-lg">BC</span>
            </div>
          </div>
          <h1 className="text-3xl font-semibold text-gray-900">
            Welcome to BestClient
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Your complete business management platform for clients, projects,
            and productivity
          </p>
        </div>

        {/* Financial Overview */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Financial Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {getFinancialStats().map((stat, index) => {
              const Icon = stat.icon;
              return (
                <div key={index} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 bg-gray-50 rounded-lg">
                    <Icon className={`h-5 w-5 ${stat.color}`} />
                  </div>
                  <div>
                    <p className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </p>
                    <p className="text-sm text-gray-600">{stat.label}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Quick Actions */}
        <div>
          <h2 className="text-lg font-medium text-gray-900 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <div
                  key={index}
                  className={`bg-white border rounded-xl p-6 hover:shadow-md transition-all duration-200 group ${action.color}`}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-10 h-10 bg-white rounded-lg shadow-sm">
                        <Icon className={`h-5 w-5 ${action.iconColor}`} />
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {action.title}
                        </h3>
                      </div>
                    </div>
                    <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-gray-600 transition-colors" />
                  </div>

                  <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                    {action.description}
                  </p>

                  <Button
                    asChild
                    className="w-full bg-gray-900 hover:bg-gray-800 text-white"
                  >
                    <Link
                      href={action.href}
                      className="flex items-center justify-center gap-2"
                    >
                      {action.buttonText}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
