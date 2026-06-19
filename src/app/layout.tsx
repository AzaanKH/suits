import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";

import { CartSyncProvider } from "@/components/cart/cart-sync-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { isCheckoutConfigured } from "@/lib/checkout-config";
import { isClerkConfigured } from "@/lib/clerk-config";

import { ConvexClientProvider } from "./convex-client-provider";
import "./globals.css";

const sans = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
});

const serif = Cormorant_Garamond({
  subsets: ["latin"],
  variable: "--font-cormorant",
  weight: ["500", "600"],
});

export const metadata: Metadata = {
  title: {
    default: "Arden Tailoring",
    template: "%s | Arden Tailoring",
  },
  description: "Made-to-measure suiting with a refined, modern point of view.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const checkoutEnabled = isCheckoutConfigured();
  const content = (
    <ConvexClientProvider>
      <Header checkoutEnabled={checkoutEnabled} />
      <CartSyncProvider />
      <main className="flex-1">{children}</main>
      <Footer />
      <Toaster />
    </ConvexClientProvider>
  );

  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col">
        {isClerkConfigured() ? (
          <ClerkProvider
            signInUrl="/sign-in"
            signUpUrl="/sign-up"
            signInFallbackRedirectUrl="/account"
            signUpFallbackRedirectUrl="/account"
          >
            {content}
          </ClerkProvider>
        ) : (
          content
        )}
      </body>
    </html>
  );
}
