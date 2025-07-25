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
} from "recharts";
import { Briefcase, TrendingUp, Award } from "lucide-react";

interface ServiceAnalyticsProps {
  dateFrom?: string;
  dateTo?: string;
}

export default function ServiceAnalytics({ dateFrom, dateTo }: ServiceAnalyticsProps) {
  const serviceAnalytics = useQuery(api.analytics.getServiceAnalytics, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (!serviceAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="h-5 w-5" />
            Service Analytics
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
          <p className="font-medium">{formatWorkType(label || '')}</p>
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



  // Get all unique months for trend chart
  const allMonths = Array.from(new Set(
    Object.values(serviceAnalytics.serviceTrends)
      .flatMap(monthlyData => Object.keys(monthlyData as Record<string, number>))
  )).sort((a, b) => {
    const [monthA, yearA] = a.split('/').map(Number);
    const [monthB, yearB] = b.split('/').map(Number);
    return yearA !== yearB ? yearA - yearB : monthA - monthB;
  });

  // Prepare data for trend line chart
  const trendChartData = allMonths.map(month => {
    const monthData: Record<string, string | number> = { month };
    serviceAnalytics.servicePerformance.forEach(service => {
      const monthlyIncome = (serviceAnalytics.serviceTrends[service.workType] as Record<string, number>)?.[month] || 0;
      monthData[service.workType] = monthlyIncome;
    });
    return monthData;
  });

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Service Analytics</h2>
        <p className="text-muted-foreground">Service performance and popularity insights</p>
      </div>

      {/* Service Performance Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5" />
            Service Performance Overview
          </CardTitle>
        </CardHeader>
        <CardContent>
          {serviceAnalytics.servicePerformance.length > 0 ? (
            <div className="space-y-4">
              {/* Bar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={serviceAnalytics.servicePerformance}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="workType" 
                      tickFormatter={formatWorkType}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis tickFormatter={(value) => `₹${(value / 100).toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalIncome" fill="#22c55e" name="Income" />
                    <Bar dataKey="totalDue" fill="#ef4444" name="Due" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Performance Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Service Type</th>
                      <th className="text-right p-2">Income</th>
                      <th className="text-right p-2">Due</th>
                      <th className="text-right p-2">Total Value</th>
                      <th className="text-right p-2">Works</th>
                      <th className="text-right p-2">Avg Value</th>
                      <th className="text-right p-2">Paid</th>
                      <th className="text-right p-2">Partial</th>
                      <th className="text-right p-2">Unpaid</th>
                    </tr>
                  </thead>
                  <tbody>
                    {serviceAnalytics.servicePerformance.map((service) => (
                      <tr key={service.workType} className="border-b">
                        <td className="p-2 font-medium">{formatWorkType(service.workType)}</td>
                        <td className="p-2 text-right text-green-600">
                          {formatCurrency(service.totalIncome)}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          {formatCurrency(service.totalDue)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(service.totalValue)}
                        </td>
                        <td className="p-2 text-right">{service.workCount}</td>
                        <td className="p-2 text-right">
                          {formatCurrency(service.averageValue)}
                        </td>
                        <td className="p-2 text-right text-green-600">{service.paidCount}</td>
                        <td className="p-2 text-right text-yellow-600">{service.partialCount}</td>
                        <td className="p-2 text-right text-red-600">{service.unpaidCount}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No service data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Service Trends */}
      {trendChartData.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Service Income Trends
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 100).toLocaleString()}`} />
                  <Tooltip 
                    formatter={(value: number) => [formatCurrency(value), "Income"]}
                  />
                  {serviceAnalytics.servicePerformance.map((service, index) => (
                    <Line
                      key={service.workType}
                      type="monotone"
                      dataKey={service.workType}
                      stroke={COLORS[index % COLORS.length]}
                      strokeWidth={2}
                      name={formatWorkType(service.workType)}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Service Summary Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Most Popular Service</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceAnalytics.servicePerformance.length > 0 && (
              <>
                <div className="text-2xl font-bold">
                  {formatWorkType(serviceAnalytics.servicePerformance[0].workType)}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(serviceAnalytics.servicePerformance[0].totalIncome)} income
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Highest Average Value</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceAnalytics.servicePerformance.length > 0 && (
              <>
                <div className="text-2xl font-bold">
                  {formatWorkType(
                    serviceAnalytics.servicePerformance
                      .sort((a, b) => b.averageValue - a.averageValue)[0].workType
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(
                    serviceAnalytics.servicePerformance
                      .sort((a, b) => b.averageValue - a.averageValue)[0].averageValue
                  )} avg
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Best Collection Rate</CardTitle>
          </CardHeader>
          <CardContent>
            {serviceAnalytics.servicePerformance.length > 0 && (
              <>
                <div className="text-2xl font-bold">
                  {formatWorkType(
                    serviceAnalytics.servicePerformance
                      .sort((a, b) => (b.totalIncome / b.totalValue) - (a.totalIncome / a.totalValue))[0].workType
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {(
                    (serviceAnalytics.servicePerformance
                      .sort((a, b) => (b.totalIncome / b.totalValue) - (a.totalIncome / a.totalValue))[0].totalIncome /
                    serviceAnalytics.servicePerformance
                      .sort((a, b) => (b.totalIncome / b.totalValue) - (a.totalIncome / a.totalValue))[0].totalValue) * 100
                  ).toFixed(1)}% collected
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Services</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {serviceAnalytics.totalServices}
            </div>
            <p className="text-xs text-muted-foreground">
              Active service types
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}