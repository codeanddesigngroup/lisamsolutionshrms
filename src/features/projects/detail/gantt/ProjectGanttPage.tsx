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
      initialRecords={[
        { id: 1, heading: "Kickoff", start_date: "2026-05-01", due_date: "2026-05-07", status: "completed" },
        { id: 2, heading: "Build phase", start_date: "2026-05-08", due_date: "2026-05-20", status: "in progress" },
        { id: 3, heading: "Launch", start_date: "2026-05-21", due_date: "2026-05-28", status: "incomplete" },
      ]}
      viewMode="gantt"
      allowCreate={false}
      allowEdit={false}
      allowDelete={false}
    />
  );
}
