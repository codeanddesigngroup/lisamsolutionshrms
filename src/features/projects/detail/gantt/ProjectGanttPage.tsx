import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectGanttPage() {
  return (
    <ProjectWorkspacePage
      section="Gantt"
      description="A project timeline view backed by the same task and milestone data used by Laravel Gantt."
      endpointCandidates={["/task?project_id={projectId}&include=users", "/projects/ganttData/{projectId}", "/project/{projectId}/tasks"]}
      projectDataKeys={["tasks", "milestones"]}
      columns={[
        { key: "heading", label: "Item" },
        { key: "start_date", label: "Start" },
        { key: "due_date", label: "Due" },
        { key: "status", label: "Status" },
      ]}
      viewMode="gantt"
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
    />
  );
}
