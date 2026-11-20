"use client";

import { Eye, EyeOff } from "lucide-react";
import { useId } from "react";

import { useCustomizerStore } from "@/store/customizer-store";

import { emptyTailoring, TAILORING_FIELDS } from "../tailoring";
import type { CustomizerConfiguration } from "../types";

const FIELDS = [
  { id: "ticket-pocket", fallback: "none", inside: false },
  { id: "inside-pockets", fallback: "standard", inside: true },
] as const;

export function StudioPocketDetails({
  configuration,
  insideView,
  onInsideView,
}: {
  configuration: CustomizerConfiguration;
  insideView: boolean;
  onInsideView: (inside: boolean) => void;
}) {
  const update = useCustomizerStore((s) => s.updateTailoring);
  const spec = configuration.tailoring ?? emptyTailoring();
  const baseId = useId();

  function choose(id: string, value: string, inside: boolean) {
    update({ ...spec, choices: { ...spec.choices, [id]: value } });
    onInsideView(inside);
  }

  return (
    <div className="atelier-pocket-details">
      {FIELDS.map(({ id, fallback, inside }) => {
        const field = TAILORING_FIELDS.find((f) => f.id === id)!;
        const current = spec.choices[id] ?? fallback;
        const labelId = `${baseId}-${id}`;
        return (
          <div key={id} className="atelier-detail-row">
            <span id={labelId}>{field.label}</span>
            <div
              className="atelier-moods"
              role="group"
              aria-labelledby={labelId}
            >
              {field.options.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={current === option.value}
                  onClick={() => choose(id, option.value, inside)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="atelier-secondary atelier-inside-toggle"
        aria-pressed={insideView}
        onClick={() => onInsideView(!insideView)}
      >
        {insideView ? (
          <EyeOff aria-hidden="true" className="size-4" />
        ) : (
          <Eye aria-hidden="true" className="size-4" />
        )}
        {insideView ? "Back to the front" : "View inside"}
      </button>
    </div>
  );
}
