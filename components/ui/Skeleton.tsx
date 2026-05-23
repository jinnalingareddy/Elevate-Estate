import { cn } from "@/lib/utils";

type SkeletonVariant = "text" | "card" | "image" | "circle" | "table-row";

interface SkeletonProps {
  variant?: SkeletonVariant;
  className?: string;
  /** Number of rows for table-row variant */
  rows?: number;
}

const shimmer =
  "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 dark:from-slate-800 dark:via-slate-700 dark:to-slate-800 animate-shimmer bg-[length:1000px_100%]";

function SkeletonBase({ className }: { className?: string }) {
  return (
    <div
      className={cn(shimmer, "rounded", className)}
      aria-hidden="true"
      role="presentation"
    />
  );
}

function Skeleton({ variant = "text", className, rows = 3 }: SkeletonProps) {
  switch (variant) {
    case "text":
      return <SkeletonBase className={cn("h-4 w-full rounded-md", className)} />;

    case "card":
      return (
        <SkeletonBase
          className={cn("h-48 w-full rounded-lg", className)}
        />
      );

    case "image":
      return (
        <SkeletonBase
          className={cn("w-full aspect-video rounded-lg", className)}
        />
      );

    case "circle":
      return (
        <SkeletonBase
          className={cn("h-10 w-10 rounded-full shrink-0", className)}
        />
      );

    case "table-row":
      return (
        <div
          className={cn("flex flex-col gap-3", className)}
          aria-hidden="true"
          role="presentation"
        >
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-3">
              <SkeletonBase className="h-4 w-4/12 rounded-md" />
              <SkeletonBase className="h-4 w-3/12 rounded-md" />
              <SkeletonBase className="h-4 w-2/12 rounded-md" />
              <SkeletonBase className="h-4 flex-1 rounded-md" />
            </div>
          ))}
        </div>
      );

    default:
      return <SkeletonBase className={className} />;
  }
}

/** Convenience compound for a full property card loading state */
function PropertyCardSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700",
        className
      )}
      aria-hidden="true"
      role="presentation"
    >
      <SkeletonBase className="w-full aspect-[4/3]" />
      <div className="p-4 flex flex-col gap-3">
        <SkeletonBase className="h-5 w-3/4 rounded-md" />
        <SkeletonBase className="h-4 w-1/2 rounded-md" />
        <div className="flex gap-4 pt-1">
          <SkeletonBase className="h-4 w-16 rounded-md" />
          <SkeletonBase className="h-4 w-16 rounded-md" />
          <SkeletonBase className="h-4 w-16 rounded-md" />
        </div>
        <SkeletonBase className="h-6 w-1/3 rounded-md mt-1" />
      </div>
    </div>
  );
}

export { Skeleton, PropertyCardSkeleton };
