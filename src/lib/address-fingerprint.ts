export type AddressFingerprintInput = {
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
};

export function getAddressFingerprint(address: AddressFingerprintInput) {
  return [
    address.line1,
    address.line2 ?? "",
    address.city,
    address.state,
    address.postalCode,
    address.country,
  ]
    .map((value) => value.trim().toUpperCase().replace(/[.,]/g, ""))
    .join("|");
}
