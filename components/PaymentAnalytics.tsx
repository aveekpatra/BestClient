"use client";

import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { formatCurrency } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { CreditCard, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface PaymentAnalyticsProps {
  dateFrom?: string;
  dateTo?: string;
}



export default function PaymentAnalytics({ dateFrom, dateTo }: PaymentAnalyticsProps) {
  const paymentAnalytics = useQuery(api.analytics.getPaymentAnalytics, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (!paymentAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80 bg-muted animate-pulse rounded"></div>
        </CardContent>
      </Card>
    );
  }

  const formatWorkType = (workType: string) => {
    return workType
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const CustomTooltip = ({ active, payload, label }: {
    active?: boolean;
    payload?: Array<{
      color: string;
      name: string;
      value: number;
    }>;
    label?: string;
  }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-background border rounded-lg p-3 shadow-lg">
          <p className="font-medium">{label}</p>
          {payload.map((entry, index: number) => (
            <p key={index} style={{ color: entry.color }}>
              {entry.name}: {formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Prepare payment status data for pie chart
  const paymentStatusData = [
    {
      name: "Paid",
      value: paymentAnalytics.paymentStatusBreakdown.paid.value,
      count: paymentAnalytics.paymentStatusBreakdown.paid.count,
      color: "#22c55e"
    },
    {
      name: "Partial",
      value: paymentAnalytics.paymentStatusBreakdown.partial.value,
      count: paymentAnalytics.paymentStatusBreakdown.partial.count,
      color: "#eab308"
    },
    {
      name: "Unpaid",
      value: paymentAnalytics.paymentStatusBreakdown.unpaid.value,
      count: paymentAnalytics.paymentStatusBreakdown.unpaid.count,
      color: "#ef4444"
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Payment Analytics</h2>
        <p className="text-muted-foreground">Payment collection and outstanding analysis</p>
      </div>

      {/* Payment Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5" />
            Payment Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {formatCurrency(paymentAnalytics.overview.totalValue)}
              </div>
              <p className="text-sm text-muted-foreground">Total Value</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(paymentAnalytics.overview.totalPaid)}
              </div>
              <p className="text-sm text-muted-foreground">Total Paid</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {formatCurrency(paymentAnalytics.overview.totalDue)}
              </div>
              <p className="text-sm text-muted-foreground">Total Due</p>
            </div>
            <div className="text-center">
              <div className={`text-2xl font-bold ${
                paymentAnalytics.overview.collectionEfficiency >= 80 ? 'text-green-600' :
                paymentAnalytics.overview.collectionEfficiency >= 60 ? 'text-yellow-600' :
                'text-red-600'
              }`}>
                {paymentAnalytics.overview.collectionEfficiency.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">Collection Rate</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {paymentAnalytics.overview.totalWorks}
              </div>
              <p className="text-sm text-muted-foreground">Total Works</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment Status Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Payment Status Breakdown
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={paymentStatusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => 
                      `${name} ${((percent || 0) * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {paymentStatusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Value"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Status Details */}
            <div className="space-y-4">
              <h4 className="font-semibold">Payment Status Details</h4>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-green-600" />
                    <span className="font-medium">Paid Works</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-green-600">
                      {paymentAnalytics.paymentStatusBreakdown.paid.count}
                    </div>
                    <div className="text-sm text-green-600">
                      {formatCurrency(paymentAnalytics.paymentStatusBreakdown.paid.value)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-center gap-3">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <span className="font-medium">Partial Payments</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-yellow-600">
                      {paymentAnalytics.paymentStatusBreakdown.partial.count}
                    </div>
                    <div className="text-sm text-yellow-600">
                      {formatCurrency(paymentAnalytics.paymentStatusBreakdown.partial.paid)} / {formatCurrency(paymentAnalytics.paymentStatusBreakdown.partial.value)}
                    </div>
                  </div>
                </div>

                <div className="flex justify-between items-center p-3 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-center gap-3">
                    <TrendingDown className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Unpaid Works</span>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-red-600">
                      {paymentAnalytics.paymentStatusBreakdown.unpaid.count}
                    </div>
                    <div className="text-sm text-red-600">
                      {formatCurrency(paymentAnalytics.paymentStatusBreakdown.unpaid.value)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Monthly Collection Trends */}
      {paymentAnalytics.monthlyCollection.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingDown className="h-5 w-5" />
              Monthly Collection Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Line Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={paymentAnalytics.monthlyCollection}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => `₹${(value / 100).toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Line 
                      type="monotone" 
                      dataKey="totalValue" 
                      stroke="#8884d8" 
                      strokeWidth={2}
                      name="Total Value"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalPaid" 
                      stroke="#22c55e" 
                      strokeWidth={2}
                      name="Total Paid"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="totalDue" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Total Due"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Monthly Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Month</th>
                      <th className="text-right p-2">Total Value</th>
                      <th className="text-right p-2">Total Paid</th>
                      <th className="text-right p-2">Total Due</th>
                      <th className="text-right p-2">Efficiency</th>
                      <th className="text-right p-2">Works</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentAnalytics.monthlyCollection.map((month, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{month.month}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(month.totalValue)}
                        </td>
                        <td className="p-2 text-right text-green-600">
                          {formatCurrency(month.totalPaid)}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          {formatCurrency(month.totalDue)}
                        </td>
                        <td className={`p-2 text-right ${
                          month.efficiency >= 80 ? 'text-green-600' :
                          month.efficiency >= 60 ? 'text-yellow-600' :
                          'text-red-600'
                        }`}>
                          {month.efficiency.toFixed(1)}%
                        </td>
                        <td className="p-2 text-right">{month.workCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Outstanding by Work Type */}
      {paymentAnalytics.outstandingByWorkType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Outstanding Amounts by Work Type
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={paymentAnalytics.outstandingByWorkType}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="workType" 
                      tickFormatter={formatWorkType}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => `₹${(value / 100).toLocaleString()}`} />
                    <Tooltip 
                      content={<CustomTooltip />}
                      labelFormatter={formatWorkType}
                    />
                    <Bar dataKey="totalDue" fill="#ef4444" name="Outstanding Amount" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Outstanding Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Work Type</th>
                      <th className="text-right p-2">Total Due</th>
                      <th className="text-right p-2">Outstanding Works</th>
                      <th className="text-right p-2">Average Due</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paymentAnalytics.outstandingByWorkType.map((item, index) => (
                      <tr key={index} className="border-b">
                        <td className="p-2 font-medium">{formatWorkType(item.workType)}</td>
                        <td className="p-2 text-right text-red-600">
                          {formatCurrency(item.totalDue)}
                        </td>
                        <td className="p-2 text-right">{item.workCount}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(item.averageDue)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}