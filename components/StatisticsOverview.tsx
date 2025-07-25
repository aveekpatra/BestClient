"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { formatCurrency } from "../lib/utils";
import {
  Users,
  Briefcase,
  TrendingUp,
  AlertCircle,
  DollarSign,
  PieChart,
  CheckCircle,
  Clock,
  XCircle,
  Wallet,
  CreditCard,
  Scale,
} from "lucide-react";

interface StatisticsOverviewProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function StatisticsOverview({
  dateFrom,
  dateTo,
}: StatisticsOverviewProps) {
  const overviewStats = useQuery(api.analytics.getOverviewStats, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (!overviewStats) {
    return (
      <div className="space-y-8">
        {/* Overview Skeleton */}
        <div>
          <div className="h-7 w-40 bg-gray-200 rounded animate-pulse mb-3"></div>
          <div className="h-5 w-64 bg-gray-100 rounded animate-pulse"></div>
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="h-4 w-24 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-10 w-10 bg-gray-200 rounded-xl animate-pulse"></div>
              </div>
              <div className="h-8 w-20 bg-gray-200 rounded animate-pulse mb-2"></div>
              <div className="h-3 w-32 bg-gray-100 rounded animate-pulse"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      title: "Total Clients",
      value: overviewStats.totalClients.toString(),
      icon: Users,
      description: "Active clients",
      color: "blue",
    },
    {
      title: "Total Projects",
      value: overviewStats.totalWorks.toString(),
      icon: Briefcase,
      description: "Work completed",
      color: "purple",
    },
    {
      title: "Revenue Earned",
      value: formatCurrency(overviewStats.totalIncome),
      icon: TrendingUp,
      description: "Money received",
      color: "green",
      positive: true,
    },
    {
      title: "Amount Due",
      value: formatCurrency(overviewStats.totalDue),
      icon: AlertCircle,
      description: "Pending payments",
      color: "red",
      negative: overviewStats.totalDue > 0,
    },
    {
      title: "Total Business Value",
      value: formatCurrency(overviewStats.totalValue),
      icon: DollarSign,
      description: "Overall worth",
      color: "indigo",
    },
    {
      title: "Collection Rate",
      value: `${overviewStats.totalValue > 0 ? ((overviewStats.totalIncome / overviewStats.totalValue) * 100).toFixed(1) : 0}%`,
      icon: PieChart,
      description: "Payment efficiency",
      color:
        overviewStats.totalValue > 0 &&
        overviewStats.totalIncome / overviewStats.totalValue > 0.8
          ? "green"
          : "yellow",
      positive:
        overviewStats.totalValue > 0 &&
        overviewStats.totalIncome / overviewStats.totalValue > 0.8,
    },
  ];

  const getColorClasses = (color: string) => {
    const colors = {
      blue: { bg: "bg-blue-50", text: "text-blue-600", icon: "text-blue-600" },
      purple: {
        bg: "bg-purple-50",
        text: "text-purple-600",
        icon: "text-purple-600",
      },
      green: {
        bg: "bg-green-50",
        text: "text-green-600",
        icon: "text-green-600",
      },
      red: { bg: "bg-red-50", text: "text-red-600", icon: "text-red-600" },
      indigo: {
        bg: "bg-indigo-50",
        text: "text-indigo-600",
        icon: "text-indigo-600",
      },
      yellow: {
        bg: "bg-yellow-50",
        text: "text-yellow-600",
        icon: "text-yellow-600",
      },
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <div className="space-y-8">
      {/* Overview Header */}
      <div className="text-center">
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">
          Business Dashboard
        </h2>
        <p className="text-gray-600">Your business performance at a glance</p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colors = getColorClasses(stat.color);
          return (
            <div
              key={index}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-medium text-gray-700">
                  {stat.title}
                </h3>
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-xl ${colors.bg}`}
                >
                  <Icon className={`h-5 w-5 ${colors.icon}`} />
                </div>
              </div>
              <div className={`text-2xl font-bold mb-1 ${colors.text}`}>
                {stat.value}
              </div>
              <p className="text-sm text-gray-500">{stat.description}</p>
            </div>
          );
        })}
      </div>

      {/* Breakdown Sections - Side by Side */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Payment Status Breakdown */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Payment Status
            </h3>
            <p className="text-gray-600">How your projects are performing</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Fully Paid</p>
                  <p className="text-sm text-gray-600">Complete payments</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {overviewStats.paymentBreakdown.paid}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-yellow-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Partial Payment</p>
                  <p className="text-sm text-gray-600">In progress</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-yellow-600">
                {overviewStats.paymentBreakdown.partial}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                  <XCircle className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Unpaid</p>
                  <p className="text-sm text-gray-600">Needs attention</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {overviewStats.paymentBreakdown.unpaid}
              </div>
            </div>
          </div>
        </div>

        {/* Client Balance Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
          <div className="text-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Client Balances
            </h3>
            <p className="text-gray-600">Money flow with your clients</p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-green-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-green-100 rounded-full">
                  <CreditCard className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">They Owe You</p>
                  <p className="text-sm text-gray-600">Money coming in</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-green-600">
                {overviewStats.clientBalanceBreakdown.positive}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-red-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-red-100 rounded-full">
                  <Wallet className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">You Owe Them</p>
                  <p className="text-sm text-gray-600">Money going out</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-red-600">
                {overviewStats.clientBalanceBreakdown.negative}
              </div>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                  <Scale className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">All Balanced</p>
                  <p className="text-sm text-gray-600">Nothing owed</p>
                </div>
              </div>
              <div className="text-2xl font-bold text-gray-600">
                {overviewStats.clientBalanceBreakdown.zero}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}