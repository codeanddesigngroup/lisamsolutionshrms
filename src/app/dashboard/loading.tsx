import { RefreshCw } from "lucide-react";

export default function Loading() {
  return (
    <div className="flex h-[calc(100vh-65px)] w-full items-center justify-center bg-white/50 backdrop-blur-sm">
      <div className="flex flex-col items-center">
        <RefreshCw className="h-10 w-10 text-primary animate-spin mb-4" />
        <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] animate-pulse">
          Loading Dashboard...
        </p>
      </div>
    </div>
  );
}
