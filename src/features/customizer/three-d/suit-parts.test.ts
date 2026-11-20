import { describe, expect, it } from "vitest";

import { getSuitPartForMesh, isStudioStepCode } from "./suit-parts";

describe("studio part registry", () => {
  it.each([
    ["single_lapel_peak", "lapel"],
    ["dinner_lapel_shawl", "lapel"],
    ["double_collar", "lapel"],
    ["single_pocket_flap", "pockets"],
    ["dinner_breast", "pockets"],
    ["single_ticket_flap", "pockets"],
    ["double_ticket_jetted", "pockets"],
    ["single_inpocket_chest_l", "pockets"],
    ["dinner_inpocket_pen_mouth", "pockets"],
    ["double_button_upper_9", "buttons"],
    ["single_buttonhole", "buttons"],
    ["single_body", "jacket-style"],
    ["double_cuff_15", "jacket-style"],
    ["trousers", "trousers"],
    ["pleat_-1_0", "trousers"],
    ["waist_adjuster_1", "trousers"],
    ["waist_loop_3", "trousers"],
    ["waistcoat", "extras"],
    ["vest_button_2", "extras"],
  ])("maps %s to the %s step", (mesh, step) => {
    expect(getSuitPartForMesh(mesh)?.step).toBe(step);
  });

  it.each(["single_shirt_7", "dinner_shirt_11", "shirt_button_0", "Scene"])(
    "leaves %s non-interactive",
    (mesh) => {
      expect(getSuitPartForMesh(mesh)).toBeNull();
    },
  );

  it("limits the studio to visual design steps", () => {
    expect(isStudioStepCode("lapel")).toBe(true);
    expect(isStudioStepCode("fit")).toBe(false);
    expect(isStudioStepCode("review")).toBe(false);
  });
});
