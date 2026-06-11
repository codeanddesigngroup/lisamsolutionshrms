import AttendancePage from "@/features/attendance/list/AttendancePage";
import { Suspense } from "react";

export default function Page() {
  return (
    <Suspense fallback={null}>
      <AttendancePage mode="date-wise" />
    </Suspense>
  );
}
