"use client";

import dynamic from "next/dynamic";
import type { SafetyAlert } from "@/lib/types/safety";

const SafetyMapClient = dynamic(() => import("./SafetyMapClient"), {
  ssr: false,
  loading: () => (
    <div
      className="relative h-full min-h-[200px] w-full max-h-full animate-pulse rounded-lg border border-border bg-[#1e2a2a]"
      aria-hidden
    />
  ),
});

interface SafetyMapProps {
  alerts: SafetyAlert[];
  selectedAlertId: string | null;
}

export function SafetyMap({ alerts, selectedAlertId }: SafetyMapProps) {
  return <SafetyMapClient alerts={alerts} selectedAlertId={selectedAlertId} />;
}
