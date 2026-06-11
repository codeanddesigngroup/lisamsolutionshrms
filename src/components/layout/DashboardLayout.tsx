"use client";

import { useCallback, useState } from "react";
import Sidebar from "./Sidebar";
import Navbar from "./Navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const closeMobileSidebar = useCallback(() => setIsMobileSidebarOpen(false), []);
  const openMobileSidebar = useCallback(() => setIsMobileSidebarOpen(true), []);

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden max-w-full">
      {/* Sidebar */}
      <Sidebar
        mobileOpen={isMobileSidebarOpen}
        onMobileClose={closeMobileSidebar}
      />

      {/* Main Content */}
      <div className="flex flex-1 flex-col transition-all duration-300 min-w-0 max-w-full md:pl-[70px]">
        <Navbar onMenuClick={openMobileSidebar} />
        <main className="flex-1 overflow-x-hidden p-4 sm:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
