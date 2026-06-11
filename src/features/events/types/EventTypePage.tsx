import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, type_name: "Meeting", color: "#3b82f6" },
  { id: 2, type_name: "Holiday", color: "#10b981" },
] satisfies ResourceRecord[];

export default function EventTypePage() {
  return (
    <ResourceCrudPage
      title="Event Types"
      description="Configure event types used in the admin event calendar."
      endpoint="/event-type"
      columns={[
        { key: "type_name", label: "Type" },
        { key: "color", label: "Color" },
      ]}
      fields={[
        { name: "type_name", label: "Type Name", required: true },
        { name: "color", label: "Color", type: "color", required: true },
      ]}
      breadcrumbs={[{ label: "Events", value: "/event-calendar" }]}
      createButtonLabel="Add Event Type"
      initialRecords={initialRecords}
    />
  );
}
