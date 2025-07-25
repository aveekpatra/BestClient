import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { validateClientData } from "../lib/validation";
import { Doc } from "./_generated/dataModel";

// Create a new client
export const createClient = mutation({
  args: {
    name: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    panNumber: v.optional(v.string()),
    aadharNumber: v.optional(v.string()),
    usualWorkType: v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    ),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate client data
    const validation = validateClientData({
      name: args.name,
      dateOfBirth: args.dateOfBirth,
      address: args.address,
      phone: args.phone,
      email: args.email,
      panNumber: args.panNumber,
      aadharNumber: args.aadharNumber,
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Check for duplicate phone number
    const existingClient = await ctx.db
      .query("clients")
      .filter((q) => q.eq(q.field("phone"), args.phone))
      .first();

    if (existingClient) {
      throw new Error("A client with this phone number already exists");
    }

    // Check for duplicate PAN if provided
    if (args.panNumber) {
      const existingPAN = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("panNumber"), args.panNumber))
        .first();

      if (existingPAN) {
        throw new Error("A client with this PAN number already exists");
      }
    }

    // Check for duplicate Aadhar if provided
    if (args.aadharNumber) {
      const existingAadhar = await ctx.db
        .query("clients")
        .filter((q) => q.eq(q.field("aadharNumber"), args.aadharNumber))
        .first();

      if (existingAadhar) {
        throw new Error("A client with this Aadhar number already exists");
      }
    }

    const now = Date.now();
    
    return await ctx.db.insert("clients", {
      name: args.name.trim(),
      dateOfBirth: args.dateOfBirth,
      address: args.address.trim(),
      phone: args.phone,
      email: args.email?.trim(),
      panNumber: args.panNumber?.toUpperCase(),
      aadharNumber: args.aadharNumber,
      usualWorkType: args.usualWorkType,
      balance: args.balance,
      createdAt: now,
      updatedAt: now,
    });
  },
});

// Update an existing client
export const updateClient = mutation({
  args: {
    id: v.id("clients"),
    name: v.string(),
    dateOfBirth: v.string(),
    address: v.string(),
    phone: v.string(),
    email: v.optional(v.string()),
    panNumber: v.optional(v.string()),
    aadharNumber: v.optional(v.string()),
    usualWorkType: v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    ),
    balance: v.number(),
  },
  handler: async (ctx, args) => {
    // Validate client data
    const validation = validateClientData({
      name: args.name,
      dateOfBirth: args.dateOfBirth,
      address: args.address,
      phone: args.phone,
      email: args.email,
      panNumber: args.panNumber,
      aadharNumber: args.aadharNumber,
    });

    if (!validation.isValid) {
      throw new Error(`Validation failed: ${JSON.stringify(validation.errors)}`);
    }

    // Check if client exists
    const existingClient = await ctx.db.get(args.id);
    if (!existingClient) {
      throw new Error("Client not found");
    }

    // Check for duplicate phone number (excluding current client)
    const duplicatePhone = await ctx.db
      .query("clients")
      .filter((q) => 
        q.and(
          q.eq(q.field("phone"), args.phone),
          q.neq(q.field("_id"), args.id)
        )
      )
      .first();

    if (duplicatePhone) {
      throw new Error("A client with this phone number already exists");
    }

    // Check for duplicate PAN if provided (excluding current client)
    if (args.panNumber) {
      const duplicatePAN = await ctx.db
        .query("clients")
        .filter((q) => 
          q.and(
            q.eq(q.field("panNumber"), args.panNumber),
            q.neq(q.field("_id"), args.id)
          )
        )
        .first();

      if (duplicatePAN) {
        throw new Error("A client with this PAN number already exists");
      }
    }

    // Check for duplicate Aadhar if provided (excluding current client)
    if (args.aadharNumber) {
      const duplicateAadhar = await ctx.db
        .query("clients")
        .filter((q) => 
          q.and(
            q.eq(q.field("aadharNumber"), args.aadharNumber),
            q.neq(q.field("_id"), args.id)
          )
        )
        .first();

      if (duplicateAadhar) {
        throw new Error("A client with this Aadhar number already exists");
      }
    }

    return await ctx.db.patch(args.id, {
      name: args.name.trim(),
      dateOfBirth: args.dateOfBirth,
      address: args.address.trim(),
      phone: args.phone,
      email: args.email?.trim(),
      panNumber: args.panNumber?.toUpperCase(),
      aadharNumber: args.aadharNumber,
      usualWorkType: args.usualWorkType,
      balance: args.balance,
      updatedAt: Date.now(),
    });
  },
});

