import { ClerkProvider } from "@clerk/nextjs";
import type { Metadata } from "next";
import { Bodoni_Moda, Hanken_Grotesk, IBM_Plex_Mono } from "next/font/google";

import { CartSyncProvider } from "@/components/cart/cart-sync-provider";
import { Footer } from "@/components/layout/footer";
import { Header } from "@/components/layout/header";
import { Toaster } from "@/components/ui/sonner";
import { isCheckoutConfigured } from "@/lib/checkout-config";
import { isClerkConfigured } from "@/lib/clerk-config";

import { ConvexClientProvider } from "./convex-client-provider";
import "./globals.css";

// Cutting-room type: Bodoni for display, Hanken for text, Plex Mono for
// measurements, cloth specs and order numbers.
const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const text = Hanken_Grotesk({
  subsets: ["latin"],
  variable: "--font-text",
});

const data = IBM_Plex_Mono({
  subsets: ["latin"],
  variable: "--font-data",
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: {
    default: "Arden Tailoring",
    template: "%s | Arden Tailoring",
  },
  description:
    "Design your suit in the Arden studio. Cut to your measurements from cloth you choose.",
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
    <html
      lang="en"
      className={`${display.variable} ${text.variable} ${data.variable}`}
    >
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
