"use client";

import Link from "next/link";
import { ShieldAlert, ArrowLeft, Home, LogOut } from "lucide-react";
import { getDefaultRouteForRole } from "@/lib/auth-contract";
import { clearSession, getStoredUser } from "@/lib/session";

export default function UnauthorizedPage() {
  const user = getStoredUser();
  const homeHref = getDefaultRouteForRole(user?.role);

  const handleLogout = () => {
    clearSession();
    window.location.href = "/login";
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7f9] p-6">
      <section className="w-full max-w-lg rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-500">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h1 className="text-xl font-black uppercase tracking-widest text-gray-900">Access Restricted</h1>
        <p className="mx-auto mt-3 max-w-md text-sm font-medium leading-6 text-gray-500">
          Your current role does not have permission to open this area. Please contact your administrator if you believe this is an error.
        </p>

        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          <button
            type="button"
            onClick={() => window.history.back()}
            className="inline-flex h-11 items-center justify-center rounded-xl border border-gray-100 bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-primary"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </button>
          <Link
            href={homeHref}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-primary text-[10px] font-black uppercase tracking-widest text-white shadow-lg shadow-primary/20"
          >
            <Home className="mr-2 h-4 w-4" />
            Home
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex h-11 items-center justify-center rounded-xl bg-gray-100 text-[10px] font-black uppercase tracking-widest text-gray-500 transition-colors hover:text-red-500"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </button>
        </div>
      </section>
    </main>
  );
}