// Delete a client
export const deleteClient = mutation({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    // Check if client exists
    const client = await ctx.db.get(args.id);
    if (!client) {
      throw new Error("Client not found");
    }

    // Check if client has associated works
    const associatedWorks = await ctx.db
      .query("works")
      .withIndex("by_client", (q) => q.eq("clientId", args.id))
      .first();

    if (associatedWorks) {
      throw new Error("Cannot delete client with associated work records. Please delete all work records first.");
    }

    return await ctx.db.delete(args.id);
  },
});

// Get all clients with optional filtering and sorting
export const getClients = query({
  args: {
    limit: v.optional(v.number()),
    offset: v.optional(v.number()),
    sortBy: v.optional(v.union(
      v.literal("name"),
      v.literal("balance"),
      v.literal("createdAt"),
      v.literal("usualWorkType")
    )),
    sortOrder: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    workTypeFilter: v.optional(v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    )),
    balanceTypeFilter: v.optional(v.union(
      v.literal("positive"),
      v.literal("negative"),
      v.literal("zero")
    )),
    balanceMin: v.optional(v.number()),
    balanceMax: v.optional(v.number()),
    searchTerm: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let results: Doc<"clients">[];

    // Apply work type filter
    if (args.workTypeFilter) {
      results = await ctx.db
        .query("clients")
        .withIndex("by_work_type", (q) => 
          q.eq("usualWorkType", args.workTypeFilter!)
        )
        .collect();
    } else {
      results = await ctx.db.query("clients").collect();
    }

    // Apply search filter
    if (args.searchTerm) {
      const searchLower = args.searchTerm.toLowerCase();
      results = results.filter(client => 
        client.name.toLowerCase().includes(searchLower) ||
        client.address.toLowerCase().includes(searchLower) ||
        client.phone.includes(args.searchTerm!) ||
        (client.email && client.email.toLowerCase().includes(searchLower))
      );
    }

    // Apply balance type filter
    if (args.balanceTypeFilter) {
      results = results.filter(client => {
        switch (args.balanceTypeFilter) {
          case "positive":
            return client.balance > 0;
          case "negative":
            return client.balance < 0;
          case "zero":
            return client.balance === 0;
          default:
            return true;
        }
      });
    }

    // Apply balance range filter
    if (args.balanceMin !== undefined) {
      results = results.filter(client => client.balance >= args.balanceMin!);
    }
    if (args.balanceMax !== undefined) {
      results = results.filter(client => client.balance <= args.balanceMax!);
    }

    // Apply sorting
    if (args.sortBy) {
      results.sort((a, b) => {
        let aVal: any, bVal: any;
        
        switch (args.sortBy) {
          case "name":
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
            break;
          case "balance":
            aVal = a.balance;
            bVal = b.balance;
            break;
          case "createdAt":
            aVal = a.createdAt;
            bVal = b.createdAt;
            break;
          case "usualWorkType":
            aVal = a.usualWorkType;
            bVal = b.usualWorkType;
            break;
          default:
            aVal = a.name.toLowerCase();
            bVal = b.name.toLowerCase();
        }

        if (aVal < bVal) return args.sortOrder === "desc" ? 1 : -1;
        if (aVal > bVal) return args.sortOrder === "desc" ? -1 : 1;
        return 0;
      });
    }

    // Apply pagination
    const offset = args.offset || 0;
    const limit = args.limit || 50;
    const paginatedResults = results.slice(offset, offset + limit);

    return {
      clients: paginatedResults,
      total: results.length,
      hasMore: offset + limit < results.length,
    };
  },
});

// Get a single client by ID
export const getClientById = query({
  args: { id: v.id("clients") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.id);
  },
});

