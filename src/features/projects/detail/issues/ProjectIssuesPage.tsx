import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectIssuesPage() {
  return (
    <ProjectWorkspacePage
      section="Issues"
      description="Track project issue records from the Laravel project issues submodule."
      endpointCandidates={["/issue?project_id={projectId}", "/project/{projectId}/issues"]}
      projectDataKeys={["issues"]}
      columns={[
        { key: "title", label: "Issue" },
        { key: "status", label: "Status" },
        { key: "user.name", label: "Reported By" },
        { key: "created_at", label: "Created" },
      ]}
      fields={[
        { name: "title", label: "Issue Title", required: true },
        { name: "description", label: "Description", type: "textarea" },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Open", value: "open" },
            { label: "Pending", value: "pending" },
            { label: "Closed", value: "closed" },
          ],
        },
      ]}
      createEndpoint="/issue"
      updateEndpoint="/issue/{id}"
      deleteEndpoint="/issue/{id}"
      statusActions={[
        { label: "Close", value: "closed", method: "patch" },
        { label: "Reopen", value: "open", method: "patch" },
      ]}
    />
  );
}
