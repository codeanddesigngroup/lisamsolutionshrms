import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectPaymentsPage() {
  return (
    <ProjectWorkspacePage
      section="Payments"
      description="Review and record payments related to this project."
      endpointCandidates={["/payment?project_id={projectId}", "/project/{projectId}/payments"]}
      projectDataKeys={["payments"]}
      columns={[
        { key: "paid_on", label: "Paid On" },
        { key: "amount", label: "Amount" },
        { key: "gateway", label: "Gateway" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "paid_on", label: "Paid On", type: "date", required: true },
        { name: "amount", label: "Amount", type: "number", required: true },
        { name: "gateway", label: "Gateway" },
        { name: "remarks", label: "Remarks", type: "textarea" },
      ]}
      createEndpoint="/payment"
      updateEndpoint="/payment/{id}"
      deleteEndpoint="/payment/{id}"
    />
  );
}
