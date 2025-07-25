import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to determine payment status
function determinePaymentStatus(totalPrice: number, paidAmount: number): "paid" | "partial" | "unpaid" {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalPrice) return "paid";
  return "partial";
}

// Helper function to calculate balance (total price - paid amount)
function calculateBalance(totalPrice: number, paidAmount: number): number {
  return totalPrice - paidAmount;
}

// Helper function to update client balance and create history entry
async function updateClientBalance(ctx: any, clientId: Id<"clients">, workId?: Id<"works">, changeType: "work_created" | "work_updated" | "work_deleted" = "work_updated", description?: string) {
  // Get current client data
  const client = await ctx.db.get(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const previousBalance = client.balance;

  // Get all works for this client
  const works = await ctx.db
    .query("works")
    .withIndex("by_client", (q: any) => q.eq("clientId", clientId))
    .collect();

  // Calculate total balance (sum of all work balances)
  const newBalance = works.reduce((sum: number, work: any) => {
    return sum + calculateBalance(work.totalPrice, work.paidAmount);
  }, 0);

  // Update client balance
  await ctx.db.patch(clientId, {
    balance: newBalance,
    updatedAt: Date.now(),
  });

  // Create balance history entry if balance changed
  if (previousBalance !== newBalance) {
    await ctx.db.insert("balanceHistory", {
      clientId,
      workId,
      previousBalance,
      newBalance,
      balanceChange: newBalance - previousBalance,
      changeType,
      description: description || `Balance updated due to ${changeType.replace('_', ' ')}`,
      createdAt: Date.now(),
    });
  }
}

// Create a new work transaction
export const createWork = mutation({
  args: {
    clientId: v.id("clients"),
    transactionDate: v.string(),
    totalPrice: v.number(),
    paidAmount: v.number(),
    workType: v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    ),
    description: v.string(),
  },
  handler: async (ctx, args) => {
    // Validate that client exists
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Validate amounts
    if (args.totalPrice < 0) {
      throw new Error("Total price cannot be negative");
    }
    if (args.paidAmount < 0) {
      throw new Error("Paid amount cannot be negative");
    }
    if (args.paidAmount > args.totalPrice) {
      throw new Error("Paid amount cannot exceed total price");
    }

    // Determine payment status
    const paymentStatus = determinePaymentStatus(args.totalPrice, args.paidAmount);

    // Create the work
    const workId = await ctx.db.insert("works", {
      clientId: args.clientId,
      transactionDate: args.transactionDate,
      totalPrice: args.totalPrice,
      paidAmount: args.paidAmount,
      workType: args.workType,
      description: args.description,
      paymentStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update client balance and create history entry
    await updateClientBalance(ctx, args.clientId, workId, "work_created", `Work created: ${args.description}`);

    return workId;
  },
});

// Update an existing work transaction
export const updateWork = mutation({
  args: {
    id: v.id("works"),
    clientId: v.optional(v.id("clients")),
    transactionDate: v.optional(v.string()),
    totalPrice: v.optional(v.number()),
    paidAmount: v.optional(v.number()),
    workType: v.optional(v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    )),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const existingWork = await ctx.db.get(args.id);
    if (!existingWork) {
      throw new Error("Work not found");
    }

    // If client is being changed, validate new client exists
    if (args.clientId && args.clientId !== existingWork.clientId) {
      const newClient = await ctx.db.get(args.clientId);
      if (!newClient) {
        throw new Error("New client not found");
      }
    }

    // Get updated values
    const totalPrice = args.totalPrice ?? existingWork.totalPrice;
    const paidAmount = args.paidAmount ?? existingWork.paidAmount;

    // Validate amounts
    if (totalPrice < 0) {
      throw new Error("Total price cannot be negative");
    }
    if (paidAmount < 0) {
      throw new Error("Paid amount cannot be negative");
    }
    if (paidAmount > totalPrice) {
      throw new Error("Paid amount cannot exceed total price");
    }

    // Determine payment status
    const paymentStatus = determinePaymentStatus(totalPrice, paidAmount);

    // Update the work
    await ctx.db.patch(args.id, {
      ...(args.clientId && { clientId: args.clientId }),
      ...(args.transactionDate && { transactionDate: args.transactionDate }),
      ...(args.totalPrice !== undefined && { totalPrice: args.totalPrice }),
      ...(args.paidAmount !== undefined && { paidAmount: args.paidAmount }),
      ...(args.workType && { workType: args.workType }),
      ...(args.description && { description: args.description }),
      paymentStatus,
      updatedAt: Date.now(),
    });

    // Update balance for old client if client changed
    if (args.clientId && args.clientId !== existingWork.clientId) {
      await updateClientBalance(ctx, existingWork.clientId, args.id, "work_updated", `Work moved from client`);
    }

    // Update balance for current client
    const currentClientId = args.clientId ?? existingWork.clientId;
    await updateClientBalance(ctx, currentClientId, args.id, "work_updated", `Work updated: ${args.description || existingWork.description}`);

    return args.id;
  },
});

// Delete a work transaction
export const deleteWork = mutation({
  args: { id: v.id("works") },
  handler: async (ctx, args) => {
    const work = await ctx.db.get(args.id);
    if (!work) {
      throw new Error("Work not found");
    }

    const clientId = work.clientId;

    // Delete the work
    await ctx.db.delete(args.id);

    // Update client balance and create history entry
    await updateClientBalance(ctx, clientId, args.id, "work_deleted", `Work deleted: ${work.description}`);

    return args.id;
  },
});

// Get all works with optional filtering
export const getWorks = query({
  args: {
    clientId: v.optional(v.id("clients")),
    workType: v.optional(v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    )),
    paymentStatus: v.optional(v.union(
      v.literal("paid"),
      v.literal("partial"),
      v.literal("unpaid")
    )),
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results;

    // Apply filters using indexes where possible
    if (args.clientId) {
      results = await ctx.db
        .query("works")
        .withIndex("by_client", (q: any) => q.eq("clientId", args.clientId))
        .collect();
    } else if (args.paymentStatus) {
      results = await ctx.db
        .query("works")
        .withIndex("by_payment_status", (q: any) => q.eq("paymentStatus", args.paymentStatus))
        .collect();
    } else if (args.workType) {
      results = await ctx.db
        .query("works")
        .withIndex("by_work_type", (q: any) => q.eq("workType", args.workType))
        .collect();
    } else {
      results = await ctx.db.query("works").collect();
    }

    // Apply additional filters that can't be done with indexes
    if (args.workType && !args.clientId) {
      results = results.filter(work => work.workType === args.workType);
    }
    if (args.paymentStatus && !args.clientId) {
      results = results.filter(work => work.paymentStatus === args.paymentStatus);
    }

    // Sort by creation date (newest first)
    results.sort((a, b) => b.createdAt - a.createdAt);

    // Apply pagination
    if (args.offset) {
      results = results.slice(args.offset);
    }
    if (args.limit) {
      results = results.slice(0, args.limit);
    }

    return results;
  },
});

