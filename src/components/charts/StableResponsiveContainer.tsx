"use client";

import { useSyncExternalStore, type ReactElement } from "react";
import { ResponsiveContainer } from "recharts";

type StableResponsiveContainerProps = {
  children: ReactElement;
  height?: number;
  className?: string;
};

const subscribe = () => () => {};
const getClientSnapshot = () => true;
const getServerSnapshot = () => false;

export default function StableResponsiveContainer({
  children,
  height = 256,
  className = "",
}: StableResponsiveContainerProps) {
  const isMounted = useSyncExternalStore(
    subscribe,
    getClientSnapshot,
    getServerSnapshot
  );

  return (
    <div
      className={`w-full ${className}`.trim()}
      style={{ height, minHeight: height }}
    >
      {isMounted ? (
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      ) : null}
    </div>
  );
}
