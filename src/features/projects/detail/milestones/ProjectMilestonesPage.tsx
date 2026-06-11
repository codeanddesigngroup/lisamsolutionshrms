import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectMilestonesPage() {
  return (
    <ProjectWorkspacePage
      section="Milestones"
      description="Track project milestones, status, cost, and due dates from the Laravel milestones module."
      endpointCandidates={["/project/{projectId}/milestones", "/milestone?project_id={projectId}", "/milestones/data/{projectId}"]}
      projectDataKeys={["milestones"]}
      columns={[
        { key: "milestone_title", label: "Milestone" },
        { key: "due_date", label: "Due Date" },
        { key: "cost", label: "Cost" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "milestone_title", label: "Milestone Title", required: true },
        { name: "summary", label: "Summary", type: "textarea" },
        { name: "due_date", label: "Due Date", type: "date" },
        { name: "cost", label: "Cost", type: "number" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Incomplete", value: "incomplete" },
            { label: "Complete", value: "complete" },
          ],
        },
      ]}
      initialRecords={[
        { id: 1, milestone_title: "Discovery complete", due_date: "2026-05-15", cost: 0, status: "incomplete" },
      ]}
      createEndpoint="/milestone"
      updateEndpoint="/milestone/{id}"
      deleteEndpoint="/milestone/{id}"
      statusActions={[
        { label: "Complete", value: "complete", method: "patch" },
        { label: "Reopen", value: "incomplete", method: "patch" },
      ]}
    />
  );
}
