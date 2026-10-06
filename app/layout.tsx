import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-geist-sans" });

export const metadata: Metadata = {
  title: "RideMesh Admin",
  description: "RideMesh administrative dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={manrope.variable} data-theme="light">
      <body className="min-h-screen bg-background font-sans text-text-primary">{children}</body>
    </html>
  );
}
