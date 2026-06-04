export function getSignInRedirectHref(returnTo: string) {
  return `/sign-in?redirect_url=${encodeURIComponent(returnTo)}`;
}
