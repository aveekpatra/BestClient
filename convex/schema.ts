import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  clients: defineTable({
    name: v.string(),
    dateOfBirth: v.string(), // DD/MM/YYYY format
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
      v.literal("others"),
    ),
    balance: v.number(), // Positive = client owes business, Negative = business owes client
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_name", ["name"])
    .index("by_work_type", ["usualWorkType"])
    .index("by_balance", ["balance"]),

  works: defineTable({
    clientId: v.id("clients"),
    transactionDate: v.string(), // DD/MM/YYYY format
    totalPrice: v.number(), // Amount in paise (₹1 = 100 paise)
    paidAmount: v.number(), // Amount in paise
    workType: v.union(
      v.literal("online-work"),
      v.literal("health-insurance"),
      v.literal("life-insurance"),
      v.literal("income-tax"),
      v.literal("mutual-funds"),
      v.literal("others"),
    ),
    description: v.string(),
    paymentStatus: v.union(
      v.literal("paid"),
      v.literal("partial"),
      v.literal("unpaid")
    ),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_date", ["transactionDate"])
    .index("by_payment_status", ["paymentStatus"])
    .index("by_work_type", ["workType"]),

  balanceHistory: defineTable({
    clientId: v.id("clients"),
    workId: v.optional(v.id("works")), // Associated work transaction if applicable
    previousBalance: v.number(),
    newBalance: v.number(),
    balanceChange: v.number(),
    changeType: v.union(
      v.literal("work_created"),
      v.literal("work_updated"),
      v.literal("work_deleted"),
      v.literal("manual_adjustment"),
      v.literal("balance_correction")
    ),
    description: v.string(),
    createdAt: v.number(),
  })
    .index("by_client", ["clientId"])
    .index("by_client_date", ["clientId", "createdAt"]),
});
