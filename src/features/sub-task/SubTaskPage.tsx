import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, title: "Collect homepage copy", task: "Website Redesign", assigned_to: "Jane Smith", status: "incomplete" },
  { id: 2, title: "Attach brand assets", task: "Website Redesign", assigned_to: "John Doe", status: "completed" },
] satisfies ResourceRecord[];

export default function SubTaskPage() {
  return (
    <ResourceCrudPage
      title="Sub Tasks"
      description="Manage subtasks and their statuses. Laravel also supports subtask files, which should be added as the next detail action."
      endpoint="/sub-task"
      columns={[
        { key: "title", label: "Sub Task" },
        { key: "task", label: "Parent Task" },
        { key: "assigned_to", label: "Assigned To" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "title", label: "Sub Task", required: true },
        { name: "task", label: "Parent Task", required: true },
        { name: "assigned_to", label: "Assigned To" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Incomplete", value: "incomplete" },
            { label: "Completed", value: "completed" },
          ],
        },
      ]}
      breadcrumbs={[{ label: "Tasks", value: "/tasks" }]}
      createButtonLabel="Add Sub Task"
      initialRecords={initialRecords}
      statusActions={[{ label: "Complete", value: "completed", endpoint: "/sub-task/changeStatus", method: "post" }]}
    />
  );
}
