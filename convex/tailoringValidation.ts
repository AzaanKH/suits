import { v } from "convex/values";

export const tailoringValidator = v.object({
  version: v.literal(1),
  choices: v.record(v.string(), v.string()),
  dimensions: v.record(v.string(), v.number()),
});
