"use client";

import Image from "next/image";
import { useState } from "react";

type UserAvatarProps = {
  name: string;
  photoURL?: string | null;
  className?: string;
  textClassName?: string;
  fallbackClassName?: string;
};

const OPTIMIZED_HOSTS = new Set([
  "firebasestorage.googleapis.com",
  "storage.googleapis.com",
  "lh3.googleusercontent.com",
  "lh4.googleusercontent.com",
  "lh5.googleusercontent.com",
  "lh6.googleusercontent.com",
  "avatars.githubusercontent.com",
]);

function getInitials(name: string): string {
  const parts = name.split(/[_.-\s]/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (name || "??").slice(0, 2).toUpperCase();
}

function sizeFromClass(className: string): number {
  const match = className.match(/\bh-(\d+)\b/);
  if (!match) return 40;
  return Number(match[1]) * 4;
}

function hostOf(url: string): string | null {
  try {
    return new URL(url).hostname;
  } catch {
    return null;
  }
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
  const px = sizeFromClass(className);
  const host = photoURL ? hostOf(photoURL) : null;
  const canOptimize = Boolean(host && OPTIMIZED_HOSTS.has(host));

  if (showImage) {
    return (
      <Image
        src={photoURL!}
        alt=""
        width={px}
        height={px}
        className={`shrink-0 object-cover ${className}`}
        onError={() => setFailed(true)}
        unoptimized={!canOptimize}
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
