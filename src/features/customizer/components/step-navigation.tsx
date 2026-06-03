"use client";

import { useState } from "react";
import { ListChecks } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuList,
} from "@/components/ui/navigation-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  CUSTOMIZER_STEPS,
  getStepIndex,
  type CustomizerStepCode,
} from "@/features/customizer/steps";
import { cn } from "@/lib/utils";

type StepNavigationProps = {
  currentStepCode: CustomizerStepCode;
  onStepChange: (stepCode: CustomizerStepCode) => void;
};

export function StepNavigation({
  currentStepCode,
  onStepChange,
}: StepNavigationProps) {
  const [open, setOpen] = useState(false);
  const currentIndex = getStepIndex(currentStepCode);

  function selectStep(stepCode: CustomizerStepCode) {
    onStepChange(stepCode);
    setOpen(false);
  }

  return (
    <div className="border-border border-y py-3">
      <NavigationMenu className="hidden max-w-none xl:flex">
        <NavigationMenuList className="grid w-full grid-cols-8 gap-1">
          {CUSTOMIZER_STEPS.map((step, index) => (
            <NavigationMenuItem key={step.code}>
              <button
                type="button"
                aria-current={
                  step.code === currentStepCode ? "step" : undefined
                }
                className={cn(
                  "hover:bg-muted flex h-full w-full items-center gap-2 rounded-lg px-3 py-2 text-left transition-colors",
                  step.code === currentStepCode && "bg-muted text-ink",
                )}
                onClick={() => selectStep(step.code)}
              >
                <span
                  className={cn(
                    "border-border text-muted-foreground flex size-7 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                    index <= currentIndex && "border-primary text-primary",
                  )}
                >
                  {index + 1}
                </span>
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold">
                    {step.shortLabel}
                  </span>
                  <span className="text-muted-foreground block truncate text-xs">
                    {step.label}
                  </span>
                </span>
              </button>
            </NavigationMenuItem>
          ))}
        </NavigationMenuList>
      </NavigationMenu>

      <div className="flex items-center justify-between gap-3 xl:hidden">
        <div>
          <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
            Step {currentIndex + 1} of {CUSTOMIZER_STEPS.length}
          </p>
          <p className="text-ink text-sm font-semibold">
            {CUSTOMIZER_STEPS[currentIndex]?.label}
          </p>
        </div>
        <Sheet open={open} onOpenChange={(nextOpen) => setOpen(nextOpen)}>
          <SheetTrigger render={<Button variant="outline" size="lg" />}>
            <ListChecks aria-hidden="true" />
            Steps
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[80svh] overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Customize suit</SheetTitle>
            </SheetHeader>
            <div className="grid gap-2 p-4 pt-0">
              {CUSTOMIZER_STEPS.map((step, index) => (
                <button
                  className={cn(
                    "border-border flex items-center gap-3 rounded-lg border p-3 text-left",
                    step.code === currentStepCode && "border-primary bg-muted",
                  )}
                  key={step.code}
                  type="button"
                  onClick={() => selectStep(step.code)}
                >
                  <span
                    className={cn(
                      "border-border text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
                      index <= currentIndex && "border-primary text-primary",
                    )}
                  >
                    {index + 1}
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">
                      {step.label}
                    </span>
                    <span className="text-muted-foreground mt-1 block text-xs leading-5">
                      {step.description}
                    </span>
                  </span>
                </button>
              ))}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
