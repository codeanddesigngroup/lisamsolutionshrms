import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, subject: "SaaS billing issue", requester: "Company Admin", priority: "high", status: "open", agent: "Support Admin" },
  { id: 2, subject: "Package upgrade question", requester: "Tenant Owner", priority: "medium", status: "pending", agent: "Support Admin" },
] satisfies ResourceRecord[];

export default function SupportTicketsPage() {
  return (
    <ResourceCrudPage
      title="Support Tickets"
      description="Separate SaaS support ticket flow from Laravel, including replies, agent ownership, and ticket metadata."
      endpoint="/support-tickets"
      columns={[
        { key: "subject", label: "Subject" },
        { key: "requester", label: "Requester" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
        { key: "agent", label: "Agent" },
      ]}
      fields={[
        { name: "subject", label: "Subject", required: true },
        { name: "requester", label: "Requester", required: true },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
            { label: "Urgent", value: "urgent" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Open", value: "open" },
            { label: "Pending", value: "pending" },
            { label: "Resolved", value: "resolved" },
            { label: "Closed", value: "closed" },
          ],
        },
        { name: "agent", label: "Agent" },
      ]}
      breadcrumbs={[{ label: "Tickets", value: "/tickets" }]}
      createButtonLabel="Add Support Ticket"
      initialRecords={initialRecords}
      statusActions={[{ label: "Close", value: "closed", endpoint: "/support-tickets/updateOtherData/{id}", method: "post" }]}
    />
  );
}
