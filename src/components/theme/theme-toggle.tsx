"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";

import { cn } from "@/lib/utils";

const ORDER = ["system", "light", "dark"] as const;
type ThemeChoice = (typeof ORDER)[number];

const LABELS: Record<ThemeChoice, string> = {
  system: "Match system",
  light: "Light",
  dark: "Dark",
};

const ICONS = { system: Monitor, light: Sun, dark: Moon };

const subscribe = () => () => {};
const useHydrated = () =>
  useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const hydrated = useHydrated();
  const current: ThemeChoice =
    hydrated && ORDER.includes(theme as ThemeChoice)
      ? (theme as ThemeChoice)
      : "system";
  const next = ORDER[(ORDER.indexOf(current) + 1) % ORDER.length];
  const Icon = ICONS[current];

  return (
    <button
      type="button"
      className={cn(
        "text-ink hover:text-accent inline-flex size-10 items-center justify-center transition-colors",
        className,
      )}
      aria-label={`Theme: ${LABELS[current]}. Switch to ${LABELS[next].toLowerCase()}.`}
      title={`Theme: ${LABELS[current]}`}
      onClick={() => setTheme(next)}
    >
      <Icon aria-hidden="true" className="size-4" />
    </button>
  );
}
