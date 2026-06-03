"use client";

import { create } from "zustand";

import {
  getDefaultConfiguration,
  normalizeConfiguration,
  selectFabric,
  selectSingleOption,
  toggleMultipleOption,
} from "@/features/customizer/defaults";
import {
  CUSTOMIZER_STEPS,
  getStepIndex,
  isCustomizerStepCode,
  type CustomizerGroupCode,
  type CustomizerStepCode,
} from "@/features/customizer/steps";
import type {
  CustomizerCatalog,
  CustomizerConfiguration,
  CustomizerPersonalization,
} from "@/features/customizer/types";

type CustomizerState = {
  activeProductSlug: string | null;
  currentStepCode: CustomizerStepCode;
  configuration: CustomizerConfiguration | null;
  dirty: boolean;
  initialize: (catalog: CustomizerCatalog) => void;
  setStep: (stepCode: CustomizerStepCode) => void;
  goBack: () => void;
  goNext: () => void;
  selectFabric: (catalog: CustomizerCatalog, fabricCode: string) => void;
  selectOption: (
    catalog: CustomizerCatalog,
    groupCode: CustomizerGroupCode,
    optionCode: string,
  ) => void;
  toggleOption: (
    catalog: CustomizerCatalog,
    groupCode: CustomizerGroupCode,
    optionCode: string,
  ) => void;
  updatePersonalization: (
    personalization: Partial<CustomizerPersonalization>,
  ) => void;
  reset: (catalog: CustomizerCatalog) => void;
  markClean: () => void;
};

export const useCustomizerStore = create<CustomizerState>((set) => ({
  activeProductSlug: null,
  currentStepCode: "fabric",
  configuration: null,
  dirty: false,
  initialize: (catalog) =>
    set((state) => {
      if (
        state.activeProductSlug === catalog.product.slug &&
        state.configuration
      ) {
        return {
          configuration: normalizeConfiguration(catalog, state.configuration),
        };
      }

      return {
        activeProductSlug: catalog.product.slug,
        currentStepCode: "fabric",
        configuration: getDefaultConfiguration(catalog),
        dirty: false,
      };
    }),
  setStep: (stepCode) =>
    set(() => ({
      currentStepCode: isCustomizerStepCode(stepCode) ? stepCode : "fabric",
    })),
  goBack: () =>
    set((state) => {
      const currentIndex = getStepIndex(state.currentStepCode);
      const previousStep = CUSTOMIZER_STEPS[Math.max(0, currentIndex - 1)];

      return {
        currentStepCode: previousStep.code,
      };
    }),
  goNext: () =>
    set((state) => {
      const currentIndex = getStepIndex(state.currentStepCode);
      const nextStep =
        CUSTOMIZER_STEPS[
          Math.min(CUSTOMIZER_STEPS.length - 1, currentIndex + 1)
        ];

      return {
        currentStepCode: nextStep.code,
      };
    }),
  selectFabric: (catalog, fabricCode) =>
    set((state) => {
      if (!state.configuration) {
        return {};
      }

      return {
        configuration: selectFabric(catalog, state.configuration, fabricCode),
        dirty: true,
      };
    }),
  selectOption: (catalog, groupCode, optionCode) =>
    set((state) => {
      if (!state.configuration) {
        return {};
      }

      return {
        configuration: selectSingleOption(
          catalog,
          state.configuration,
          groupCode,
          optionCode,
        ),
        dirty: true,
      };
    }),
  toggleOption: (catalog, groupCode, optionCode) =>
    set((state) => {
      if (!state.configuration) {
        return {};
      }

      return {
        configuration: toggleMultipleOption(
          catalog,
          state.configuration,
          groupCode,
          optionCode,
        ),
        dirty: true,
      };
    }),
  updatePersonalization: (personalization) =>
    set((state) => {
      if (!state.configuration) {
        return {};
      }

      return {
        configuration: {
          ...state.configuration,
          personalization: {
            ...state.configuration.personalization,
            ...personalization,
          },
        },
        dirty: true,
      };
    }),
  reset: (catalog) =>
    set(() => ({
      activeProductSlug: catalog.product.slug,
      currentStepCode: "fabric",
      configuration: getDefaultConfiguration(catalog),
      dirty: false,
    })),
  markClean: () => set({ dirty: false }),
}));
