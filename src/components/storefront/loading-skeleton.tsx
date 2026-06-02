import { Skeleton } from "@/components/ui/skeleton";

export function ProductGridSkeleton() {
  return (
    <div className="grid gap-x-5 gap-y-10 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-7">
      {Array.from({ length: 6 }).map((_, index) => (
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
