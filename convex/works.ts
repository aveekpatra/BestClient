import { v } from "convex/values";
import { query } from "./_generated/server";

// Get works by client ID
export const getWorksByClient = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("works")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();
  },
});