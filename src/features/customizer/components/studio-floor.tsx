"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { ArrowLeft } from "lucide-react";
import { Fragment, useEffect, useState, type ReactNode } from "react";

import { api } from "../../../../convex/_generated/api";
import { formatCurrency } from "@/lib/product-format";
import { useCustomizerStore } from "@/store/customizer-store";

import { calculateConfigurationPrice, getSelectedFabric } from "../pricing";
import type { GalleryDesign } from "../three-d/suit-gallery-designs";
import type { SavedDesignForGallery } from "../three-d/suit-gallery-designs";
import type { CustomizerCatalog, CustomizerConfiguration } from "../types";

const CLERK_CONFIGURED = Boolean(process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY);

export type SavedDesignsState = {
  designs: SavedDesignForGallery[] | undefined;
  signedIn: boolean;
  /** False when accounts are not set up at all, so there is nothing to sign in to. */
  accountsEnabled: boolean;
};

/**
 * Supplies the visitor's saved designs. Convex's auth hooks only exist under
 * the Clerk provider, so without Clerk this renders the children directly.
 */
export function WithSavedDesigns({
  children,
}: {
  children: (state: SavedDesignsState) => ReactNode;
}) {
  if (!CLERK_CONFIGURED)
    return children({
      designs: undefined,
      signedIn: false,
      accountsEnabled: false,
    });
  return <SavedDesignsQuery>{children}</SavedDesignsQuery>;
}

function SavedDesignsQuery({
  children,
}: {
  children: (state: SavedDesignsState) => ReactNode;
}) {
  const { isAuthenticated } = useConvexAuth();
  const designs = useQuery(
    api.savedDesigns.mine,
    isAuthenticated ? {} : "skip",
  );
  return children({
    designs: designs as SavedDesignForGallery[] | undefined,
    signedIn: isAuthenticated,
    accountsEnabled: true,
  });
}

export type SpecRow = { term: string; value: string };

/** The cutter's ticket for a design: cloth first, then each group in order. */
export function getSpecTicket(
  catalog: CustomizerCatalog,
  configuration: CustomizerConfiguration,
): SpecRow[] {
  const price = calculateConfigurationPrice(catalog, configuration);
  const fabric = getSelectedFabric(catalog, configuration);
  const groups = new Map<string, string[]>();
  for (const item of price.selectedModifiers) {
    if (item.stepCode === "fabric") continue;
    groups.set(item.groupLabel, [
      ...(groups.get(item.groupLabel) ?? []),
      item.optionLabel,
    ]);
  }
  return [
    ...(fabric
      ? [{ term: "Cloth", value: `${fabric.name} · ${fabric.weight}` }]
      : []),
    ...[...groups].map(([term, labels]) => ({
      term,
      value: labels.join(", "),
    })),
  ];
}

export function SpecTicket({
  rows,
  className = "atelier-ticket",
}: {
  rows: SpecRow[];
  className?: string;
}) {
  return (
    <dl className={className} aria-label="Specification">
      {rows.map((row) => (
        <Fragment key={row.term}>
          <dt>{row.term}</dt>
          <dd>{row.value}</dd>
        </Fragment>
      ))}
    </dl>
  );
}

const INVITE_KEY = "arden-studio-floor";
/** Invite the visitor to look around after a few changes and some time... */
const INVITE_AFTER_CHANGES = 3;
const INVITE_AFTER_MS = 25_000;
/** ...or after a while even without changes. */
const INVITE_AFTER_IDLE_MS = 90_000;

function readInviteState() {
  try {
    return window.sessionStorage.getItem(INVITE_KEY);
  } catch {
    return null;
  }
}

export function rememberFloorVisit() {
  try {
    window.sessionStorage.setItem(INVITE_KEY, "visited");
  } catch {
    // Private windows can refuse storage; the invite may show again. Harmless.
  }
}

/**
 * Becomes true once the visitor has been designing for a while: a few changes
 * and some time, or a longer stretch regardless. Once per browser session.
 */
