import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, name: "Ayesha Khan", client: "Acme Corp", email: "ayesha@example.com", mobile: "+92 300 0000001" },
  { id: 2, name: "Omar Siddiqui", client: "Bright Labs", email: "omar@example.com", mobile: "+92 300 0000002" },
] satisfies ResourceRecord[];

export default function ClientContactsPage() {
  return (
    <ResourceCrudPage
      title="Client Contacts"
      description="Manage additional client-side contacts that Laravel exposes through the client contacts module."
      endpoint="/contacts"
      columns={[
        { key: "name", label: "Contact Name" },
        { key: "client", label: "Client" },
        { key: "email", label: "Email" },
        { key: "mobile", label: "Mobile" },
      ]}
      fields={[
        { name: "name", label: "Contact Name", required: true, placeholder: "e.g. Ayesha Khan" },
        { name: "client", label: "Client", required: true, placeholder: "Client or company name" },
        { name: "email", label: "Email", type: "email", required: true, placeholder: "contact@example.com" },
        { name: "mobile", label: "Mobile", placeholder: "+92 300 0000000" },
      ]}
      breadcrumbs={[{ label: "Clients", value: "/clients" }]}
      createButtonLabel="Add Contact"
      initialRecords={initialRecords}
    />
  );
}
