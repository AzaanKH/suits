"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "convex/react";
import type { Id } from "../../../../convex/_generated/dataModel";
import { ArrowLeft, Copy, PencilRuler, Save, Trash2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";

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
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency, formatPriceModifier } from "@/lib/product-format";

const renameSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name this design.")
    .max(80, "Use 80 characters or fewer."),
});

type RenameFormValues = z.input<typeof renameSchema>;

type SavedDesignDetailProps = {
  clerkConfigured: boolean;
  designId: string;
};

export function SavedDesignDetail({
  clerkConfigured,
  designId,
}: SavedDesignDetailProps) {
  const router = useRouter();
  const convexDesignId = designId as Id<"savedDesigns">;
  const design = useQuery(
    api.savedDesigns.get,
    clerkConfigured ? { designId: convexDesignId } : "skip",
  );
  const renameDesign = useMutation(api.savedDesigns.rename);
  const duplicateDesign = useMutation(api.savedDesigns.duplicate);
  const deleteDesign = useMutation(api.savedDesigns.remove);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [isDuplicating, setIsDuplicating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const form = useForm<RenameFormValues>({
    resolver: zodResolver(renameSchema),
    defaultValues: {
      name: "",
    },
  });

  useEffect(() => {
    if (design) {
      form.reset({ name: design.name });
    }
  }, [design, form]);

  if (!clerkConfigured) {
    return (
      <EmptyState
        title="Account setup required."
        description="Add Clerk keys to .env.local to enable saved designs."
        action={{ label: "Return to shop", href: "/shop" }}
      />
    );
  }

  if (design === undefined) {
    return <Skeleton className="h-[40rem] rounded-lg" />;
  }

  if (design === null) {
    return (
      <EmptyState
        title="Saved design not found."
        description="This design may have been deleted or belongs to another account."
        action={{ label: "Back to saved designs", href: "/account/designs" }}
      />
    );
  }

  async function handleRename(values: RenameFormValues) {
    try {
      await renameDesign({
        designId: convexDesignId,
        name: values.name,
      });
      toast.success("Design renamed.");
    } catch {
      toast.error("Unable to rename this design.");
    }
  }

  async function handleDuplicate() {
    if (isDuplicating) {
      return;
    }

    setIsDuplicating(true);

    try {
      const newDesignId = await duplicateDesign({ designId: convexDesignId });
      toast.success("Design duplicated.");
      router.push(`/account/designs/${newDesignId}`);
    } catch {
      toast.error("Unable to duplicate this design.");
    } finally {
      setIsDuplicating(false);
    }
  }

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    try {
      await deleteDesign({ designId: convexDesignId });
      toast.success("Design deleted.");
      router.push("/account/designs");
    } catch {
      toast.error("Unable to delete this design.");
    } finally {
      setIsDeleting(false);
    }
  }

  return (
    <>
      <Link
        className="text-link text-muted-foreground hover:text-ink"
        href="/account/designs"
      >
        <ArrowLeft aria-hidden="true" className="size-4" />
        Back to saved designs
      </Link>

      <div className="mt-7 grid gap-8 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
        <section>
          <div className="bg-muted relative aspect-[4/5] overflow-hidden rounded-lg">
            {design.previewImageReference ? (
              <Image
                src={design.previewImageReference.src}
                alt={design.previewImageReference.alt}
                fill
                priority
                className="object-cover"
                sizes="(min-width: 1024px) 40vw, 90vw"
              />
            ) : null}
          </div>
        </section>

        <section className="space-y-5">
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="font-serif text-5xl leading-none">
                {design.name}
              </CardTitle>
              <p className="text-muted-foreground text-sm">
                {design.productName} / {formatCurrency(design.priceCents)}
              </p>
            </CardHeader>
            <CardContent>
              <form
                className="grid gap-3 sm:grid-cols-[1fr_auto]"
                onSubmit={form.handleSubmit(handleRename)}
              >
                <div className="space-y-2">
                  <label
                    className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase"
                    htmlFor="rename-design"
                  >
                    Design name
                  </label>
                  <Input id="rename-design" {...form.register("name")} />
                  {form.formState.errors.name ? (
                    <p className="text-destructive text-sm">
                      {form.formState.errors.name.message}
                    </p>
                  ) : null}
                </div>
                <Button
                  className="self-end"
                  type="submit"
                  disabled={form.formState.isSubmitting}
                >
                  <Save aria-hidden="true" />
                  Rename
                </Button>
              </form>
            </CardContent>
            <CardFooter className="flex flex-wrap gap-2">
              <Link
                className={buttonVariants({ size: "lg" })}
                href={`/customize/${design.productSlug}?designId=${design._id}`}
              >
                <PencilRuler aria-hidden="true" />
                Resume customization
              </Link>
              <Button
                variant="outline"
                size="lg"
                onClick={handleDuplicate}
                disabled={isDuplicating}
              >
                <Copy aria-hidden="true" />
                {isDuplicating ? "Duplicating" : "Duplicate"}
              </Button>
              <Button
                variant="destructive"
                size="lg"
                onClick={() => setDeleteOpen(true)}
                disabled={isDeleting}
              >
                <Trash2 aria-hidden="true" />
                {isDeleting ? "Deleting" : "Delete"}
              </Button>
            </CardFooter>
          </Card>

          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle className="font-serif text-3xl leading-none">
                Configuration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {design.selections.map((selection) => (
                  <div
                    className="grid gap-2 sm:grid-cols-[9rem_1fr_auto] sm:items-center"
                    key={`${selection.stepCode}-${selection.optionCode}`}
                  >
                    <p className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                      {selection.groupLabel}
                    </p>
                    <p className="text-ink text-sm font-medium">
                      {selection.optionLabel}
                    </p>
                    <p className="text-muted-foreground text-sm">
                      {formatPriceModifier(selection.priceModifierCents)}
                    </p>
                  </div>
                ))}
              </div>

              <Separator className="my-6" />

              <dl className="grid gap-4 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                    Monogram
                  </dt>
                  <dd className="text-ink mt-1 font-medium">
                    {design.personalization.monogramText || "None"}
                  </dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                    Updated
                  </dt>
                  <dd className="text-ink mt-1 font-medium">
                    {formatDate(design.updatedAt)}
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs font-bold tracking-[0.1em] uppercase">
                    Tailoring notes
                  </dt>
                  <dd className="text-ink mt-1 leading-6">
                    {design.personalization.notes || "None"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        </section>
      </div>

      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete saved design?</DialogTitle>
            <DialogDescription>
              This removes the design from your account. The action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={isDeleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting" : "Delete design"}
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
