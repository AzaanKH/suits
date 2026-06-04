"use client";

import { Show, UserButton } from "@clerk/nextjs";
import Link from "next/link";
import { Menu, ShoppingBag, UserRound, X } from "lucide-react";
import { useState } from "react";

import { PageContainer } from "@/components/layout/page-container";
import { useCartStore } from "@/store/cart-store";

const navigation = [
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];
const clerkConfigured = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const itemCount = useCartStore((state) =>
    state.items.reduce((total, item) => total + item.quantity, 0),
  );

  return (
    <header className="border-border/80 bg-background/95 sticky top-0 z-50 border-b backdrop-blur">
      <PageContainer className="flex h-20 items-center justify-between">
        <button
          type="button"
          className="text-ink inline-flex size-10 items-center justify-center md:hidden"
          aria-label={
            menuOpen ? "Close navigation menu" : "Open navigation menu"
          }
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? (
            <X aria-hidden="true" className="size-5" />
          ) : (
            <Menu aria-hidden="true" className="size-5" />
          )}
        </button>

        <nav className="hidden items-center gap-7 md:flex" aria-label="Primary">
          {navigation.map((item) => (
            <Link className="nav-link" href={item.href} key={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <Link
          href="/"
          className="text-ink absolute left-1/2 -translate-x-1/2 font-serif text-[2rem] leading-none tracking-[-0.08em]"
          aria-label="Arden home"
        >
          ARDEN
        </Link>

        <div className="flex items-center gap-1 sm:gap-3">
          <AuthHeaderControls />
          <Link
            href="/cart"
            data-testid="cart-link"
            className="text-ink inline-flex min-h-10 items-center gap-2 px-2 text-sm font-bold tracking-[0.08em] uppercase"
            aria-label={`Cart with ${itemCount} ${itemCount === 1 ? "item" : "items"}`}
          >
            <ShoppingBag aria-hidden="true" className="size-[1.1rem]" />
            <span className="hidden sm:inline">Cart</span>
            <span aria-hidden="true">({itemCount})</span>
          </Link>
        </div>
      </PageContainer>

      {menuOpen ? (
        <nav
          id="mobile-navigation"
          aria-label="Mobile navigation"
          className="border-border bg-background border-t px-5 py-6 md:hidden"
        >
          <div className="mx-auto flex max-w-[90rem] flex-col gap-1">
            {navigation.map((item) => (
              <Link
                className="text-ink py-3 font-serif text-4xl tracking-[-0.025em]"
                href={item.href}
                key={item.href}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <Link
              className="border-border mt-4 border-t pt-5 text-sm font-bold tracking-[0.12em] uppercase"
              href="/account"
              onClick={() => setMenuOpen(false)}
              prefetch={false}
            >
              My account
            </Link>
            <Show when="signed-out">
              <SignedOutHeaderLink onClick={() => setMenuOpen(false)} />
            </Show>
          </div>
        </nav>
      ) : null}
    </header>
  );
}

function AuthHeaderControls() {
  if (!clerkConfigured) {
    return (
      <Link
        href="/account"
        className="text-ink inline-flex size-10 items-center justify-center"
        aria-label="Account"
        prefetch={false}
      >
        <UserRound aria-hidden="true" className="size-[1.1rem]" />
      </Link>
    );
  }

  return (
    <>
      <Show when="signed-out">
        <div className="hidden items-center gap-1 sm:flex">
          <Link
            href="/sign-in"
            className="text-ink inline-flex min-h-10 items-center px-2 text-sm font-bold tracking-[0.08em] uppercase"
            prefetch={false}
          >
            Sign in
          </Link>
          <Link
            href="/sign-up"
            className="text-ink inline-flex min-h-10 items-center px-2 text-sm font-bold tracking-[0.08em] uppercase"
            prefetch={false}
          >
            Create account
          </Link>
        </div>
        <Link
          href="/sign-in"
          className="text-ink inline-flex size-10 items-center justify-center sm:hidden"
          aria-label="Sign in"
          prefetch={false}
        >
          <UserRound aria-hidden="true" className="size-[1.1rem]" />
        </Link>
      </Show>
      <Show when="signed-in">
        <Link
          href="/account"
          className="text-ink hidden min-h-10 items-center px-2 text-sm font-bold tracking-[0.08em] uppercase sm:inline-flex"
          prefetch={false}
        >
          Account
        </Link>
        <UserButton
          appearance={{
            elements: {
              avatarBox: "size-9",
            },
          }}
        />
      </Show>
    </>
  );
}

function SignedOutHeaderLink({ onClick }: { onClick: () => void }) {
  if (!clerkConfigured) {
    return null;
  }

  return (
    <div className="flex flex-col gap-3 pt-2">
      <Link
        className="text-muted-foreground text-sm font-bold tracking-[0.12em] uppercase"
        href="/sign-in"
        onClick={onClick}
        prefetch={false}
      >
        Sign in
      </Link>
      <Link
        className="text-muted-foreground text-sm font-bold tracking-[0.12em] uppercase"
        href="/sign-up"
        onClick={onClick}
        prefetch={false}
      >
        Create account
      </Link>
    </div>
  );
}
