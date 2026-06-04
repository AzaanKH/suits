import { render, screen } from "@testing-library/react";
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

  const { Header } = await import("./header");
  render(<Header />);
}

describe("Header auth states", () => {
  afterEach(() => {
    vi.resetModules();
    vi.restoreAllMocks();
    delete process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  });

  it("shows sign-in actions when signed out", async () => {
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
  });

  it("shows account and user menu actions when signed in", async () => {
    await renderHeader("signed-in");

    expect(screen.getAllByRole("link", { name: /account/i })).not.toHaveLength(
      0,
    );
    expect(
      screen.getByRole("button", { name: "User menu" }),
    ).toBeInTheDocument();
  });
});
