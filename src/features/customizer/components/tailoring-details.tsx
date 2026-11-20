"use client";

import { useState } from "react";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useCustomizerStore } from "@/store/customizer-store";
import { createConfigurationSummary } from "../serialization";
import type { CustomizerCatalog, CustomizerConfiguration } from "../types";
import {
  TAILORING_AREAS,
  TAILORING_FIELDS,
  TAILORING_DIMENSIONS,
  emptyTailoring,
  hasTailoringRequests,
  tailoringDisabledReason,
  tailoringRows,
  type TailoringSpecification,
  type TailoringArea,
} from "../tailoring";

export function TailoringDetails({
  configuration,
  catalog,
}: {
  configuration: CustomizerConfiguration;
  catalog: CustomizerCatalog;
}) {
  const [area, setArea] = useState<TailoringArea>("cloth");
  const [search, setSearch] = useState("");
  const update = useCustomizerStore((s) => s.updateTailoring);
  const spec = configuration.tailoring ?? emptyTailoring();
  const query = search.trim().toLowerCase();
  const fields = TAILORING_FIELDS.filter((f) =>
    query
      ? `${f.label} ${f.options.map((o) => o.label).join(" ")}`
          .toLowerCase()
          .includes(query)
      : f.area === area,
  );
  function choose(id: string, value: string) {
    const choices = { ...spec.choices };
    if (value) choices[id] = value;
    else delete choices[id];
    update({ ...spec, choices });
  }
  return (
    <div className="space-y-5">
      <p className="text-muted-foreground text-sm leading-6">
        These are tailoring requests. A maker must confirm the combination,
        cloth, construction, and price before ordering. Leave a field at the
        reference design to make no additional request.
      </p>
      <Input
        aria-label="Search tailoring options"
        placeholder="Find a detail, such as vents or pleats"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />
      <div
        className="flex flex-wrap gap-2"
        role="group"
        aria-label="Tailoring areas"
      >
        {TAILORING_AREAS.map((item) => (
          <Button
            key={item.code}
            variant={area === item.code && !query ? "default" : "outline"}
            aria-pressed={area === item.code && !query}
            onClick={() => {
              setArea(item.code);
              setSearch("");
            }}
          >
            {item.label}
          </Button>
        ))}
      </div>
      {!query ? (
        <p className="text-muted-foreground text-sm">
          {TAILORING_AREAS.find((item) => item.code === area)?.description}
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        {fields.map((field) => {
          const reason = tailoringDisabledReason(
            field.id,
            spec,
            configuration.selectedOptionCodes,
          );
          return (
            <div key={field.id} className="rounded-lg border p-4">
              <label
                htmlFor={`tailoring-${field.id}`}
                className="text-sm font-semibold"
              >
                {field.label}
              </label>
              <select
                id={`tailoring-${field.id}`}
                value={spec.choices[field.id] ?? ""}
                disabled={Boolean(reason)}
                aria-describedby={`help-${field.id}`}
                onChange={(e) => choose(field.id, e.target.value)}
                className="border-input bg-background focus-visible:ring-ring mt-3 h-11 w-full min-w-0 rounded-md border px-3 text-sm focus-visible:ring-2 disabled:opacity-50"
              >
                <option value="">Use reference design</option>
                {field.options.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
              <p
                id={`help-${field.id}`}
                className="text-muted-foreground mt-2 text-xs leading-5"
              >
                {reason ??
                  (field.preview === "material"
                    ? "Color preview in 3D; final fabric needs a swatch."
                    : field.preview === "detail" && field.previewValues
                      ? `Shown in 3D: ${field.options
                          .filter((o) => field.previewValues?.includes(o.value))
                          .map((o) => o.label.toLowerCase())
                          .join(
                            ", ",
                          )}. Other choices are saved in the specification.`
                      : field.preview === "detail"
                        ? "Schematic detail preview in 3D."
                        : "Saved in the specification; not shown in 3D yet.")}
              </p>
            </div>
          );
        })}
      </div>
      {area === "dimensions" || query ? (
        <div className="space-y-4">
          <p className="text-muted-foreground text-sm leading-6">
            Enter finished-garment dimensions in centimetres. These are optional
            targets, separate from your body measurements in Fit. A tailor must
            confirm measurement methods and allowances. They do not resize the
            preview.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {TAILORING_DIMENSIONS.filter(
              (f) => !query || f.label.toLowerCase().includes(query),
            ).map((field) => {
              const reason = tailoringDisabledReason(
                field.id,
                spec,
                configuration.selectedOptionCodes,
              );
              return (
                <label key={field.id} className="space-y-2 text-sm">
                  <span className="font-semibold">
                    {field.label}{" "}
                    <span className="text-muted-foreground font-normal">
                      cm
                    </span>
                  </span>
                  <DimensionInput
                    value={spec.dimensions[field.id]}
                    max={field.max}
                    disabled={Boolean(reason)}
                    label={`${field.label} in centimetres`}
                    onChange={(value) => {
                      const dimensions = { ...spec.dimensions };
                      if (value === undefined) delete dimensions[field.id];
                      else dimensions[field.id] = value;
                      update({ ...spec, dimensions });
                    }}
                  />
                  {reason ? (
                    <span className="text-muted-foreground block text-xs">
                      {reason}
                    </span>
                  ) : null}
                </label>
              );
            })}
          </div>
        </div>
      ) : null}
      {query &&
      fields.length === 0 &&
      !TAILORING_DIMENSIONS.some((f) =>
        f.label.toLowerCase().includes(query),
      ) ? (
        <p className="text-muted-foreground text-sm">
          No matching details. Try another search.
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3 border-t pt-4">
        <DownloadSpecification
          configuration={configuration}
          catalog={catalog}
        />
        <Button
          variant="ghost"
          disabled={!hasTailoringRequests(spec)}
          onClick={() => update(emptyTailoring())}
        >
          Clear tailoring requests
        </Button>
        <p className="text-muted-foreground text-sm" aria-live="polite">
          {tailoringRows(spec).length} requests
        </p>
      </div>
    </div>
  );
}

function DimensionInput({
  value,
  max,
  label,
  disabled,
  onChange,
}: {
  value?: number;
  max: number;
  label: string;
  disabled: boolean;
  onChange: (value: number | undefined) => void;
}) {
  const [error, setError] = useState(false);
  return (
    <>
      <Input
        type="number"
        aria-label={label}
        min={0.1}
        max={max}
        step="any"
        value={value ?? ""}
        disabled={disabled}
        aria-invalid={error}
        placeholder="Not specified"
        onChange={(e) => {
          const n = e.target.valueAsNumber;
          const valid =
            e.target.value === "" || (Number.isFinite(n) && n > 0 && n <= max);
          setError(!valid);
          if (valid) onChange(e.target.value === "" ? undefined : n);
        }}
      />
      {error ? (
        <span className="text-destructive block text-xs" role="alert">
          Enter a positive dimension up to {max} cm.
        </span>
      ) : null}
    </>
  );
}

export function TailoringSummary({
  specification,
}: {
  specification?: TailoringSpecification;
}) {
  const rows = tailoringRows(specification);
  if (!rows.length) return null;
  return (
    <section className="rounded-lg border p-5" aria-label="Tailoring requests">
      <h3 className="font-serif text-2xl">Tailoring requests</h3>
      <p className="text-muted-foreground mt-2 text-sm leading-6">
        Maker review and a quote are required. These requests are not included
        in the displayed price. Details marked for the specification are not
        shown in the 3D preview.
      </p>
      <dl className="mt-4 space-y-3">
        {rows.map((row) => (
          <div
            key={row.id}
            className="flex items-start justify-between gap-4 text-sm"
          >
            <dt className="text-muted-foreground">{row.label}</dt>
            <dd className="text-right">
              {row.value}
              <span className="text-muted-foreground block text-xs">
                {row.preview === "specification"
                  ? "Specification only"
                  : "Schematic preview"}
              </span>
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export function DownloadSpecification({
  configuration,
  catalog,
}: {
  configuration: CustomizerConfiguration;
  catalog: CustomizerCatalog;
}) {
  function download() {
    const summary = createConfigurationSummary(catalog, configuration);
    const data = {
      schemaVersion: 1,
      makerStatus: "unconfirmed",
      pricingStatus: hasTailoringRequests(configuration.tailoring)
        ? "quote-required"
        : "catalog-price",
      referenceDesign: summary,
      tailoringRequests: tailoringRows(configuration.tailoring),
      configuration,
      dimensionUnits: "cm",
      dimensionBasis:
        "finished garment; measurement methods require maker confirmation",
      previewIsFitPrediction: false,
    };
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = `${configuration.productSlug}-tailoring-specification.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  return (
    <Button variant="outline" onClick={download}>
      <Download aria-hidden="true" />
      Download specification
    </Button>
  );
}
