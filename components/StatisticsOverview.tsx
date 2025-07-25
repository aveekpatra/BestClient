"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatCurrency } from "../lib/utils";
import { 
  Users, 
  Briefcase, 
  TrendingUp, 
  AlertCircle,
  DollarSign,
  PieChart
} from "lucide-react";

interface StatisticsOverviewProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function StatisticsOverview({ dateFrom, dateTo }: StatisticsOverviewProps) {
  const overviewStats = useQuery(api.analytics.getOverviewStats, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (!overviewStats) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(6)].map((_, i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stats = [
    {
      title: "Total Clients",
      value: overviewStats.totalClients.toString(),
      icon: Users,
      description: "Active clients in system",
    },
    {
      title: "Total Works",
      value: overviewStats.totalWorks.toString(),
      icon: Briefcase,
      description: "Work transactions",
    },
    {
      title: "Total Income",
      value: formatCurrency(overviewStats.totalIncome),
      icon: TrendingUp,
      description: "Amount received",
      positive: true,
    },
    {
      title: "Total Due",
      value: formatCurrency(overviewStats.totalDue),
      icon: AlertCircle,
      description: "Outstanding amount",
      negative: overviewStats.totalDue > 0,
    },
    {
      title: "Total Value",
      value: formatCurrency(overviewStats.totalValue),
      icon: DollarSign,
      description: "Total business value",
    },
    {
      title: "Collection Rate",
      value: `${overviewStats.totalValue > 0 ? ((overviewStats.totalIncome / overviewStats.totalValue) * 100).toFixed(1) : 0}%`,
      icon: PieChart,
      description: "Payment collection efficiency",
      positive: overviewStats.totalValue > 0 && (overviewStats.totalIncome / overviewStats.totalValue) > 0.8,
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Overview</h2>
        <p className="text-muted-foreground">Key business metrics at a glance</p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${
                  stat.positive ? 'text-green-600' : 
                  stat.negative ? 'text-red-600' : 
                  'text-muted-foreground'
                }`} />
              </CardHeader>
              <CardContent>
                <div className={`text-2xl font-bold ${
                  stat.positive ? 'text-green-600' : 
                  stat.negative ? 'text-red-600' : 
                  ''
                }`}>
                  {stat.value}
                </div>
                <p className="text-xs text-muted-foreground">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Status Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {overviewStats.paymentBreakdown.paid}
              </div>
              <p className="text-sm text-muted-foreground">Paid Works</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {overviewStats.paymentBreakdown.partial}
              </div>
              <p className="text-sm text-muted-foreground">Partial Payments</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {overviewStats.paymentBreakdown.unpaid}
              </div>
              <p className="text-sm text-muted-foreground">Unpaid Works</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Client Balance Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Client Balance Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {overviewStats.clientBalanceBreakdown.positive}
              </div>
              <p className="text-sm text-muted-foreground">Clients Owe You</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {overviewStats.clientBalanceBreakdown.negative}
              </div>
              <p className="text-sm text-muted-foreground">You Owe Clients</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-muted-foreground">
                {overviewStats.clientBalanceBreakdown.zero}
              </div>
              <p className="text-sm text-muted-foreground">Balanced Clients</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}