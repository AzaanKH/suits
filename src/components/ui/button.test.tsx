import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Button } from "@/components/ui/button";

describe("Button", () => {
  it("renders its label", () => {
    render(<Button>Book a fitting</Button>);

    expect(
      screen.getByRole("button", { name: "Book a fitting" }),
    ).toBeInTheDocument();
  });
});
