"use client";

interface DeviceStatusBadgeProps {
  status: "online" | "offline";
}

export default function DeviceStatusBadge({ status }: DeviceStatusBadgeProps) {
  const isOnline = status === "online";
  
  return (
    <div className="flex items-center gap-2">
      <span className="relative flex h-2 w-2">
        {isOnline && (
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75"></span>
        )}
        <span className={`relative inline-flex h-2 w-2 rounded-full ${isOnline ? "bg-success" : "bg-danger"}`}></span>
      </span>
      <span className={`text-[10px] font-black uppercase tracking-widest ${isOnline ? "text-success" : "text-danger"}`}>
        {status}
      </span>
    </div>
  );
}
