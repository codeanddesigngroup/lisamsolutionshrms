import Link from "next/link";
import { Home, AlertTriangle } from "lucide-react";
import Button from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-50 px-4 text-center">
      <div className="mb-6 rounded-3xl bg-red-50 p-6 shadow-xl shadow-red-100/50">
        <AlertTriangle className="h-16 w-16 text-red-500" />
      </div>
      <h1 className="mb-2 text-4xl font-black text-gray-800 uppercase tracking-tighter">404</h1>
      <h2 className="mb-6 text-xl font-bold text-gray-600">Page Not Found</h2>
      <p className="mb-10 max-w-md text-sm font-medium text-gray-400 leading-relaxed">
        The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
      </p>
      <Link href="/dashboard">
        <Button className="px-8 py-3 h-auto text-[10px] uppercase tracking-[0.2em] font-black">
          <Home className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Button>
      </Link>
    </div>
  );
}
