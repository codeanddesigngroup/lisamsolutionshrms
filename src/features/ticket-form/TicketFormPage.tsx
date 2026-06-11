import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, field_name: "Name", field_type: "text", required: "yes", status: "active" },
  { id: 2, field_name: "Email", field_type: "email", required: "yes", status: "active" },
  { id: 3, field_name: "Priority", field_type: "select", required: "no", status: "active" },
] satisfies ResourceRecord[];

export default function TicketFormPage() {
  return (
    <ResourceCrudPage
      title="Ticket Form"
      description="Configure the public ticket form fields and sort/status behavior that Laravel exposes through TicketCustomFormController."
      endpoint="/ticket-form"
      columns={[
        { key: "field_name", label: "Field" },
        { key: "field_type", label: "Type" },
        { key: "required", label: "Required" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "field_name", label: "Field Name", required: true },
        {
          name: "field_type",
          label: "Field Type",
          type: "select",
          options: [
            { label: "Text", value: "text" },
            { label: "Email", value: "email" },
            { label: "Textarea", value: "textarea" },
            { label: "Select", value: "select" },
            { label: "Date", value: "date" },
          ],
        },
        {
          name: "required",
          label: "Required",
          type: "select",
          options: [
            { label: "Yes", value: "yes" },
            { label: "No", value: "no" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Active", value: "active" },
            { label: "Inactive", value: "inactive" },
          ],
        },
      ]}
      breadcrumbs={[{ label: "Ticket Settings", value: "/ticket-settings" }]}
      createButtonLabel="Add Field"
      initialRecords={initialRecords}
      statusActions={[{ label: "Active", value: "active", endpoint: "/ticket-form/sortFields", method: "post" }]}
    />
  );
}
