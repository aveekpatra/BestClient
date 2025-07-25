"use client";

import { useState } from "react";
import AppLayout from "../../components/AppLayout";
import StatisticsOverview from "../../components/StatisticsOverview";
import IncomeChart from "../../components/IncomeChart";
import ClientAnalytics from "../../components/ClientAnalytics";
import ServiceAnalytics from "../../components/ServiceAnalytics";
import PaymentAnalytics from "../../components/PaymentAnalytics";
import { Card, CardContent, CardHeader, CardTitle } from "../../components/ui/card";
import { Input } from "../../components/ui/input";
import { Button } from "../../components/ui/button";
import { CalendarDays, Filter } from "lucide-react";

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
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Statistics</h1>
          <p className="text-muted-foreground">
            View analytics and insights about your business
          </p>
        </div>

        {/* Date Range Filter */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Date Range Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 items-end">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">From Date (DD/MM/YYYY)</label>
                <Input
                  type="text"
                  placeholder="01/01/2024"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  pattern="\d{2}/\d{2}/\d{4}"
                />
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">To Date (DD/MM/YYYY)</label>
                <Input
                  type="text"
                  placeholder="31/12/2024"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  pattern="\d{2}/\d{2}/\d{4}"
                />
              </div>
              <div className="flex gap-2">
                <Button onClick={handleApplyFilters} className="flex items-center gap-2">
                  <Filter className="h-4 w-4" />
                  Apply
                </Button>
                <Button variant="outline" onClick={handleClearFilters}>
                  Clear
                </Button>
              </div>
            </div>
            {(appliedDateFrom || appliedDateTo) && (
              <div className="mt-4 p-3 bg-muted rounded-md">
                <p className="text-sm text-muted-foreground">
                  Showing data from{" "}
                  <span className="font-medium">
                    {appliedDateFrom || "beginning"}
                  </span>{" "}
                  to{" "}
                  <span className="font-medium">
                    {appliedDateTo || "now"}
                  </span>
                </p>
              </div>
            )}
          </CardContent>
        </Card>

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