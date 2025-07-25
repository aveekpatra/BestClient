import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Create a balance history entry
export const createBalanceHistoryEntry = mutation({
  args: {
    clientId: v.id("clients"),
    workId: v.optional(v.id("works")),
    previousBalance: v.number(),
    newBalance: v.number(),
    changeType: v.union(
      v.literal("work_created"),
      v.literal("work_updated"),
      v.literal("work_deleted"),
      v.literal("manual_adjustment"),
      v.literal("balance_correction")
    ),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    const balanceChange = args.newBalance - args.previousBalance;
    
    return await ctx.db.insert("balanceHistory", {
      clientId: args.clientId,
      workId: args.workId,
      previousBalance: args.previousBalance,
      newBalance: args.newBalance,
      balanceChange,
      changeType: args.changeType,
      description: args.description,
      createdAt: Date.now(),
    });
  },
});

// Get balance history for a client
export const getClientBalanceHistory = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 50;
    const offset = args.offset || 0;

    const history = await ctx.db
      .query("balanceHistory")
      .withIndex("by_client_date", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();

    const paginatedHistory = history.slice(offset, offset + limit);

    // Enrich with work details if workId exists
    const enrichedHistory = await Promise.all(
      paginatedHistory.map(async (entry) => {
        let workDetails = null;
        if (entry.workId) {
          workDetails = await ctx.db.get(entry.workId);
        }
        return {
          ...entry,
          workDetails,
        };
      })
    );

    return {
      history: enrichedHistory,
      total: history.length,
      hasMore: offset + limit < history.length,
    };
  },
});

// Get balance history with running balance calculations
export const getClientBalanceTimeline = query({
  args: {
    clientId: v.id("clients"),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = args.limit || 100;

    // Get client's current balance
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Get balance history in chronological order (oldest first)
    const history = await ctx.db
      .query("balanceHistory")
      .withIndex("by_client_date", (q) => q.eq("clientId", args.clientId))
      .order("asc")
      .take(limit);

    // Calculate running balance for timeline
    const timeline = [];
    let runningBalance = 0;

    for (const entry of history) {
      runningBalance = entry.newBalance;
      
      // Get work details if available
      let workDetails = null;
      if (entry.workId) {
        workDetails = await ctx.db.get(entry.workId);
      }

      timeline.push({
        ...entry,
        runningBalance,
        workDetails,
      });
    }

    return {
      timeline,
      currentBalance: client.balance,
      totalEntries: history.length,
    };
  },
});

// Get balance change summary for a date range
export const getBalanceChangeSummary = query({
  args: {
    clientId: v.id("clients"),
    fromDate: v.optional(v.number()),
    toDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let history = await ctx.db
      .query("balanceHistory")
      .withIndex("by_client_date", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Filter by date range if provided
    if (args.fromDate) {
      history = history.filter(entry => entry.createdAt >= args.fromDate!);
    }
    if (args.toDate) {
      history = history.filter(entry => entry.createdAt <= args.toDate!);
    }

    // Calculate summary statistics
    const totalIncrease = history
      .filter(entry => entry.balanceChange > 0)
      .reduce((sum, entry) => sum + entry.balanceChange, 0);

    const totalDecrease = history
      .filter(entry => entry.balanceChange < 0)
      .reduce((sum, entry) => sum + Math.abs(entry.balanceChange), 0);

    const netChange = totalIncrease - totalDecrease;

    // Group by change type
    const changesByType = history.reduce((acc, entry) => {
      if (!acc[entry.changeType]) {
        acc[entry.changeType] = {
          count: 0,
          totalChange: 0,
        };
      }
      acc[entry.changeType].count++;
      acc[entry.changeType].totalChange += entry.balanceChange;
      return acc;
    }, {} as Record<string, { count: number; totalChange: number }>);

    return {
      totalEntries: history.length,
      totalIncrease,
      totalDecrease,
      netChange,
      changesByType,
      dateRange: {
        from: args.fromDate,
        to: args.toDate,
      },
    };
  },
});

// Clean up old balance history entries (keep last N entries per client)
export const cleanupBalanceHistory = mutation({
  args: {
    keepLastN: v.optional(v.number()), // Default to 1000 entries per client
  },
  handler: async (ctx, args) => {
    const keepLastN = args.keepLastN || 1000;
    
    // Get all clients
    const clients = await ctx.db.query("clients").collect();
    let totalDeleted = 0;

    for (const client of clients) {
      // Get all history entries for this client, ordered by date (newest first)
      const history = await ctx.db
        .query("balanceHistory")
        .withIndex("by_client_date", (q) => q.eq("clientId", client._id))
        .order("desc")
        .collect();

      // Delete entries beyond the keepLastN limit
      if (history.length > keepLastN) {
        const entriesToDelete = history.slice(keepLastN);
        
        for (const entry of entriesToDelete) {
          await ctx.db.delete(entry._id);
          totalDeleted++;
        }
      }
    }

    return {
      clientsProcessed: clients.length,
      entriesDeleted: totalDeleted,
      keepLastN,
    };
  },
});