import { cleanup, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, describe, expect, it, vi } from "vitest";

type AuthState = "signed-in" | "signed-out";

async function renderHeader(authState: AuthState) {
  vi.resetModules();
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY = "pk_test_mock";
  vi.doMock("@clerk/nextjs", () => ({
    Show: ({ children, when }: { children: ReactNode; when: AuthState }) =>
      when === authState ? <>{children}</> : null,
    UserButton: () => <button type="button">User menu</button>,
  }));
  vi.doMock("@/components/cart/cart-sheet", () => ({
    CartSheet: () => <button type="button">Cart (0)</button>,
  }));

  const { Header } = await import("./header");
  render(<Header checkoutEnabled={true} />);
}

describe("Header auth states", () => {
  afterEach(() => {
    cleanup();
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("shows sign-in actions when signed out", async () => {
    const user = userEvent.setup();
    await renderHeader("signed-out");

    expect(screen.getAllByRole("link", { name: /sign in/i })).not.toHaveLength(
      0,
    );
    expect(
      screen.getAllByRole("link", { name: /create account/i }),
    ).not.toHaveLength(0);
    expect(
      screen.queryByRole("button", { name: "User menu" }),
    ).not.toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );

    const mobileNav = within(
      screen.getByRole("navigation", { name: /mobile navigation/i }),
    );
    expect(
      mobileNav.getByRole("link", { name: /sign in/i }),
    ).toBeInTheDocument();
    expect(
      mobileNav.getByRole("link", { name: /create account/i }),
    ).toBeInTheDocument();
  });

  it("shows account and user menu actions when signed in", async () => {
    const user = userEvent.setup();
    await renderHeader("signed-in");

    expect(screen.getAllByRole("link", { name: /account/i })).not.toHaveLength(
      0,
    );
    expect(screen.getByRole("link", { name: "Designs" })).toHaveAttribute(
      "href",
      "/account/designs",
    );
    expect(
      screen.getByRole("button", { name: "User menu" }),
    ).toBeInTheDocument();

    await user.click(
      screen.getByRole("button", { name: /open navigation menu/i }),
    );

    const mobileNav = within(
      screen.getByRole("navigation", { name: /mobile navigation/i }),
    );
    expect(
      mobileNav.queryByRole("link", { name: /sign in/i }),
    ).not.toBeInTheDocument();
    expect(
      mobileNav.queryByRole("link", { name: /create account/i }),
    ).not.toBeInTheDocument();
    expect(
      mobileNav.getByRole("link", { name: /saved designs/i }),
    ).toHaveAttribute("href", "/account/designs");
  });
});
