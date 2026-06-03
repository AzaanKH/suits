import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type ProductGridSkeletonProps = {
  className?: string;
  count?: number;
};

export function ProductGridSkeleton({
  className,
  count = 6,
}: ProductGridSkeletonProps) {
  return (
    <div
      className={cn(
        "grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7",
        className,
      )}
    >
      {Array.from({ length: count }).map((_, index) => (
        <div key={index}>
          <Skeleton className="aspect-[2/3] w-full rounded-none" />
          <Skeleton className="mt-5 h-3 w-24 rounded-none" />
          <Skeleton className="mt-3 h-7 w-40 rounded-none" />
          <Skeleton className="mt-3 h-4 w-20 rounded-none" />
        </div>
      ))}
    </div>
  );
}
