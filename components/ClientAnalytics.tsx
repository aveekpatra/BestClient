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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Users, Crown, TrendingUp } from "lucide-react";

interface ClientAnalyticsProps {
  dateFrom?: string;
  dateTo?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export default function ClientAnalytics({ dateFrom, dateTo }: ClientAnalyticsProps) {
  const clientAnalytics = useQuery(api.analytics.getClientAnalytics, {
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit: 10,
  });

  if (!clientAnalytics) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Client Analytics
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
        <h2 className="text-2xl font-bold tracking-tight">Client Analytics</h2>
        <p className="text-muted-foreground">Client performance and distribution insights</p>
      </div>

      {/* Top Clients */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5" />
            Top Performing Clients
          </CardTitle>
        </CardHeader>
        <CardContent>
          {clientAnalytics.topClients.length > 0 ? (
            <div className="space-y-4">
              {/* Chart */}
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={clientAnalytics.topClients.slice(0, 8)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis 
                      dataKey="clientName" 
                      angle={-45}
                      textAnchor="end"
                      height={80}
                      interval={0}
                    />
                    <YAxis tickFormatter={(value) => `₹${(value / 100).toLocaleString()}`} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="totalIncome" fill="#22c55e" name="Income" />
                    <Bar dataKey="totalDue" fill="#ef4444" name="Due" />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-2">Rank</th>
                      <th className="text-left p-2">Client Name</th>
                      <th className="text-right p-2">Income</th>
                      <th className="text-right p-2">Due</th>
                      <th className="text-right p-2">Total Value</th>
                      <th className="text-right p-2">Works</th>
                      <th className="text-right p-2">Current Balance</th>
                      <th className="text-left p-2">Work Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {clientAnalytics.topClients.map((client, index) => (
                      <tr key={client.clientId} className="border-b">
                        <td className="p-2">
                          <div className="flex items-center gap-2">
                            {index < 3 && <Crown className="h-4 w-4 text-yellow-500" />}
                            #{index + 1}
                          </div>
                        </td>
                        <td className="p-2 font-medium">{client.clientName}</td>
                        <td className="p-2 text-right text-green-600">
                          {formatCurrency(client.totalIncome)}
                        </td>
                        <td className="p-2 text-right text-red-600">
                          {formatCurrency(client.totalDue)}
                        </td>
                        <td className="p-2 text-right">
                          {formatCurrency(client.totalValue)}
                        </td>
                        <td className="p-2 text-right">{client.workCount}</td>
                        <td className={`p-2 text-right ${
                          client.currentBalance > 0 ? 'text-green-600' : 
                          client.currentBalance < 0 ? 'text-red-600' : 
                          'text-muted-foreground'
                        }`}>
                          {formatCurrency(client.currentBalance)}
                        </td>
                        <td className="p-2">{formatWorkType(client.usualWorkType)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              No client data available for the selected period
            </p>
          )}
        </CardContent>
      </Card>

      {/* Client Distribution by Work Type */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Client Distribution by Work Type
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 md:grid-cols-2">
            {/* Pie Chart */}
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={clientAnalytics.workTypeDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ workType, percent }) => 
                      `${formatWorkType(workType)} ${(percent * 100).toFixed(0)}%`
                    }
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="count"
                  >
                    {clientAnalytics.workTypeDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(value: number) => [value, "Clients"]}
                    labelFormatter={formatWorkType}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>

            {/* Distribution Table */}
            <div className="space-y-4">
              <h4 className="font-semibold">Distribution Summary</h4>
              <div className="space-y-2">
                {clientAnalytics.workTypeDistribution.map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                      ></div>
                      <span className="font-medium">{formatWorkType(item.workType)}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-bold">{item.count}</div>
                      <div className="text-sm text-muted-foreground">
                        {((item.count / clientAnalytics.workTypeDistribution.reduce((sum, i) => sum + i.count, 0)) * 100).toFixed(1)}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Client Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="text-center">
              <div className="text-2xl font-bold">
                {clientAnalytics.totalActiveClients}
              </div>
              <p className="text-sm text-muted-foreground">Active Clients (with works)</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {clientAnalytics.topClients.length > 0 ? 
                  formatCurrency(clientAnalytics.topClients.reduce((sum, client) => sum + client.totalIncome, 0) / clientAnalytics.topClients.length) : 
                  '₹0'
                }
              </div>
              <p className="text-sm text-muted-foreground">Average Income per Client</p>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {clientAnalytics.topClients.length > 0 ? 
                  Math.round(clientAnalytics.topClients.reduce((sum, client) => sum + client.workCount, 0) / clientAnalytics.topClients.length) : 
                  0
                }
              </div>
              <p className="text-sm text-muted-foreground">Average Works per Client</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}