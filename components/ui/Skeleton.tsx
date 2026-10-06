import type { HTMLAttributes } from "react";

type SkeletonProps = HTMLAttributes<HTMLDivElement> & {
  className?: string;
};

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-xl bg-border/60 ${className}`}
      aria-hidden
      {...props}
    />
  );
}
