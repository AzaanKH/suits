import type { ShippingAddressValues } from "@/features/checkout/schema";
import { getAddressFingerprint } from "@/lib/address-fingerprint";

const USPS_PRODUCTION_URL = "https://apis.usps.com";
const USPS_TEST_URL = "https://apis-tem.usps.com";
const TOKEN_REFRESH_BUFFER_MS = 60_000;
const USPS_REQUEST_TIMEOUT_MS = 8_000;

export class UspsAddressValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "UspsAddressValidationError";
  }
}

type UspsTokenResponse = {
  access_token?: string;
  expires_in?: number | string;
};

type UspsAddressResponse = {
  address?: {
    streetAddress?: string | null;
    secondaryAddress?: string | null;
    city?: string | null;
    state?: string | null;
    ZIPCode?: string | null;
    ZIPPlus4?: string | null;
  };
  additionalInfo?: {
    deliveryPoint?: string | null;
    carrierRoute?: string | null;
    DPVConfirmation?: string | null;
    DPVCMRA?: string | null;
    business?: string | null;
    centralDeliveryPoint?: string | null;
    vacant?: string | null;
  };
  corrections?: Array<{ code?: string | null; text?: string | null }>;
  matches?: Array<{ code?: string | null; text?: string | null }>;
  warnings?: Array<{ code?: string | null; text?: string | null }>;
  error?: { message?: string };
};

export type AddressValidationResult = {
  standardizedAddress?: ShippingAddressValues;
  dpvConfirmation?: string;
  corrections: Array<{ code: string; text: string }>;
  warnings: Array<{ code: string; text: string }>;
  indicators: {
    deliveryPoint?: string;
    carrierRoute?: string;
    cmra?: string;
    business?: string;
    centralDeliveryPoint?: string;
    vacant?: string;
  };
  addressChanged: boolean;
  behavior: "accept" | "add_unit" | "verify_unit" | "confirm";
};

let cachedToken:
  | {
      accessToken: string;
      expiresAt: number;
    }
  | undefined;

export async function validateUspsAddress(
  enteredAddress: ShippingAddressValues,
): Promise<AddressValidationResult> {
  const accessToken = await getUspsAccessToken();
  const url = new URL("/addresses/v3/address", getUspsBaseUrl());
  url.searchParams.set("streetAddress", enteredAddress.line1);

  if (enteredAddress.line2) {
    url.searchParams.set("secondaryAddress", enteredAddress.line2);
  }

  url.searchParams.set("city", enteredAddress.city);
  url.searchParams.set("state", enteredAddress.state);

  const [zipCode, zipPlus4] = enteredAddress.postalCode.split("-");
  url.searchParams.set("ZIPCode", zipCode);

  if (zipPlus4) {
    url.searchParams.set("ZIPPlus4", zipPlus4);
  }

  const response = await fetchWithTimeout(url, {
    headers: {
      accept: "application/json",
      authorization: `Bearer ${accessToken}`,
    },
    cache: "no-store",
  });
  const data = (await response.json().catch(() => ({}))) as UspsAddressResponse;

  if (!response.ok) {
    const message =
      data.error?.message ?? "USPS could not validate this address.";

    if (response.status >= 400 && response.status < 500) {
      throw new UspsAddressValidationError(message);
    }

    throw new Error(message);
  }

  const standardizedAddress = toStandardizedAddress(enteredAddress, data);
  const dpvConfirmation = cleanOptional(
    data.additionalInfo?.DPVConfirmation,
  )?.toUpperCase();

  return {
    ...(standardizedAddress ? { standardizedAddress } : {}),
    ...(dpvConfirmation ? { dpvConfirmation } : {}),
    corrections: cleanMessages(data.corrections),
    warnings: cleanMessages(data.warnings ?? data.matches),
    indicators: {
      deliveryPoint: cleanOptional(data.additionalInfo?.deliveryPoint),
      carrierRoute: cleanOptional(data.additionalInfo?.carrierRoute),
      cmra: cleanOptional(data.additionalInfo?.DPVCMRA),
      business: cleanOptional(data.additionalInfo?.business),
      centralDeliveryPoint: cleanOptional(
        data.additionalInfo?.centralDeliveryPoint,
      ),
      vacant: cleanOptional(data.additionalInfo?.vacant),
    },
    addressChanged: standardizedAddress
      ? getAddressFingerprint(enteredAddress) !==
        getAddressFingerprint(standardizedAddress)
      : false,
    behavior: getCheckoutBehavior(dpvConfirmation),
  };
}

export function getCheckoutBehavior(
  dpvConfirmation?: string,
): AddressValidationResult["behavior"] {
  switch (dpvConfirmation?.toUpperCase()) {
    case "Y":
      return "accept";
    case "D":
      return "add_unit";
    case "S":
      return "verify_unit";
    default:
      return "confirm";
  }
}

function toStandardizedAddress(
  enteredAddress: ShippingAddressValues,
  response: UspsAddressResponse,
) {
  const address = response.address;

  if (
    !address?.streetAddress ||
    !address.city ||
    !address.state ||
    !address.ZIPCode
  ) {
    return undefined;
  }

  return {
    ...enteredAddress,
    line1: address.streetAddress,
    line2: address.secondaryAddress ?? "",
    city: address.city,
    state: address.state,
    postalCode: address.ZIPPlus4
      ? `${address.ZIPCode}-${address.ZIPPlus4}`
      : address.ZIPCode,
    country: "United States",
  };
}

async function getUspsAccessToken() {
  if (
    cachedToken &&
    cachedToken.expiresAt - TOKEN_REFRESH_BUFFER_MS > Date.now()
  ) {
    return cachedToken.accessToken;
  }

  const clientId = process.env.USPS_CLIENT_ID;
  const clientSecret = process.env.USPS_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("USPS address validation is not configured.");
  }

  const response = await fetchWithTimeout(
    `${getUspsBaseUrl()}/oauth2/v3/token`,
    {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "client_credentials",
      }),
      cache: "no-store",
    },
  );
  const data = (await response.json().catch(() => ({}))) as UspsTokenResponse;

  if (!response.ok || !data.access_token) {
    throw new Error("USPS authentication failed.");
  }

  const expiresInSeconds = Number(data.expires_in);
  cachedToken = {
    accessToken: data.access_token,
    expiresAt:
      Date.now() +
      (Number.isFinite(expiresInSeconds) ? expiresInSeconds * 1000 : 300_000),
  };

  return cachedToken.accessToken;
}

function getUspsBaseUrl() {
  return process.env.USPS_API_ENV === "test"
    ? USPS_TEST_URL
    : USPS_PRODUCTION_URL;
}

function cleanMessages(
  messages?: Array<{ code?: string | null; text?: string | null }>,
) {
  return (messages ?? [])
    .map((message) => ({
      code: message.code?.trim() ?? "",
      text: message.text?.trim() ?? "",
    }))
    .filter((message) => message.code || message.text);
}

function cleanOptional(value?: string | null) {
  const cleaned = value?.trim();
  return cleaned || undefined;
}

async function fetchWithTimeout(input: URL | string, init: RequestInit = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    USPS_REQUEST_TIMEOUT_MS,
  );

  try {
    return await fetch(input, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timeoutId);
  }
}
