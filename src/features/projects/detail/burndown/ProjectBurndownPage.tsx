import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectBurndownPage() {
  return (
    <ProjectWorkspacePage
      section="Burndown"
      description="A lightweight burndown snapshot for project task completion and remaining scope."
      endpointCandidates={["/task?project_id={projectId}&include=users", "/projects/burndown/{projectId}", "/project/{projectId}/tasks"]}
      projectDataKeys={["tasks"]}
      columns={[
        { key: "heading", label: "Task" },
        { key: "status", label: "Status" },
      ]}
      initialRecords={[
        { id: 1, heading: "Kickoff", status: "completed" },
        { id: 2, heading: "Design review", status: "completed" },
        { id: 3, heading: "Implementation", status: "in progress" },
        { id: 4, heading: "QA pass", status: "incomplete" },
      ]}
      viewMode="burndown"
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
    />
  );
}
