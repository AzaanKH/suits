"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";

export function CheckoutSessionReconciler({
  sessionIds,
}: {
  sessionIds: string[];
}) {
  const router = useRouter();
  const lastReconciledKey = useRef<string | null>(null);

  useEffect(() => {
    const key = JSON.stringify(sessionIds);

    if (sessionIds.length === 0 || lastReconciledKey.current === key) {
      return;
    }

    lastReconciledKey.current = key;
    let active = true;

    void Promise.all(
      sessionIds.map((sessionId) =>
        fetch("/api/checkout/reconcile", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ sessionId }),
        }),
      ),
    ).finally(() => {
      if (active) {
        router.refresh();
      }
    });

    return () => {
      active = false;
    };
  }, [router, sessionIds]);

  return null;
}
