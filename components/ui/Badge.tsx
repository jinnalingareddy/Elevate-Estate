import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium rounded-full",
  {
    variants: {
      variant: {
        default:
          "bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300",
        success:
          "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
        warning:
          "bg-gold-100 text-gold-700 dark:bg-gold-900/40 dark:text-gold-300",
        error:
          "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300",
        new: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300",
        featured:
          "border border-gold-500 text-gold-600 bg-gold-50 dark:bg-transparent dark:text-gold-400 dark:border-gold-400",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

const dotColors: Record<string, string> = {
  default: "bg-slate-400 dark:bg-slate-500",
  success: "bg-teal-500 dark:bg-teal-400",
  warning: "bg-gold-500 dark:bg-gold-400",
  error: "bg-red-500 dark:bg-red-400",
  new: "bg-blue-500 dark:bg-blue-400",
  featured: "bg-gold-500 dark:bg-gold-400",
};

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {
  dot?: boolean;
}

function Badge({
  className,
  variant = "default",
  size,
  dot = false,
  children,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cn(badgeVariants({ variant, size, className }))}
      {...props}
    >
      {dot && (
        <span
          className={cn(
            "inline-block w-1.5 h-1.5 rounded-full shrink-0",
            dotColors[variant ?? "default"]
          )}
          aria-hidden
        />
      )}
      {children}
    </span>
  );
}

export { Badge, badgeVariants };
