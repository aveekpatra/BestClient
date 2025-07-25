"use client";

import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import StatisticsOverview from "../../components/StatisticsOverview";
import IncomeChart from "../../components/IncomeChart";
import ClientAnalytics from "../../components/ClientAnalytics";
import ServiceAnalytics from "../../components/ServiceAnalytics";
import PaymentAnalytics from "../../components/PaymentAnalytics";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { BarChart3, CalendarDays, Filter } from "lucide-react";

export default function StatisticsPage() {
  const [dateFrom, setDateFrom] = useState<string>("");
  const [dateTo, setDateTo] = useState<string>("");
  const [appliedDateFrom, setAppliedDateFrom] = useState<string>("");
  const [appliedDateTo, setAppliedDateTo] = useState<string>("");

  const handleApplyFilters = () => {
    setAppliedDateFrom(dateFrom);
    setAppliedDateTo(dateTo);
  };

  const handleClearFilters = () => {
    setDateFrom("");
    setDateTo("");
    setAppliedDateFrom("");
    setAppliedDateTo("");
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-lg">
              <BarChart3 className="h-5 w-5 text-gray-600" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">
                Analytics & Statistics
              </h1>
              <p className="text-sm text-gray-500">
                View insights and analytics about your business
              </p>
            </div>
          </div>
        </div>

        {/* Date Range Filter */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <CalendarDays className="h-5 w-5 text-gray-500" />
            <h3 className="text-lg font-medium text-gray-900">
              Date Range Filter
            </h3>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                From Date
              </label>
              <Input
                type="text"
                placeholder="DD/MM/YYYY"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                pattern="\d{2}/\d{2}/\d{4}"
              />
            </div>
            <div className="flex-1">
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                To Date
              </label>
              <Input
                type="text"
                placeholder="DD/MM/YYYY"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="border-gray-200 focus:border-gray-300 focus:ring-gray-200"
                pattern="\d{2}/\d{2}/\d{4}"
              />
            </div>
            <div className="flex gap-2">
              <Button
                onClick={handleApplyFilters}
                className="flex items-center gap-2 bg-gray-900 hover:bg-gray-800"
              >
                <Filter className="h-4 w-4" />
                Apply
              </Button>
              <Button
                variant="outline"
                onClick={handleClearFilters}
                className="border-gray-200"
              >
                Clear
              </Button>
            </div>
          </div>

          {(appliedDateFrom || appliedDateTo) && (
            <div className="mt-4 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-sm text-gray-600">
                Showing data from{" "}
                <span className="font-medium text-gray-900">
                  {appliedDateFrom || "beginning"}
                </span>{" "}
                to{" "}
                <span className="font-medium text-gray-900">
                  {appliedDateTo || "now"}
                </span>
              </p>
            </div>
          )}
        </div>

        {/* Statistics Overview */}
        <StatisticsOverview dateFrom={appliedDateFrom} dateTo={appliedDateTo} />

        {/* Income Analytics */}
        <IncomeChart dateFrom={appliedDateFrom} dateTo={appliedDateTo} />

        {/* Client Analytics */}
        <ClientAnalytics dateFrom={appliedDateFrom} dateTo={appliedDateTo} />

        {/* Service Analytics */}
        <ServiceAnalytics dateFrom={appliedDateFrom} dateTo={appliedDateTo} />

        {/* Payment Analytics */}
        <PaymentAnalytics dateFrom={appliedDateFrom} dateTo={appliedDateTo} />
      </div>
    </AppLayout>
  );
}
