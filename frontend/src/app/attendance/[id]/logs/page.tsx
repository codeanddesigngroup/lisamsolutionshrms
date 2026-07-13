import AttendanceLogsPage from "@/features/attendance/logs/AttendanceLogsPage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AttendanceLogsPage />
    </Suspense>
  );
}
