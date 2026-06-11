import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, label_name: "Bug", color: "#ef4444" },
  { id: 2, label_name: "Feature", color: "#3b82f6" },
  { id: 3, label_name: "Client Review", color: "#10b981" },
] satisfies ResourceRecord[];

export default function TaskLabelPage() {
  return (
    <ResourceCrudPage
      title="Task Labels"
      description="Create, edit, and remove task labels used by Laravel tasks, task board, and quick task creation."
      endpoint="/task-label"
      columns={[
        { key: "label_name", label: "Label" },
        { key: "color", label: "Color" },
      ]}
      fields={[
        { name: "label_name", label: "Label Name", required: true, placeholder: "e.g. Bug" },
        { name: "color", label: "Color", type: "color", required: true },
      ]}
      breadcrumbs={[{ label: "Tasks", value: "/tasks" }]}
      createButtonLabel="Add Label"
      initialRecords={initialRecords}
    />
  );
}
