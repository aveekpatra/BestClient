import { query } from "./_generated/server";

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    // For now, return a simple user object
    // This will be replaced with proper auth implementation later
    return {
      id: "demo-user",
      name: "Demo User",
      email: "demo@example.com",
      authenticated: true
    };
  },
});