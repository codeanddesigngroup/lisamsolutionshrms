import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectDiscussionsPage() {
  return (
    <ProjectWorkspacePage
      section="Discussions"
      description="Create and review project discussion threads and replies from the Laravel discussion area."
      endpointCandidates={["/project/{projectId}/discussions", "/discussion?project_id={projectId}", "/projects/discussion/{projectId}"]}
      projectDataKeys={["discussions"]}
      columns={[
        { key: "title", label: "Discussion" },
        { key: "category.name", label: "Category" },
        { key: "user.name", label: "Started By" },
        { key: "created_at", label: "Created" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        { name: "category_id", label: "Category ID", type: "number" },
        { name: "description", label: "Description", type: "textarea", required: true },
      ]}
      createEndpoint="/discussion"
      updateEndpoint="/discussion/{id}"
      deleteEndpoint="/discussion/{id}"
      detailPathTemplate="/discussion/{id}"
    />
  );
}
