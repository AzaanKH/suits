"use client";

import {
  CUSTOMIZER_STEPS,
  type CustomizerStepCode,
} from "@/features/customizer/steps";

type StepNavigationProps = {
  currentStepCode: CustomizerStepCode;
  onStepChange: (stepCode: CustomizerStepCode) => void;
};

export function StepNavigation({
  currentStepCode,
  onStepChange,
}: StepNavigationProps) {
  return (
    <nav className="studio-step-navigation" aria-label="Customization steps">
      {CUSTOMIZER_STEPS.map((step) => (
        <button
          key={step.code}
          type="button"
          aria-current={step.code === currentStepCode ? "step" : undefined}
          onClick={() => onStepChange(step.code)}
        >
          {step.shortLabel}
        </button>
      ))}
    </nav>
  );
}
