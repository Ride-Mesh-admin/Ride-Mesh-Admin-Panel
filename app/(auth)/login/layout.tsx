import { Suspense } from "react";

function LoginFallback() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="h-10 w-10 animate-pulse rounded-full bg-surface" aria-hidden />
    </div>
  );
}

export default function LoginRouteLayout({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<LoginFallback />}>{children}</Suspense>;
}
