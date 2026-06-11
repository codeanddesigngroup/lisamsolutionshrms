import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, title: "Renewal Call", client: "Acme Corp", visibility: "private", details: "Follow up on the renewal proposal." },
  { id: 2, title: "Payment Preference", client: "Bright Labs", visibility: "shared", details: "Prefers bank transfer for invoices." },
] satisfies ResourceRecord[];

export default function NotesPage() {
  return (
    <ResourceCrudPage
      title="Notes"
      description="Client/member notes from Laravel, including the private-note workflow that should be backed by note verification endpoints."
      endpoint="/notes"
      columns={[
        { key: "title", label: "Title" },
        { key: "client", label: "Related To" },
        { key: "visibility", label: "Visibility" },
        { key: "details", label: "Details" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true, placeholder: "Note title" },
        { name: "client", label: "Related To", placeholder: "Client, member, or project" },
        {
          name: "visibility",
          label: "Visibility",
          type: "select",
          options: [
            { label: "Private", value: "private" },
            { label: "Shared", value: "shared" },
          ],
        },
        { name: "details", label: "Details", type: "textarea", required: true },
      ]}
      breadcrumbs={[{ label: "Clients", value: "/clients" }]}
      createButtonLabel="Add Note"
      initialRecords={initialRecords}
    />
  );
}
