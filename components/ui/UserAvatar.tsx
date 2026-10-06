"use client";

import { useState } from "react";

type UserAvatarProps = {
  name: string;
  photoURL?: string | null;
  className?: string;
  textClassName?: string;
  fallbackClassName?: string;
};

function getInitials(name: string): string {
  const parts = name.split(/[_.-\s]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (name || "??").slice(0, 2).toUpperCase();
}

export function UserAvatar({
  name,
  photoURL,
  className = "h-10 w-10 rounded-xl",
  textClassName = "text-sm font-semibold text-brand-contrast",
  fallbackClassName = "bg-brand",
}: UserAvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(photoURL) && !failed;

  if (showImage) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- remote user photos from Firebase/Google
      <img
        src={photoURL!}
        alt=""
        className={`shrink-0 object-cover ${className}`}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center ${textClassName} ${fallbackClassName} ${className}`}
      aria-hidden
    >
      {getInitials(name)}
    </div>
  );
}