export function useFloorInvitation(enabled: boolean) {
  // `/studio/<suit>?explore` invites straight away: a link to share, and a test hook.
  const [due, setDue] = useState(
    () =>
      typeof window !== "undefined" &&
      new URLSearchParams(window.location.search).has("explore"),
  );
  useEffect(() => {
    if (!enabled || due || readInviteState()) return;
    const start = Date.now();
    let changes = 0;
    const check = () => {
      const elapsed = Date.now() - start;
      if (
        (changes >= INVITE_AFTER_CHANGES && elapsed >= INVITE_AFTER_MS) ||
        elapsed >= INVITE_AFTER_IDLE_MS
      ) {
        setDue(true);
        return true;
      }
      return false;
    };
    const unsubscribe = useCustomizerStore.subscribe((state, previous) => {
      if (state.configuration !== previous.configuration) {
        changes += 1;
        check();
      }
    });
    const timer = window.setInterval(() => {
      if (check()) window.clearInterval(timer);
    }, 5_000);
    return () => {
      unsubscribe();
      window.clearInterval(timer);
    };
  }, [enabled, due]);
  return due;
}

export function FloorHint({
  stage,
  hasSaved,
  onShow,
  onDismiss,
}: {
  stage: "invite" | "found";
  hasSaved: boolean;
  onShow: () => void;
  onDismiss: () => void;
}) {
  return (
    <aside
      className="atelier-hint"
      data-stage={stage}
      role="status"
      aria-live="polite"
    >
      {stage === "invite" ? (
        <>
          <p>
            <strong>Take a look around.</strong> Other suits are standing on the
            floor: house picks
            {hasSaved ? " and the designs you've saved" : ""}. Drag to turn, and
            they&apos;ll step out.
          </p>
          <div>
            <button type="button" className="is-primary" onClick={onShow}>
              Show me
            </button>
            <button type="button" onClick={onDismiss}>
              Not now
            </button>
          </div>
        </>
      ) : (
        <>
          <p>
            <strong>Walk up to any suit</strong> by clicking it or its tag.
            &ldquo;Wear this design&rdquo; puts it on your own.
          </p>
          <div>
            <button type="button" onClick={onDismiss}>
              Got it
            </button>
          </div>
        </>
      )}
    </aside>
  );
}

export function FloorPanel({
  catalog,
  designs,
  inspected,
  savedDesigns,
  onInspect,
  onWear,
  onLeave,
}: {
  catalog: CustomizerCatalog;
  designs: GalleryDesign[];
  inspected: GalleryDesign | null;
  savedDesigns: SavedDesignsState;
  onInspect: (id: string | null) => void;
  onWear: (design: GalleryDesign) => void;
  onLeave: () => void;
}) {
  return (
    <>
      <div className="atelier-panel-heading">
        <button type="button" className="atelier-text-button" onClick={onLeave}>
          <ArrowLeft aria-hidden="true" className="size-3.5" />
          Back to my suit
        </button>
        <h1>{inspected ? inspected.name : "On the floor"}</h1>
        <p>
          {inspected
            ? inspected.sourceLabel
            : "Click a suit in the room, or a name below, to walk up to it."}
        </p>
      </div>
      <div className="atelier-options">
        {inspected ? (
          <div className="grid gap-4">
            <SpecTicket
              rows={getSpecTicket(catalog, inspected.configuration)}
              className="atelier-ticket is-inline"
            />
            <p className="atelier-floor-price">
              {formatCurrency(
                calculateConfigurationPrice(catalog, inspected.configuration)
                  .totalPriceCents,
              )}
            </p>
            {inspected.source === "house" ? (
              <p className="atelier-floor-note">
                Wearing it keeps your own fit and personal details.
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="atelier-floor-list">
            {designs.map((design) => {
              const rows = getSpecTicket(catalog, design.configuration);
              const summary = rows
                .filter((r) => r.term !== "Cloth")
                .slice(0, 2)
                .map((r) => r.value)
                .join(" · ");
              return (
                <li key={design.id}>
                  <button type="button" onClick={() => onInspect(design.id)}>
                    <span>{design.name}</span>
                    <small>
                      {design.sourceLabel} · {summary}
                    </small>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
        {!inspected &&
        savedDesigns.accountsEnabled &&
        !savedDesigns.signedIn ? (
          <p className="atelier-floor-note">
            <Link href="/sign-in" prefetch={false}>
              Sign in
            </Link>{" "}
            to see your saved designs here too.
          </p>
        ) : null}
      </div>
      <div className="atelier-panel-actions">
        {inspected ? (
          <>
            <button
              type="button"
              className="atelier-secondary"
              onClick={() => onInspect(null)}
            >
              All suits
            </button>
            <button
              type="button"
              className="atelier-primary"
              onClick={() => onWear(inspected)}
            >
              Wear this design
            </button>
          </>
        ) : (
          <button type="button" className="atelier-primary" onClick={onLeave}>
            Back to my suit
          </button>
        )}
      </div>
    </>
  );
}
