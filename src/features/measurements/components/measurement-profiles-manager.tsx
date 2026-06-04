"use client";

import { useMutation, useQuery } from "convex/react";
import { Copy, Pencil, Plus, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import type { Doc, Id } from "../../../../convex/_generated/dataModel";
import { EmptyState } from "@/components/storefront/empty-state";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { MeasurementProfileForm } from "@/features/measurements/components/measurement-profile-form";
import {
  inchesToUnit,
  measurementFields,
  type MeasurementProfileFormValues,
} from "@/features/measurements/schema";

type MeasurementProfilesManagerProps = {
  clerkConfigured: boolean;
};

type EditingState =
  | { mode: "create" }
  | { mode: "edit"; profile: Doc<"measurementProfiles"> }
  | null;

export function MeasurementProfilesManager({
  clerkConfigured,
}: MeasurementProfilesManagerProps) {
  const profiles = useQuery(
    api.measurementProfiles.mine,
    clerkConfigured ? {} : "skip",
  );
  const createProfile = useMutation(api.measurementProfiles.create);
  const updateProfile = useMutation(api.measurementProfiles.update);
  const duplicateProfile = useMutation(api.measurementProfiles.duplicate);
  const deleteProfile = useMutation(api.measurementProfiles.remove);
  const [editing, setEditing] = useState<EditingState>(null);
  const [deleteTargetId, setDeleteTargetId] =
    useState<Id<"measurementProfiles"> | null>(null);
  const [busyProfileId, setBusyProfileId] = useState<string | null>(null);
  const activeDefaultValues = useMemo(() => {
    if (editing?.mode !== "edit") {
      return undefined;
    }

    return toFormValues(editing.profile);
  }, [editing]);

  if (!clerkConfigured) {
    return (
      <EmptyState
        title="Account setup required."
        description="Add Clerk keys to .env.local to enable measurement profiles."
        action={{ label: "Return to account", href: "/account" }}
      />
    );
  }

  if (profiles === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2">
        <Skeleton className="h-64 rounded-lg" />
        <Skeleton className="h-64 rounded-lg" />
      </div>
    );
  }

  async function handleSubmit(values: MeasurementProfileFormValues) {
    try {
      if (editing?.mode === "edit") {
        await updateProfile({
          profileId: editing.profile._id,
          ...values,
        });
        toast.success("Measurement profile updated.");
      } else {
        await createProfile(values);
        toast.success("Measurement profile created.");
      }

      setEditing(null);
    } catch {
      toast.error("Unable to save this measurement profile.");
    }
  }

  async function handleDuplicate(profileId: Id<"measurementProfiles">) {
    setBusyProfileId(profileId);

    try {
      await duplicateProfile({ profileId });
      toast.success("Measurement profile duplicated.");
    } catch {
      toast.error("Unable to duplicate this measurement profile.");
    } finally {
      setBusyProfileId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) {
      return;
    }

    const profileId = deleteTargetId;
    setBusyProfileId(profileId);

    try {
      await deleteProfile({ profileId });
      setDeleteTargetId(null);
      toast.success("Measurement profile deleted.");
    } catch {
      toast.error("Unable to delete this measurement profile.");
    } finally {
      setBusyProfileId(null);
    }
  }

  return (
    <>
      <div className="mb-6 flex justify-end">
        <Button type="button" onClick={() => setEditing({ mode: "create" })}>
          <Plus aria-hidden="true" />
          New profile
        </Button>
      </div>

      {profiles.length === 0 ? (
        <section className="mx-auto max-w-xl py-12 text-center">
          <h2 className="text-ink font-serif text-6xl leading-[0.95] tracking-[-0.04em]">
            No measurement profiles yet.
          </h2>
          <p className="text-muted-foreground mx-auto mt-5 max-w-md text-sm leading-6">
            Create a profile before checkout or request a measurement
            appointment during checkout.
          </p>
          <Button
            className="mt-8"
            type="button"
            onClick={() => setEditing({ mode: "create" })}
          >
            <Plus aria-hidden="true" />
            Create profile
          </Button>
        </section>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {profiles.map((profile) => (
            <article
              key={profile._id}
              className="border-border bg-card rounded-lg border p-5"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-ink font-serif text-3xl leading-none">
                    {profile.name}
                  </h2>
                  <p className="text-muted-foreground mt-2 text-sm">
                    {profile.units === "in" ? "Inches" : "Centimeters"} /
                    Updated {formatDate(profile.updatedAt)}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Edit ${profile.name}`}
                    onClick={() => setEditing({ mode: "edit", profile })}
                  >
                    <Pencil aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Duplicate ${profile.name}`}
                    disabled={busyProfileId === profile._id}
                    onClick={() => handleDuplicate(profile._id)}
                  >
                    <Copy aria-hidden="true" />
                  </Button>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label={`Delete ${profile.name}`}
                    disabled={busyProfileId === profile._id}
                    onClick={() => setDeleteTargetId(profile._id)}
                  >
                    <Trash2 aria-hidden="true" />
                  </Button>
                </div>
              </div>

              <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
                {measurementFields.slice(0, 6).map((field) => (
                  <div key={field.name}>
                    <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                      {field.label}
                    </dt>
                    <dd className="text-ink mt-1 font-semibold">
                      {inchesToUnit(
                        profile.bodyMeasurementsInches[field.name],
                        profile.units,
                      )}{" "}
                      {profile.units}
                    </dd>
                  </div>
                ))}
              </dl>
            </article>
          ))}
        </div>
      )}

      <Dialog
        open={editing !== null}
        onOpenChange={(open) => {
          if (!open) {
            setEditing(null);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-5xl">
          <DialogHeader>
            <DialogTitle>
              {editing?.mode === "edit"
                ? "Edit measurement profile"
                : "Create measurement profile"}
            </DialogTitle>
            <DialogDescription>
              Measurements can be entered in inches or centimeters. Arden stores
              them in a consistent format for checkout validation.
            </DialogDescription>
          </DialogHeader>
          <MeasurementProfileForm
            defaultValues={activeDefaultValues}
            submitLabel={editing?.mode === "edit" ? "Update profile" : "Create profile"}
            onSubmit={handleSubmit}
          />
        </DialogContent>
      </Dialog>

      <Dialog
        open={deleteTargetId !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTargetId(null);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete measurement profile?</DialogTitle>
            <DialogDescription>
              Cart items using this profile will need a new measurement choice
              before payment can begin.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={busyProfileId === deleteTargetId}
            >
              Delete profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function toFormValues(
  profile: Doc<"measurementProfiles">,
): MeasurementProfileFormValues {
  return {
    name: profile.name,
    units: profile.units,
    bodyMeasurements: Object.fromEntries(
      measurementFields.map((field) => [
        field.name,
        inchesToUnit(profile.bodyMeasurementsInches[field.name], profile.units),
      ]),
    ) as MeasurementProfileFormValues["bodyMeasurements"],
    fitPreferences: profile.fitPreferences,
    notes: profile.notes,
  };
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}
