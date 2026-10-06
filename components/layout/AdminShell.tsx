"use client";

import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { Sidebar } from "@/components/layout/Sidebar";
import { AdminPanelProvider } from "@/components/layout/AdminPanelProvider";

export function AdminShell({ children }: { children: React.ReactNode }) {
  return (
    <AdminPanelProvider>
      <div className="page-mesh-bg flex min-h-screen">
        <Sidebar />
        <div className="flex flex-1 flex-col pl-64">
          <Header />
          <main className="animate-fade-up flex-1 overflow-auto px-4 py-6 sm:px-8">{children}</main>
          <Footer />
        </div>
      </div>
    </AdminPanelProvider>
  );
}
