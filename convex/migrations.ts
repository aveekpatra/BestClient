import { internalMutation } from "./_generated/server";
import { v } from "convex/values";

// Migration to convert usualWorkType to usualWorkTypes
export const migrateClientWorkTypes = internalMutation({
  args: {},
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const clients = await ctx.db.query("clients").collect();
    let migrated = 0;
    let skipped = 0;

    for (const client of clients) {
      const clientData = client as any; // Type assertion to access old field

      // Check if client has old usualWorkType field and no new usualWorkTypes field
      if (clientData.usualWorkType && !clientData.usualWorkTypes) {
        await ctx.db.patch(client._id, {
          usualWorkTypes: [clientData.usualWorkType],
          // Remove the old field by setting it to undefined
          usualWorkType: undefined,
        } as any);
        migrated++;
      } else {
        skipped++;
      }
    }

    return {
      migrated,
      skipped,
    };
  },
});

// Migration to convert work workType to workTypes
export const migrateWorkTypes = internalMutation({
  args: {},
  returns: v.object({
    migrated: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const works = await ctx.db.query("works").collect();
    let migrated = 0;
    let skipped = 0;

    for (const work of works) {
      const workData = work as any; // Type assertion to access old field

      // Check if work has old workType field and no new workTypes field
      if (workData.workType && !workData.workTypes) {
        await ctx.db.patch(work._id, {
          workTypes: [workData.workType],
          // Remove the old field by setting it to undefined
          workType: undefined,
        } as any);
        migrated++;
      } else {
        skipped++;
      }
    }

    return {
      migrated,
      skipped,
    };
  },
});
