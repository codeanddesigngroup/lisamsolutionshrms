import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectExpensesPage() {
  return (
    <ProjectWorkspacePage
      section="Expenses"
      description="Project expense records, matching the Laravel project expenses tab."
      endpointCandidates={["/expense?project_id={projectId}&include=user,category,project", "/project/{projectId}/expenses"]}
      projectDataKeys={["expenses"]}
      columns={[
        { key: "item_name", label: "Expense" },
        { key: "category.name", label: "Category" },
        { key: "price", label: "Amount" },
        { key: "purchase_date", label: "Date" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "item_name", label: "Expense Name", required: true },
        { name: "price", label: "Amount", type: "number", required: true },
        { name: "purchase_date", label: "Purchase Date", type: "date" },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      createEndpoint="/expense"
      updateEndpoint="/expense/{id}"
      deleteEndpoint="/expense/{id}"
    />
  );
}
