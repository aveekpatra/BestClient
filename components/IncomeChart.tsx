"use client";

import { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { formatCurrency } from "../lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { TrendingUp, BarChart3 } from "lucide-react";

interface IncomeChartProps {
  dateFrom?: string;
  dateTo?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function IncomeChart({ dateFrom, dateTo }: IncomeChartProps) {
  const [viewType, setViewType] = useState<"month" | "workType">("month");

  const monthlyData = useQuery(api.analytics.getIncomeAnalytics, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    groupBy: "month",
  });

  const workTypeData = useQuery(api.analytics.getIncomeAnalytics, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    groupBy: "workType",
  });

  const overallData = useQuery(api.analytics.getIncomeAnalytics, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  });

  if (!monthlyData || !workTypeData || !overallData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Income Analytics
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

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Income Analytics</h2>
        <p className="text-muted-foreground">Revenue trends and work type performance</p>
      </div>

      {/* Overall Summary */}
      {overallData.overall && (
        <Card>
          <CardHeader>
            <CardTitle>Overall Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(overallData.overall.income)}
                </div>
                <p className="text-sm text-muted-foreground">Total Income</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">
                  {formatCurrency(overallData.overall.due)}
                </div>
                <p className="text-sm text-muted-foreground">Total Due</p>
              </div>
              <div className="text-2xl font-bold text-center">
                {formatCurrency(overallData.overall.total)}
                <p className="text-sm text-muted-foreground">Total Value</p>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {overallData.overall.count}
                </div>
                <p className="text-sm text-muted-foreground">Total Works</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Chart Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Income Visualization
          </CardTitle>
          <div className="flex gap-2">
            <Button
              variant={viewType === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("month")}
            >
              Monthly Trend
            </Button>
            <Button
              variant={viewType === "workType" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewType("workType")}
            >
              By Work Type
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {viewType === "month" && monthlyData.monthlyData && (
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData.monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis tickFormatter={(value) => `₹${(value / 100).toLocaleString()}`} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="income" fill="#22c55e" name="Income" />
                  <Bar dataKey="due" fill="#ef4444" name="Due" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {viewType === "workType" && workTypeData.workTypeData && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* Bar Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={workTypeData.workTypeData}>
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
                    <Bar dataKey="income" fill="#22c55e" name="Income" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Pie Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={workTypeData.workTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ workType, percent }) => 
                        `${formatWorkType(workType)} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="income"
                    >
                      {workTypeData.workTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number) => [formatCurrency(value), "Income"]}
                      labelFormatter={formatWorkType}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Work Type Performance Table */}
      {workTypeData.workTypeData && (
        <Card>
          <CardHeader>
            <CardTitle>Work Type Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-2">Work Type</th>
                    <th className="text-right p-2">Income</th>
                    <th className="text-right p-2">Due</th>
                    <th className="text-right p-2">Total Value</th>
                    <th className="text-right p-2">Works</th>
                    <th className="text-right p-2">Avg Value</th>
                  </tr>
                </thead>
                <tbody>
                  {workTypeData.workTypeData.map((item, index) => (
                    <tr key={index} className="border-b">
                      <td className="p-2 font-medium">{formatWorkType(item.workType)}</td>
                      <td className="p-2 text-right text-green-600">
                        {formatCurrency(item.income)}
                      </td>
                      <td className="p-2 text-right text-red-600">
                        {formatCurrency(item.due)}
                      </td>
                      <td className="p-2 text-right">
                        {formatCurrency(item.total)}
                      </td>
                      <td className="p-2 text-right">{item.count}</td>
                      <td className="p-2 text-right">
                        {formatCurrency(item.averageValue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}