import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MeasurementProfileForm } from "@/features/measurements/components/measurement-profile-form";
import { defaultMeasurementProfileValues } from "@/features/measurements/schema";

describe("MeasurementProfileForm", () => {
  afterEach(() => {
    cleanup();
  });

  it("shows validation before submitting incomplete profiles", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(<MeasurementProfileForm onSubmit={onSubmit} />);

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(
      await screen.findByText("Name must be at least 2 characters."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });

  it("submits centimeter measurements and fit preferences", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeasurementProfileForm
        defaultValues={{
          ...defaultMeasurementProfileValues,
          name: "Wedding suit",
          units: "cm",
          bodyMeasurements: {
            chest: 102,
            waist: 86,
            hips: 102,
            shoulderWidth: 46,
            sleeveLength: 64,
            jacketLength: 76,
            trouserWaist: 86,
            inseam: 79,
            outseam: 104,
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.selectOptions(screen.getByLabelText("Jacket fit"), "relaxed");
    await user.click(screen.getByRole("button", { name: /save profile/i }));

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          name: "Wedding suit",
          units: "cm",
          fitPreferences: expect.objectContaining({ jacketFit: "relaxed" }),
        }),
      );
    });
  });

  it("rejects an inseam that is not shorter than the outseam", async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();

    render(
      <MeasurementProfileForm
        defaultValues={{
          ...defaultMeasurementProfileValues,
          name: "Travel suit",
          bodyMeasurements: {
            ...defaultMeasurementProfileValues.bodyMeasurements,
            inseam: 42,
            outseam: 41,
          },
        }}
        onSubmit={onSubmit}
      />,
    );

    await user.click(screen.getByRole("button", { name: /save profile/i }));

    expect(
      await screen.findByText("Inseam must be shorter than outseam."),
    ).toBeInTheDocument();
    expect(onSubmit).not.toHaveBeenCalled();
  });
});
