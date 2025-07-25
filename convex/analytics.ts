import { v } from "convex/values";
import { query } from "./_generated/server";
import { Doc } from "./_generated/dataModel";

// Helper function to parse DD/MM/YYYY date to timestamp for comparison
function parseIndianDate(dateStr: string): number {
  const [day, month, year] = dateStr.split('/').map(Number);
  return new Date(year, month - 1, day).getTime();
}

// Helper function to check if a date is within a range
function isDateInRange(dateStr: string, fromDate?: string, toDate?: string): boolean {
  if (!fromDate && !toDate) return true;
  
  const date = parseIndianDate(dateStr);
  const from = fromDate ? parseIndianDate(fromDate) : 0;
  const to = toDate ? parseIndianDate(toDate) : Date.now();
  
  return date >= from && date <= to;
}

// Helper function to get month/year key from DD/MM/YYYY date
function getMonthYearKey(dateStr: string): string {
  const [, month, year] = dateStr.split('/');
  return `${month}/${year}`;
}

// Get overview statistics (total clients, works, income, due amounts)
export const getOverviewStats = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get all clients
    const clients = await ctx.db.query("clients").collect();
    
    // Get all works (filtered by date if provided)
    const allWorks = await ctx.db.query("works").collect();
    const works = allWorks.filter(work => 
      isDateInRange(work.transactionDate, args.dateFrom, args.dateTo)
    );

    // Calculate overview statistics
    const totalClients = clients.length;
    const totalWorks = works.length;
    const totalIncome = works.reduce((sum, work) => sum + work.paidAmount, 0);
    const totalDue = works.reduce((sum, work) => sum + (work.totalPrice - work.paidAmount), 0);
    const totalValue = works.reduce((sum, work) => sum + work.totalPrice, 0);

    // Payment status breakdown
    const paidWorks = works.filter(work => work.paymentStatus === "paid").length;
    const partialWorks = works.filter(work => work.paymentStatus === "partial").length;
    const unpaidWorks = works.filter(work => work.paymentStatus === "unpaid").length;

    // Client balance breakdown
    const clientsWithPositiveBalance = clients.filter(client => client.balance > 0).length;
    const clientsWithNegativeBalance = clients.filter(client => client.balance < 0).length;
    const clientsWithZeroBalance = clients.filter(client => client.balance === 0).length;

    return {
      totalClients,
      totalWorks,
      totalIncome,
      totalDue,
      totalValue,
      paymentBreakdown: {
        paid: paidWorks,
        partial: partialWorks,
        unpaid: unpaidWorks,
      },
      clientBalanceBreakdown: {
        positive: clientsWithPositiveBalance,
        negative: clientsWithNegativeBalance,
        zero: clientsWithZeroBalance,
      },
    };
  },
});

// Get income analytics by time period and work type
export const getIncomeAnalytics = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    groupBy: v.optional(v.union(v.literal("month"), v.literal("workType"))),
  },
  handler: async (ctx, args) => {
    const allWorks = await ctx.db.query("works").collect();
    const works = allWorks.filter(work => 
      isDateInRange(work.transactionDate, args.dateFrom, args.dateTo)
    );

    if (args.groupBy === "month") {
      // Group by month/year
      const monthlyIncome: Record<string, { income: number; due: number; total: number; count: number }> = {};
      
      works.forEach(work => {
        const monthKey = getMonthYearKey(work.transactionDate);
        if (!monthlyIncome[monthKey]) {
          monthlyIncome[monthKey] = { income: 0, due: 0, total: 0, count: 0 };
        }
        monthlyIncome[monthKey].income += work.paidAmount;
        monthlyIncome[monthKey].due += (work.totalPrice - work.paidAmount);
        monthlyIncome[monthKey].total += work.totalPrice;
        monthlyIncome[monthKey].count += 1;
      });

      // Convert to array and sort by date
      const monthlyData = Object.entries(monthlyIncome)
        .map(([month, data]) => ({ month, ...data }))
        .sort((a, b) => {
          const [monthA, yearA] = a.month.split('/').map(Number);
          const [monthB, yearB] = b.month.split('/').map(Number);
          return yearA !== yearB ? yearA - yearB : monthA - monthB;
        });

      return { monthlyData };
    } else if (args.groupBy === "workType") {
      // Group by work type
      const workTypeIncome: Record<string, { income: number; due: number; total: number; count: number }> = {};
      
      works.forEach(work => {
        if (!workTypeIncome[work.workType]) {
          workTypeIncome[work.workType] = { income: 0, due: 0, total: 0, count: 0 };
        }
        workTypeIncome[work.workType].income += work.paidAmount;
        workTypeIncome[work.workType].due += (work.totalPrice - work.paidAmount);
        workTypeIncome[work.workType].total += work.totalPrice;
        workTypeIncome[work.workType].count += 1;
      });

      const workTypeData = Object.entries(workTypeIncome)
        .map(([workType, data]) => ({ workType, ...data }))
        .sort((a, b) => b.income - a.income);

      return { workTypeData };
    } else {
      // Return overall totals
      const totalIncome = works.reduce((sum, work) => sum + work.paidAmount, 0);
      const totalDue = works.reduce((sum, work) => sum + (work.totalPrice - work.paidAmount), 0);
      const totalValue = works.reduce((sum, work) => sum + work.totalPrice, 0);
      const totalCount = works.length;

      return {
        overall: {
          income: totalIncome,
          due: totalDue,
          total: totalValue,
          count: totalCount,
        },
      };
    }
  },
});

