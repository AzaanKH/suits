"use client";

import dynamic from "next/dynamic";
import { useState, type KeyboardEvent } from "react";
import { SUIT_3D_PRODUCT_SLUG } from "../three-d/asset-contract";
import { TailoringSummary } from "./tailoring-details";
import { createConfigurationSummary } from "../serialization";
import type { CustomizerCatalog, CustomizerConfiguration } from "../types";
import { formatPriceModifier } from "@/lib/product-format";
import { TwoDimensionalPreview } from "./two-dimensional-preview";

const Suit3dPreview = dynamic(
  () => import("../three-d/suit-3d-preview").then((mod) => mod.Suit3dPreview),
  {
    ssr: false,
    loading: () => (
      <div className="studio-scene-loading">Preparing your suit</div>
    ),
  },
);

type Props = {
  catalog: CustomizerCatalog;
  configuration: CustomizerConfiguration;
  threeDimensionalPreviewEnabled?: boolean;
};
export function CustomizerPreview({
  catalog,
  configuration,
  threeDimensionalPreviewEnabled = true,
}: Props) {
  const supports3d =
    threeDimensionalPreviewEnabled &&
    configuration.productSlug === SUIT_3D_PRODUCT_SLUG;
  const [view, setView] = useState<"preview" | "summary">("preview");
  const summary = createConfigurationSummary(catalog, configuration);
  function changeTab(event: KeyboardEvent<HTMLButtonElement>) {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next =
      event.key === "Home"
        ? "preview"
        : event.key === "End"
          ? "summary"
          : view === "preview"
            ? "summary"
            : "preview";
    setView(next);
    document.getElementById(`studio-${next}-tab`)?.focus();
  }
  return (
    <aside className="studio-preview" aria-label="Your suit preview">
      <div
        className="studio-preview-tabs"
        role="tablist"
        aria-label="Preview mode"
      >
        <button
          role="tab"
          id="studio-preview-tab"
          aria-controls="studio-preview-panel"
          aria-selected={view === "preview"}
          tabIndex={view === "preview" ? 0 : -1}
          onKeyDown={changeTab}
          onClick={() => setView("preview")}
        >
          {supports3d ? "3D" : "Preview"}
        </button>
        <button
          role="tab"
          id="studio-summary-tab"
          aria-controls="studio-summary-panel"
          aria-selected={view === "summary"}
          tabIndex={view === "summary" ? 0 : -1}
          onKeyDown={changeTab}
          onClick={() => setView("summary")}
        >
          Summary
        </button>
      </div>
      <div
        role="tabpanel"
        id="studio-preview-panel"
        aria-labelledby="studio-preview-tab"
        hidden={view !== "preview"}
        className="studio-preview-content"
      >
        {supports3d ? (
          <Suit3dPreview
            catalog={catalog}
            configuration={configuration}
            fallback={
              <TwoDimensionalPreview
                catalog={catalog}
                configuration={configuration}
              />
            }
          />
        ) : (
          <TwoDimensionalPreview
            catalog={catalog}
            configuration={configuration}
            priority
          />
        )}
      </div>
      {view === "summary" ? (
        <div
          className="studio-summary"
          id="studio-summary-panel"
          role="tabpanel"
          aria-labelledby="studio-summary-tab"
        >
          <h2 className="mb-6 font-serif text-4xl">Your selections</h2>
          <div className="space-y-4">
            {summary.selections.map((s) => (
              <div
                className="flex justify-between gap-4 border-b border-black/10 pb-3 text-xs"
                key={`${s.stepCode}-${s.optionCode}`}
              >
                <div>
                  <p className="mb-1 text-slate-500">{s.groupLabel}</p>
                  <p>{s.optionLabel}</p>
                </div>
                <p>{formatPriceModifier(s.priceModifierCents)}</p>
              </div>
            ))}
          </div>
          <TailoringSummary specification={configuration.tailoring} />
        </div>
      ) : null}
    </aside>
  );
}
