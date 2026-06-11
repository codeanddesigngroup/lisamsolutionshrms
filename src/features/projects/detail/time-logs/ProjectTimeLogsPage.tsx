import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectTimeLogsPage() {
  return (
    <ProjectWorkspacePage
      section="Time Logs"
      description="Project time log entries, active timer records, and member work summaries."
      endpointCandidates={["/time-log?project_id={projectId}", "/all-time-logs?project_id={projectId}", "/project/{projectId}/time-logs"]}
      projectDataKeys={["time_logs", "timeLogs", "timelogs"]}
      columns={[
        { key: "user.name", label: "Member" },
        { key: "task.heading", label: "Task" },
        { key: "start_time", label: "Start" },
        { key: "end_time", label: "End" },
        { key: "total_hours", label: "Hours" },
      ]}
      fields={[
        { name: "user_id", label: "Employee ID", type: "number", required: true },
        { name: "task_id", label: "Task ID", type: "number" },
        { name: "start_time", label: "Start Date", type: "date", required: true },
        { name: "end_time", label: "End Date", type: "date" },
        { name: "memo", label: "Memo", type: "textarea" },
      ]}
      createEndpoint="/time-log"
      updateEndpoint="/time-log/{id}"
      deleteEndpoint="/time-log/{id}"
    />
  );
}
