import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectNotesPage() {
  return (
    <ProjectWorkspacePage
      section="Notes"
      description="Manage private and shared project notes, including the Laravel project-notes workflow."
      endpointCandidates={["/project-note?project_id={projectId}", "/project-notes/data/{projectId}", "/project/{projectId}/notes"]}
      projectDataKeys={["notes", "project_notes"]}
      columns={[
        { key: "title", label: "Title" },
        { key: "type", label: "Visibility" },
        { key: "created_at", label: "Created" },
        { key: "user.name", label: "Owner" },
      ]}
      fields={[
        { name: "title", label: "Title", required: true },
        {
          name: "type",
          label: "Visibility",
          type: "select",
          options: [
            { label: "Public", value: "public" },
            { label: "Private", value: "private" },
          ],
        },
        { name: "details", label: "Details", type: "textarea", required: true },
      ]}
      createEndpoint="/project-note"
      updateEndpoint="/project-note/{id}"
      deleteEndpoint="/project-note/{id}"
    />
  );
}
