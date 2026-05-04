export function RideMeshIcon({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path d="M12 2a6.5 6.5 0 0 0-6.5 6.5c0 4.5 6.5 12.5 6.5 12.5S18.5 13 18.5 8.5A6.5 6.5 0 0 0 12 2Z" fill="currentColor" />
      <path d="M9.5 9.2 11 7.8l1.8 1.8 1.7-1.7 1.2 1.2-2.9 2.9L11 10.2l-.8.8-1.7-1.8Z" fill="var(--brand-contrast)" />
    </svg>
  );
}