// Get works by client ID
export const getWorksByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("works")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .order("desc")
      .collect();
  },
});

// Get works by date range
export const getWorksByDateRange = query({
  args: {
    dateFrom: v.string(),
    dateTo: v.string(),
  },
  handler: async (ctx, args) => {
    const works = await ctx.db.query("works").collect();
    
    return works.filter(work => {
      return work.transactionDate >= args.dateFrom && work.transactionDate <= args.dateTo;
    }).sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get works by payment status
export const getWorksByPaymentStatus = query({
  args: {
    paymentStatus: v.union(
      v.literal("paid"),
      v.literal("partial"),
      v.literal("unpaid")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("works")
      .withIndex("by_payment_status", (q) => q.eq("paymentStatus", args.paymentStatus))
      .order("desc")
      .collect();
  },
});

// Get a single work by ID
export const getWorkById = query({
  args: { id: v.id("works") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get work statistics
export const getWorkStats = query({
  args: {},
  handler: async (ctx, args) => {
    const works = await ctx.db.query("works").collect();
    
    const totalWorks = works.length;
    const totalIncome = works.reduce((sum, work) => sum + work.paidAmount, 0);
    const totalDue = works.reduce((sum, work) => sum + calculateBalance(work.totalPrice, work.paidAmount), 0);
    const totalValue = works.reduce((sum, work) => sum + work.totalPrice, 0);
    
    const paidWorks = works.filter(work => work.paymentStatus === "paid").length;
    const partialWorks = works.filter(work => work.paymentStatus === "partial").length;
    const unpaidWorks = works.filter(work => work.paymentStatus === "unpaid").length;

    return {
      totalWorks,
      totalIncome,
      totalDue,
      totalValue,
      paidWorks,
      partialWorks,
      unpaidWorks,
    };
  },
});