// Get clients by work type
export const getClientsByWorkType = query({
  args: {
    workType: v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others")
    ),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("clients")
      .withIndex("by_work_type", (q) => q.eq("usualWorkType", args.workType))
      .collect();
  },
});

// Get clients with balance in a specific range
export const getClientsWithBalance = query({
  args: {
    minBalance: v.optional(v.number()),
    maxBalance: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    let results = await ctx.db.query("clients").collect();

    if (args.minBalance !== undefined) {
      results = results.filter(client => client.balance >= args.minBalance!);
    }
    if (args.maxBalance !== undefined) {
      results = results.filter(client => client.balance <= args.maxBalance!);
    }

    return results;
  },
});

// Update client balance (used when works are added/modified/deleted)
export const updateClientBalance = mutation({
  args: {
    clientId: v.id("clients"),
    balanceChange: v.number(),
  },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    const newBalance = client.balance + args.balanceChange;
    
    return await ctx.db.patch(args.clientId, {
      balance: newBalance,
      updatedAt: Date.now(),
    });
  },
});

// Calculate and update client balance based on all their works
export const recalculateClientBalance = mutation({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Get all works for this client
    const works = await ctx.db
      .query("works")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Calculate total balance from all works
    const totalBalance = works.reduce((sum, work) => {
      return sum + (work.totalPrice - work.paidAmount);
    }, 0);

    return await ctx.db.patch(args.clientId, {
      balance: totalBalance,
      updatedAt: Date.now(),
    });
  },
});

// Get client count
export const getClientCount = query({
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    return clients.length;
  },
});

// Search clients by name, phone, or email
export const searchClients = query({
  args: { searchTerm: v.string() },
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    const searchLower = args.searchTerm.toLowerCase();
    
    return clients.filter(client => 
      client.name.toLowerCase().includes(searchLower) ||
      client.phone.includes(args.searchTerm) ||
      (client.email && client.email.toLowerCase().includes(searchLower))
    );
  },
});

// Get clients by balance type (positive, negative, zero)
export const getClientsByBalanceType = query({
  args: {
    balanceType: v.union(
      v.literal("positive"), // Client owes business
      v.literal("negative"), // Business owes client
      v.literal("zero")      // Balanced
    ),
  },
  handler: async (ctx, args) => {
    const clients = await ctx.db.query("clients").collect();
    
    return clients.filter(client => {
      switch (args.balanceType) {
        case "positive":
          return client.balance > 0;
        case "negative":
          return client.balance < 0;
        case "zero":
          return client.balance === 0;
        default:
          return false;
      }
    });
  },
});

// Validate balance consistency for a client
export const validateClientBalance = query({
  args: { clientId: v.id("clients") },
  handler: async (ctx, args) => {
    const client = await ctx.db.get(args.clientId);
    if (!client) {
      throw new Error("Client not found");
    }

    // Get all works for this client
    const works = await ctx.db
      .query("works")
      .withIndex("by_client", (q) => q.eq("clientId", args.clientId))
      .collect();

    // Calculate expected balance from works
    const calculatedBalance = works.reduce((sum, work) => {
      return sum + (work.totalPrice - work.paidAmount);
    }, 0);

    return {
      clientId: args.clientId,
      storedBalance: client.balance,
      calculatedBalance,
      isConsistent: client.balance === calculatedBalance,
      difference: client.balance - calculatedBalance,
    };
  },
});

// Fix balance inconsistencies for all clients
export const fixAllBalanceInconsistencies = mutation({
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    const fixes = [];

    for (const client of clients) {
      // Get all works for this client
      const works = await ctx.db
        .query("works")
        .withIndex("by_client", (q) => q.eq("clientId", client._id))
        .collect();

      // Calculate correct balance
      const correctBalance = works.reduce((sum, work) => {
        return sum + (work.totalPrice - work.paidAmount);
      }, 0);

      // Update if inconsistent
      if (client.balance !== correctBalance) {
        await ctx.db.patch(client._id, {
          balance: correctBalance,
          updatedAt: Date.now(),
        });

        fixes.push({
          clientId: client._id,
          clientName: client.name,
          oldBalance: client.balance,
          newBalance: correctBalance,
          difference: correctBalance - client.balance,
        });
      }
    }

    return fixes;
  },
});