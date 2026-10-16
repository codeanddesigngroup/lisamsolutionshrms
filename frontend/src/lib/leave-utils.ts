import { getLeaveDate, getLeaveEmployeeId, type HRRecord } from "@/lib/hr-utils";

export const inclusiveLeaveDays = (start: string, end: string) => {
  const startTime = Date.parse(`${start.slice(0, 10)}T00:00:00Z`);
  const endTime = Date.parse(`${end.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) return 1;
  return Math.floor((endTime - startTime) / 86400000) + 1;
};

export const collapseLegacyMultiDayLeaves = <T extends HRRecord>(records: T[]): T[] => {
  const groups = new Map<string, T[]>();
  const standalone: T[] = [];

  records.forEach((leave) => {
    const start = getLeaveDate(leave).slice(0, 10);
    const end = String(leave.end_date || "").slice(0, 10);
    if (String(leave.duration || "").toLowerCase() !== "multiple" || !start || !end || !leave.created_at) {
      standalone.push({ ...leave, legacy_group_ids: [leave.id] });
      return;
    }

    const key = [
      getLeaveEmployeeId(leave),
      leave.leave_type_id || leave.leave_type?.id || "",
      leave.reason || "",
      leave.status,
      end,
      leave.created_at,
    ].join("|");
    groups.set(key, [...(groups.get(key) || []), leave]);
  });

  groups.forEach((group) => {
    const sorted = [...group].sort((a, b) => getLeaveDate(a).localeCompare(getLeaveDate(b)));
    const start = getLeaveDate(sorted[0]).slice(0, 10);
    const end = String(sorted[0].end_date || "").slice(0, 10);
    const expectedDays = inclusiveLeaveDays(start, end);
    const dates = sorted.map((leave) => getLeaveDate(leave).slice(0, 10));
    const isExpandedRequest = sorted.length > 1
      && sorted.every((leave) => String(leave.end_date || "").slice(0, 10) === end)
      && new Set(dates).size === expectedDays
      && expectedDays === dates.length
      && dates[0] === start
      && dates[dates.length - 1] === end;

    if (!isExpandedRequest) {
      standalone.push(...sorted.map((leave) => ({ ...leave, legacy_group_ids: [leave.id] })));
      return;
    }

    standalone.push({
      ...sorted[0],
      leave_date: start,
      date: start,
      end_date: end,
      legacy_group_ids: sorted.map((leave) => leave.id),
    });
  });

  return standalone.sort((a, b) => getLeaveDate(b).localeCompare(getLeaveDate(a)));
};
