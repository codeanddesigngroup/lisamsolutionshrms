import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, heading: "Prepare launch checklist", requested_by: "Client User", project: "Website Redesign", status: "pending" },
  { id: 2, heading: "Update payroll export", requested_by: "Finance Team", project: "Internal HR", status: "approved" },
] satisfies ResourceRecord[];

export default function TaskRequestPage() {
  return (
    <ResourceCrudPage
      title="Task Requests"
      description="Review incoming task requests, approve them into tasks, or reject requests with their attached files."
      endpoint="/task-request"
      columns={[
        { key: "heading", label: "Task Request" },
        { key: "requested_by", label: "Requested By" },
        { key: "project", label: "Project" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "heading", label: "Task Heading", required: true },
        { name: "requested_by", label: "Requested By" },
        { name: "project", label: "Project" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Pending", value: "pending" },
            { label: "Approved", value: "approved" },
            { label: "Rejected", value: "rejected" },
          ],
        },
      ]}
      breadcrumbs={[{ label: "Tasks", value: "/tasks" }]}
      createButtonLabel="Add Request"
      initialRecords={initialRecords}
      statusActions={[
        { label: "Approve", value: "approved", method: "put" },
        { label: "Reject", value: "rejected", endpoint: "/task-request/reject-tasks/{id}", method: "post" },
      ]}
    />
  );
}
