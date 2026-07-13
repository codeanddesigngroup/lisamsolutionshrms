import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectFilesPage() {
  return (
    <ProjectWorkspacePage
      section="Files"
      description="List project uploads and external file links, matching Laravel project-files list and thumbnail flows."
      endpointCandidates={["/project/{projectId}/files", "/project-file?project_id={projectId}", "/files?project_id={projectId}"]}
      projectDataKeys={["files", "project_files"]}
      columns={[
        { key: "filename", label: "File" },
        { key: "external_link", label: "Link" },
        { key: "created_at", label: "Uploaded" },
        { key: "user.name", label: "Uploaded By" },
      ]}
      fields={[
        { name: "filename", label: "File Name", required: true },
        { name: "external_link", label: "External Link", type: "url", placeholder: "https://..." },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      createEndpoint="/project-file"
      updateEndpoint="/project-file/{id}"
      deleteEndpoint="/project-file/{id}"
      createButtonLabel="Add File Link"
    />
  );
}
