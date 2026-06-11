import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, type_name: "Casual", no_of_leaves: 12, color: "#10b981" },
  { id: 2, type_name: "Sick", no_of_leaves: 8, color: "#ef4444" },
] satisfies ResourceRecord[];

export default function LeaveTypePage() {
  return (
    <ResourceCrudPage
      title="Leave Types"
      description="Configure leave type balances and colors used by leave requests and reports."
      endpoint="/leaveType"
      columns={[
        { key: "type_name", label: "Leave Type" },
        { key: "no_of_leaves", label: "Allowed Leaves" },
        { key: "color", label: "Color" },
      ]}
      fields={[
        { name: "type_name", label: "Leave Type", required: true },
        { name: "no_of_leaves", label: "Allowed Leaves", type: "number", required: true },
        { name: "color", label: "Color", type: "color", required: true },
      ]}
      breadcrumbs={[{ label: "Leaves", value: "/leaves" }]}
      createButtonLabel="Add Leave Type"
      initialRecords={initialRecords}
    />
  );
}