// Get client analytics (best clients, client distribution)
export const getClientAnalytics = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    const allWorks = await ctx.db.query("works").collect();
    const works = allWorks.filter(work => 
      isDateInRange(work.transactionDate, args.dateFrom, args.dateTo)
    );

    // Calculate client performance
    const clientPerformance: Record<string, {
      clientId: string;
      clientName: string;
      totalIncome: number;
      totalDue: number;
      totalValue: number;
      workCount: number;
      currentBalance: number;
      usualWorkType: string;
    }> = {};

    // Initialize all clients
    clients.forEach(client => {
      clientPerformance[client._id] = {
        clientId: client._id,
        clientName: client.name,
        totalIncome: 0,
        totalDue: 0,
        totalValue: 0,
        workCount: 0,
        currentBalance: client.balance,
        usualWorkType: client.usualWorkType,
      };
    });

    // Aggregate work data by client
    works.forEach(work => {
      if (clientPerformance[work.clientId]) {
        clientPerformance[work.clientId].totalIncome += work.paidAmount;
        clientPerformance[work.clientId].totalDue += (work.totalPrice - work.paidAmount);
        clientPerformance[work.clientId].totalValue += work.totalPrice;
        clientPerformance[work.clientId].workCount += 1;
      }
    });

    // Convert to array and sort by total income
    const clientData = Object.values(clientPerformance)
      .filter(client => client.workCount > 0) // Only include clients with works in the period
      .sort((a, b) => b.totalIncome - a.totalIncome);

    // Get top clients (limited)
    const limit = args.limit || 10;
    const topClients = clientData.slice(0, limit);

    // Client distribution by work type
    const workTypeDistribution: Record<string, number> = {};
    clients.forEach(client => {
      workTypeDistribution[client.usualWorkType] = (workTypeDistribution[client.usualWorkType] || 0) + 1;
    });

    const workTypeDistributionData = Object.entries(workTypeDistribution)
      .map(([workType, count]) => ({ workType, count }))
      .sort((a, b) => b.count - a.count);

    return {
      topClients,
      allClientData: clientData,
      workTypeDistribution: workTypeDistributionData,
      totalActiveClients: clientData.length,
    };
  },
});

// Get service analytics (popular services by income)
export const getServiceAnalytics = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allWorks = await ctx.db.query("works").collect();
    const works = allWorks.filter(work => 
      isDateInRange(work.transactionDate, args.dateFrom, args.dateTo)
    );

    // Aggregate service performance
    const servicePerformance: Record<string, {
      workType: string;
      totalIncome: number;
      totalDue: number;
      totalValue: number;
      workCount: number;
      averageValue: number;
      paidCount: number;
      partialCount: number;
      unpaidCount: number;
    }> = {};

    works.forEach(work => {
      if (!servicePerformance[work.workType]) {
        servicePerformance[work.workType] = {
          workType: work.workType,
          totalIncome: 0,
          totalDue: 0,
          totalValue: 0,
          workCount: 0,
          averageValue: 0,
          paidCount: 0,
          partialCount: 0,
          unpaidCount: 0,
        };
      }

      const service = servicePerformance[work.workType];
      service.totalIncome += work.paidAmount;
      service.totalDue += (work.totalPrice - work.paidAmount);
      service.totalValue += work.totalPrice;
      service.workCount += 1;

      // Count payment statuses
      if (work.paymentStatus === "paid") service.paidCount += 1;
      else if (work.paymentStatus === "partial") service.partialCount += 1;
      else service.unpaidCount += 1;
    });

    // Calculate averages and sort by income
    const serviceData = Object.values(servicePerformance)
      .map(service => ({
        ...service,
        averageValue: service.workCount > 0 ? service.totalValue / service.workCount : 0,
      }))
      .sort((a, b) => b.totalIncome - a.totalIncome);

    // Get service trends (monthly breakdown for each service)
    const serviceTrends: Record<string, Record<string, number>> = {};
    works.forEach(work => {
      const monthKey = getMonthYearKey(work.transactionDate);
      if (!serviceTrends[work.workType]) {
        serviceTrends[work.workType] = {};
      }
      serviceTrends[work.workType][monthKey] = (serviceTrends[work.workType][monthKey] || 0) + work.paidAmount;
    });

    return {
      servicePerformance: serviceData,
      serviceTrends,
      totalServices: serviceData.length,
    };
  },
});

