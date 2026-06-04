"use client";

import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { Copy, Eye, PencilRuler, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";

import { api } from "../../../../convex/_generated/api";
import { EmptyState } from "@/components/storefront/empty-state";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/lib/product-format";

type SavedDesignsListProps = {
  clerkConfigured: boolean;
};

export function SavedDesignsList({ clerkConfigured }: SavedDesignsListProps) {
  const designs = useQuery(
    api.savedDesigns.mine,
    clerkConfigured ? {} : "skip",
  );
  const duplicateDesign = useMutation(api.savedDesigns.duplicate);
  const deleteDesign = useMutation(api.savedDesigns.remove);
  const [deleteTargetId, setDeleteTargetId] =
    useState<Id<"savedDesigns"> | null>(null);
  const [busyDesignId, setBusyDesignId] = useState<string | null>(null);

  if (!clerkConfigured) {
    return (
      <EmptyState
        title="Account setup required."
        description="Add Clerk keys to .env.local to enable saved designs."
        action={{ label: "Return to shop", href: "/shop" }}
      />
    );
  }

  if (designs === undefined) {
    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton className="h-96 rounded-lg" key={index} />
        ))}
      </div>
    );
  }

  if (designs.length === 0) {
    return (
      <EmptyState
        title="No saved designs yet."
        description="Customize a suit and save the configuration to see it here."
        action={{ label: "Start with the collection", href: "/shop" }}
      />
    );
  }

  async function handleDuplicate(designId: Id<"savedDesigns">) {
    setBusyDesignId(designId);

    try {
      await duplicateDesign({ designId });
      toast.success("Design duplicated.");
    } catch {
      toast.error("Unable to duplicate this design.");
    } finally {
      setBusyDesignId(null);
    }
  }

  async function handleDelete() {
    if (!deleteTargetId) {
      return;
    }

    const designId = deleteTargetId;
    setBusyDesignId(designId);

    try {
      await deleteDesign({ designId });
      setDeleteTargetId(null);
      toast.success("Design deleted.");
    } catch {
      toast.error("Unable to delete this design.");
    } finally {
      setBusyDesignId(null);
    }
  }

  return (
    <>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {designs.map((design) => (
          <Card className="overflow-hidden rounded-lg" key={design._id}>
            <div className="bg-muted relative aspect-[4/3]">
              {design.previewImageReference ? (
                <Image
                  src={design.previewImageReference.src}
                  alt={design.previewImageReference.alt}
                  fill
                  className="object-cover"
                  sizes="(min-width: 1280px) 30vw, (min-width: 768px) 45vw, 90vw"
                />
              ) : null}
            </div>
            <CardHeader>
              <CardTitle className="font-serif text-3xl leading-none">
                {design.name}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {design.productName} / {formatCurrency(design.priceCents)}
              </p>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground text-sm">
                Updated {formatDate(design.updatedAt)}
              </p>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ variant: "outline", size: "sm" })}
                href={`/account/designs/${design._id}`}
              >
                <Eye aria-hidden="true" />
                View
              </Link>
              <Link
                className={buttonVariants({ size: "sm" })}
                href={`/customize/${design.productSlug}?designId=${design._id}`}
              >
                <PencilRuler aria-hidden="true" />
                Resume
              </Link>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Duplicate ${design.name}`}
                onClick={() => handleDuplicate(design._id)}
                disabled={busyDesignId === design._id}
              >
                <Copy aria-hidden="true" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label={`Delete ${design.name}`}
                onClick={() => setDeleteTargetId(design._id)}
                disabled={busyDesignId === design._id}
              >
                <Trash2 aria-hidden="true" />
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

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
            <DialogTitle>Delete saved design?</DialogTitle>
            <DialogDescription>
              This removes the design from your account. The action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteTargetId(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={busyDesignId === deleteTargetId}
            >
              Delete design
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function formatDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(timestamp));
}
