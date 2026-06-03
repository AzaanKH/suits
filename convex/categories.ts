import { query } from "./_generated/server";

export const active = query({
  args: {},
  handler: async (ctx) => {
    const categories = await ctx.db
      .query("categories")
      .withIndex("by_active_display_order", (q) => q.eq("active", true))
      .collect();

    return categories.map(({ _id, slug, name, description }) => ({
      id: _id,
      slug,
      name,
      description,
    }));
  },
});