// Get payment analytics (due money, collection efficiency)
export const getPaymentAnalytics = query({
  args: {
    dateFrom: v.optional(v.string()),
    dateTo: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const allWorks = await ctx.db.query("works").collect();
    const works = allWorks.filter(work => 
      isDateInRange(work.transactionDate, args.dateFrom, args.dateTo)
    );

    // Overall payment statistics
    const totalValue = works.reduce((sum, work) => sum + work.totalPrice, 0);
    const totalPaid = works.reduce((sum, work) => sum + work.paidAmount, 0);
    const totalDue = totalValue - totalPaid;
    const collectionEfficiency = totalValue > 0 ? (totalPaid / totalValue) * 100 : 0;

    // Payment status breakdown
    const paymentStatusBreakdown = {
      paid: {
        count: works.filter(work => work.paymentStatus === "paid").length,
        value: works.filter(work => work.paymentStatus === "paid").reduce((sum, work) => sum + work.totalPrice, 0),
      },
      partial: {
        count: works.filter(work => work.paymentStatus === "partial").length,
        value: works.filter(work => work.paymentStatus === "partial").reduce((sum, work) => sum + work.totalPrice, 0),
        paid: works.filter(work => work.paymentStatus === "partial").reduce((sum, work) => sum + work.paidAmount, 0),
      },
      unpaid: {
        count: works.filter(work => work.paymentStatus === "unpaid").length,
        value: works.filter(work => work.paymentStatus === "unpaid").reduce((sum, work) => sum + work.totalPrice, 0),
      },
    };

    // Monthly collection trends
    const monthlyCollection: Record<string, {
      totalValue: number;
      totalPaid: number;
      totalDue: number;
      efficiency: number;
      workCount: number;
    }> = {};

    works.forEach(work => {
      const monthKey = getMonthYearKey(work.transactionDate);
      if (!monthlyCollection[monthKey]) {
        monthlyCollection[monthKey] = {
          totalValue: 0,
          totalPaid: 0,
          totalDue: 0,
          efficiency: 0,
          workCount: 0,
        };
      }

      monthlyCollection[monthKey].totalValue += work.totalPrice;
      monthlyCollection[monthKey].totalPaid += work.paidAmount;
      monthlyCollection[monthKey].totalDue += (work.totalPrice - work.paidAmount);
      monthlyCollection[monthKey].workCount += 1;
    });

    // Calculate monthly efficiency
    Object.values(monthlyCollection).forEach(month => {
      month.efficiency = month.totalValue > 0 ? (month.totalPaid / month.totalValue) * 100 : 0;
    });

    const monthlyData = Object.entries(monthlyCollection)
      .map(([month, data]) => ({ month, ...data }))
      .sort((a, b) => {
        const [monthA, yearA] = a.month.split('/').map(Number);
        const [monthB, yearB] = b.month.split('/').map(Number);
        return yearA !== yearB ? yearA - yearB : monthA - monthB;
      });

    // Outstanding amounts by work type
    const outstandingByWorkType: Record<string, {
      workType: string;
      totalDue: number;
      workCount: number;
      averageDue: number;
    }> = {};

    works.filter(work => work.totalPrice > work.paidAmount).forEach(work => {
      const due = work.totalPrice - work.paidAmount;
      if (!outstandingByWorkType[work.workType]) {
        outstandingByWorkType[work.workType] = {
          workType: work.workType,
          totalDue: 0,
          workCount: 0,
          averageDue: 0,
        };
      }

      outstandingByWorkType[work.workType].totalDue += due;
      outstandingByWorkType[work.workType].workCount += 1;
    });

    const outstandingData = Object.values(outstandingByWorkType)
      .map(item => ({
        ...item,
        averageDue: item.workCount > 0 ? item.totalDue / item.workCount : 0,
      }))
      .sort((a, b) => b.totalDue - a.totalDue);

    return {
      overview: {
        totalValue,
        totalPaid,
        totalDue,
        collectionEfficiency,
        totalWorks: works.length,
      },
      paymentStatusBreakdown,
      monthlyCollection: monthlyData,
      outstandingByWorkType: outstandingData,
    };
  },
});