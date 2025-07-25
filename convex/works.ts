import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

// Helper function to get work types
function getWorkTypes(work: any): string[] {
  return work.workTypes || ["online-work"];
}

// Helper function to determine payment status
function determinePaymentStatus(
  totalPrice: number,
  paidAmount: number,
): "paid" | "partial" | "unpaid" {
  if (paidAmount <= 0) return "unpaid";
  if (paidAmount >= totalPrice) return "paid";
  return "partial";
}

// Helper function to update client balance and create history entry
async function updateClientBalance(
  ctx: any,
  clientId: Id<"clients">,
  balanceChange: number,
  workId?: Id<"works">,
  changeType:
    | "work_created"
    | "work_updated"
    | "work_deleted"
    | "payment_made" = "work_updated",
  description?: string,
) {
  // Get current client data
  const client = await ctx.db.get(clientId);
  if (!client) {
    throw new Error("Client not found");
  }

  const previousBalance = client.balance;
  const newBalance = previousBalance + balanceChange;

  // Update client balance
  await ctx.db.patch(clientId, {
    balance: newBalance,
    updatedAt: Date.now(),
  });

  // Create balance history entry if balance changed
  if (balanceChange !== 0) {
    await ctx.db.insert("balanceHistory", {
      clientId,
      workId,
      previousBalance,
      newBalance,
      balanceChange,
      changeType,
      description:
        description ||
        `Balance updated: ${balanceChange > 0 ? "+" : ""}${balanceChange}`,
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
    workTypes: v.array(
      v.union(
        v.literal("online-work"),
        v.literal("health-insurance"),
        v.literal("life-insurance"),
        v.literal("income-tax"),
        v.literal("p-tax"),
        v.literal("mutual-funds"),
        v.literal("others"),
      ),
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
    if (args.paidAmount < 0) {
      throw new Error("Paid amount cannot be negative");
    }

    // Determine payment status
    const paymentStatus = determinePaymentStatus(
      args.totalPrice,
      args.paidAmount,
    );

    // Create the work
    const workId = await ctx.db.insert("works", {
      clientId: args.clientId,
      transactionDate: args.transactionDate,
      totalPrice: args.totalPrice,
      paidAmount: args.paidAmount,
      workTypes: args.workTypes,
      description: args.description,
      paymentStatus,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update client balance: add work amount, subtract payment
    const balanceChange = args.totalPrice - args.paidAmount;
    await updateClientBalance(
      ctx,
      args.clientId,
      balanceChange,
      workId,
      "work_created",
      `Work created: ${args.description} (₹${args.totalPrice / 100} work, ₹${args.paidAmount / 100} paid)`,
    );

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
    workTypes: v.optional(
      v.array(
        v.union(
          v.literal("online-work"),
          v.literal("health-insurance"),
          v.literal("life-insurance"),
          v.literal("income-tax"),
          v.literal("p-tax"),
          v.literal("mutual-funds"),
          v.literal("others"),
        ),
      ),
    ),
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

    // Determine payment status
    const paymentStatus = determinePaymentStatus(totalPrice, paidAmount);

    // Update the work
    await ctx.db.patch(args.id, {
      ...(args.clientId && { clientId: args.clientId }),
      ...(args.transactionDate && { transactionDate: args.transactionDate }),
      ...(args.totalPrice !== undefined && { totalPrice: args.totalPrice }),
      ...(args.paidAmount !== undefined && { paidAmount: args.paidAmount }),
      ...(args.workTypes && { workTypes: args.workTypes }),
      ...(args.description && { description: args.description }),
      paymentStatus,
      updatedAt: Date.now(),
    });

    // Calculate balance changes
    const oldBalance = existingWork.totalPrice - existingWork.paidAmount;
    const newBalance = totalPrice - paidAmount;
    const balanceChange = newBalance - oldBalance;

    // Handle client change
    if (args.clientId && args.clientId !== existingWork.clientId) {
      // Remove old work impact from old client
      await updateClientBalance(
        ctx,
        existingWork.clientId,
        -oldBalance,
        args.id,
        "work_updated",
        `Work moved to another client: -₹${oldBalance / 100}`,
      );

      // Add new work impact to new client
      await updateClientBalance(
        ctx,
        args.clientId,
        newBalance,
        args.id,
        "work_updated",
        `Work moved from another client: +₹${newBalance / 100}`,
      );
    } else {
      // Same client, just update the difference
      const currentClientId = args.clientId ?? existingWork.clientId;
      if (balanceChange !== 0) {
        await updateClientBalance(
          ctx,
          currentClientId,
          balanceChange,
          args.id,
          "work_updated",
          `Work updated: ${args.description || existingWork.description} (${balanceChange > 0 ? "+" : ""}₹${balanceChange / 100})`,
        );
      }
    }

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

    // Reverse the balance impact of the deleted work
    const balanceChange = -(work.totalPrice - work.paidAmount);
    await updateClientBalance(
      ctx,
      clientId,
      balanceChange,
      args.id,
      "work_deleted",
      `Work deleted: ${work.description} (${balanceChange > 0 ? "+" : ""}₹${balanceChange / 100})`,
    );

    return args.id;
  },
});

// Get all works with optional filtering
export const getWorks = query({
  args: {
    clientId: v.optional(v.id("clients")),
    workType: v.optional(
      v.union(
        v.literal("online-work"),
        v.literal("health-insurance"),
        v.literal("life-insurance"),
        v.literal("income-tax"),
        v.literal("p-tax"),
        v.literal("mutual-funds"),
        v.literal("others"),
      ),
    ),
    paymentStatus: v.optional(
      v.union(v.literal("paid"), v.literal("partial"), v.literal("unpaid")),
    ),
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
        .withIndex("by_payment_status", (q: any) =>
          q.eq("paymentStatus", args.paymentStatus),
        )
        .collect();
    } else if (args.workType) {
      // Get all works and filter by work type since workTypes is now an array
      const allWorks = await ctx.db.query("works").collect();
      results = allWorks.filter(
        (work) => args.workType && work.workTypes.includes(args.workType),
      );
    } else {
      results = await ctx.db.query("works").collect();
    }

    // Apply additional filters that can't be done with indexes
    if (args.workType && !args.clientId) {
      results = results.filter((work) =>
        getWorkTypes(work).includes(args.workType!),
      );
    }
    if (args.paymentStatus && !args.clientId) {
      results = results.filter(
        (work) => work.paymentStatus === args.paymentStatus,
      );
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

    return works
      .filter((work) => {
        return (
          work.transactionDate >= args.dateFrom &&
          work.transactionDate <= args.dateTo
        );
      })
      .sort((a, b) => b.createdAt - a.createdAt);
  },
});

// Get works by payment status
export const getWorksByPaymentStatus = query({
  args: {
    paymentStatus: v.union(
      v.literal("paid"),
      v.literal("partial"),
      v.literal("unpaid"),
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("works")
      .withIndex("by_payment_status", (q) =>
        q.eq("paymentStatus", args.paymentStatus),
      )
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
    const totalDue = works.reduce(
      (sum, work) => sum + (work.totalPrice - work.paidAmount),
      0,
    );
    const totalValue = works.reduce((sum, work) => sum + work.totalPrice, 0);

    const paidWorks = works.filter(
      (work) => work.paymentStatus === "paid",
    ).length;
    const partialWorks = works.filter(
      (work) => work.paymentStatus === "partial",
    ).length;
    const unpaidWorks = works.filter(
      (work) => work.paymentStatus === "unpaid",
    ).length;

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
