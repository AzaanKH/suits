import Stripe from "stripe";

export function getCheckoutSessionOrderData(session: Stripe.Checkout.Session) {
  const shippingAddress = getCheckoutSessionShippingAddress(session);

  return {
    ...(session.amount_subtotal !== null
      ? { stripeSubtotalCents: session.amount_subtotal }
      : {}),
    ...(session.total_details?.amount_tax !== undefined
      ? { stripeTaxCents: session.total_details.amount_tax }
      : {}),
    ...(session.amount_total !== null
      ? { stripeTotalCents: session.amount_total }
      : {}),
    ...(shippingAddress ? { shippingAddress } : {}),
  };
}

export function getCheckoutSessionShippingAddress(
  session: Stripe.Checkout.Session,
) {
  const shippingDetails = session.collected_information?.shipping_details;
  const address = shippingDetails?.address;
  const fullName = shippingDetails?.name ?? session.customer_details?.name;
  const email = session.customer_details?.email;
  const phone = session.customer_details?.phone;

  if (
    !address?.line1 ||
    !address.city ||
    !address.state ||
    !address.postal_code ||
    !address.country ||
    !fullName ||
    !email ||
    !phone
  ) {
    return undefined;
  }

  return {
    fullName,
    email,
    phone,
    line1: address.line1,
    ...(address.line2 ? { line2: address.line2 } : {}),
    city: address.city,
    state: address.state,
    postalCode: address.postal_code,
    country: address.country === "US" ? "United States" : address.country,
  };
}
