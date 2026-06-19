export type Suit3dCapability = {
  supported: boolean;
  simplified: boolean;
  reason: string | null;
};

type NavigatorWithSignals = Navigator & {
  deviceMemory?: number;
  connection?: {
    saveData?: boolean;
    effectiveType?: string;
  };
};

export function getSuit3dCapability(): Suit3dCapability {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return {
      supported: false,
      simplified: true,
      reason: "3D preview requires a browser.",
    };
  }

  if (!hasWebGLSupport()) {
    return {
      supported: false,
      simplified: true,
      reason: "This browser does not expose WebGL.",
    };
  }

  const navigatorWithSignals = window.navigator as NavigatorWithSignals;
  const reducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const narrowViewport = window.matchMedia("(max-width: 767px)").matches;
  const lowMemory =
    typeof navigatorWithSignals.deviceMemory === "number" &&
    navigatorWithSignals.deviceMemory <= 4;
  const lowCoreCount =
    typeof navigatorWithSignals.hardwareConcurrency === "number" &&
    navigatorWithSignals.hardwareConcurrency <= 4;
  const saveData = Boolean(navigatorWithSignals.connection?.saveData);
  const slowConnection =
    navigatorWithSignals.connection?.effectiveType === "slow-2g" ||
    navigatorWithSignals.connection?.effectiveType === "2g";
  const simplified =
    reducedMotion ||
    narrowViewport ||
    lowMemory ||
    lowCoreCount ||
    saveData ||
    slowConnection;

  return {
    supported: true,
    simplified,
    reason: simplified
      ? "3D preview is running with simplified rendering for this device."
      : null,
  };
}

function hasWebGLSupport() {
  const canvas = document.createElement("canvas");

  try {
    return Boolean(
      window.WebGLRenderingContext &&
      (canvas.getContext("webgl2") ||
        canvas.getContext("webgl") ||
        canvas.getContext("experimental-webgl")),
    );
  } catch {
    return false;
  }
}
