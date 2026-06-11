import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectInvoicesPage() {
  return (
    <ProjectWorkspacePage
      section="Invoices"
      description="Project-scoped invoices, including Laravel project invoice creation and invoice views."
      endpointCandidates={["/invoice?project_id={projectId}&include=client,project", "/project/{projectId}/invoices"]}
      projectDataKeys={["invoices"]}
      columns={[
        { key: "invoice_number", label: "Invoice" },
        { key: "client.name", label: "Client" },
        { key: "issue_date", label: "Issue Date" },
        { key: "total", label: "Total" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "invoice_number", label: "Invoice Number", required: true },
        { name: "issue_date", label: "Issue Date", type: "date", required: true },
        { name: "due_date", label: "Due Date", type: "date" },
        { name: "total", label: "Total", type: "number", required: true },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Unpaid", value: "unpaid" },
            { label: "Paid", value: "paid" },
            { label: "Partial", value: "partial" },
          ],
        },
      ]}
      createEndpoint="/invoice"
      updateEndpoint="/invoice/{id}"
      deleteEndpoint="/invoice/{id}"
      detailPathTemplate="/invoices/{id}"
    />
  );
}
