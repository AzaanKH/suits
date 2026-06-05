import { convexTest } from "convex-test";
import type { TestConvexForDataModel } from "convex-test";
import { beforeEach, describe, expect, it } from "vitest";

import { api, internal } from "./_generated/api";
import type { DataModel, Id } from "./_generated/dataModel";
import schema from "./schema";
import { modules } from "./test.setup";

const processingSecret = "test_stripe_processing_secret";

type TestConfiguration = {
  version: 1;
  productId: Id<"products">;
  productSlug: string;
  fabricCode: string;
  selectedOptionCodes: Record<string, string[]>;
  personalization: {
    monogramText: string;
    notes: string;
  };
};

const standardFitSelection = {
  fitMethod: "standard" as const,
  jacketSize: "40R",
  trouserWaist: "32",
  trouserInseam: "32",
  fitPreference: "classic" as const,
};

const shippingAddress = {
  fullName: "Azaan Khalfe",
  email: "azaan@example.com",
  phone: "5551234567",
  line1: "100 Market Street",
  city: "San Francisco",
  state: "CA",
  postalCode: "94105",
  country: "United States",
};

beforeEach(() => {
  process.env.STRIPE_WEBHOOK_PROCESSING_SECRET = processingSecret;
});

describe("orders", () => {
  it("creates an order from server-validated cart contents", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const configuration = await buildValidConfiguration(t);
    const user = t.withIdentity({
      subject: "user_orders",
      issuer: "https://example.clerk.accounts.dev",
    });

    await user.mutation(api.carts.addLine, {
      configuration,
      fitSelection: standardFitSelection,
      quantity: 2,
    });

    const order = await user.mutation(api.orders.createPendingFromCart, {
      shippingAddress,
      currency: "usd",
    });

    expect(order.subtotalCents).toBe((119500 + 3500 + 3500) * 2);
    expect(order.itemCount).toBe(2);
    expect(order.lineItems[0].unitPriceCents).toBe(119500 + 3500 + 3500);

    const detail = await user.query(api.orders.detail, {
      orderId: order.orderId,
    });
    expect(detail.order.paymentStatus).toBe("checkout_pending");
    expect(detail.items).toHaveLength(1);
    expect(detail.items[0].configurationSnapshot.personalization).toEqual({
      monogramText: "AK",
      notes: "Cleaner trouser break.",
    });
  });

  it("processes paid webhooks once and clears the cart after payment", async () => {
    const t = convexTest(schema, modules);
    await t.mutation(internal.seed.seed);
    const configuration = await buildValidConfiguration(t);
    const user = t.withIdentity({
      subject: "user_paid_order",
      issuer: "https://example.clerk.accounts.dev",
    });

    await user.mutation(api.carts.addLine, {
      configuration,
      fitSelection: standardFitSelection,
      quantity: 1,
    });
    const order = await user.mutation(api.orders.createPendingFromCart, {
      shippingAddress,
      currency: "usd",
    });
    await user.mutation(api.orders.attachCheckoutSession, {
      orderId: order.orderId,
      stripeCheckoutSessionId: "cs_test_paid",
    });

    const firstResult = await t.mutation(
      api.orders.recordCheckoutSessionStatus,
      {
        processingSecret,
        stripeEventId: "evt_paid_once",
        eventType: "checkout.session.completed",
        checkoutSessionId: "cs_test_paid",
        paymentIntentId: "pi_test_paid",
        paymentStatus: "paid",
        orderId: order.orderId,
      },
    );
    const duplicateResult = await t.mutation(
      api.orders.recordCheckoutSessionStatus,
      {
        processingSecret,
        stripeEventId: "evt_paid_once",
        eventType: "checkout.session.completed",
        checkoutSessionId: "cs_test_paid",
        paymentIntentId: "pi_test_paid",
        paymentStatus: "paid",
        orderId: order.orderId,
      },
    );

    expect(firstResult.status).toBe("processed");
    expect(duplicateResult.status).toBe("duplicate");

    const detail = await user.query(api.orders.detail, {
      orderId: order.orderId,
    });
    expect(detail.order.paymentStatus).toBe("paid");
    expect(detail.order.stripePaymentIntentId).toBe("pi_test_paid");

    const cart = await user.query(api.carts.mine, {});
    expect(cart.lineItems).toHaveLength(0);

    const eventCount = await t.run(async (ctx) => {
      return (
        await ctx.db
          .query("stripeEvents")
          .withIndex("by_stripe_event_id", (q) =>
            q.eq("stripeEventId", "evt_paid_once"),
          )
          .collect()
      ).length;
    });
    expect(eventCount).toBe(1);
  });

  it("rejects webhook processing without the shared server secret", async () => {
    const t = convexTest(schema, modules);

    await expect(
      t.mutation(api.orders.recordPaymentIntentStatus, {
        processingSecret: "wrong",
        stripeEventId: "evt_wrong_secret",
        eventType: "payment_intent.succeeded",
        paymentIntentId: "pi_wrong_secret",
        paymentStatus: "paid",
      }),
    ).rejects.toThrow("Unauthorized webhook processing.");
  });
});

async function buildValidConfiguration(
  t: TestConvexForDataModel<DataModel>,
): Promise<TestConfiguration> {
  const product = await t.run(async (ctx) => {
    const record = await ctx.db
      .query("products")
      .withIndex("by_slug", (q) => q.eq("slug", "house-navy-hopsack-suit"))
      .unique();

    if (!record) {
      throw new Error("Missing test product.");
    }

    return record;
  });

  return {
    version: 1,
    productId: product._id,
    productSlug: product.slug,
    fabricCode: "navy-hopsack",
    selectedOptionCodes: {
      "jacket-style": ["single-breasted-two-button"],
      lapel: ["notch-lapel"],
      buttons: ["horn-buttons"],
      pockets: ["slanted-flap-pockets"],
      trousers: ["side-adjusters"],
      extras: ["personal-monogram"],
    },
    personalization: {
      monogramText: "ak",
      notes: " Cleaner trouser break. ",
    },
  };
}
