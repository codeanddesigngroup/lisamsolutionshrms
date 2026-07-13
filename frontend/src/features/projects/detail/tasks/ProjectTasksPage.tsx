import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectTasksPage() {
  return (
    <ProjectWorkspacePage
      section="Tasks"
      description="Project task list and project-specific task controls from Laravel."
      endpointCandidates={["/task?project_id={projectId}&include=users", "/project/{projectId}/tasks"]}
      projectDataKeys={["tasks"]}
      columns={[
        { key: "heading", label: "Task" },
        { key: "users", label: "Assignees" },
        { key: "due_date", label: "Due Date" },
        { key: "priority", label: "Priority" },
        { key: "status", label: "Status" },
      ]}
      fields={[
        { name: "heading", label: "Task Title", required: true },
        { name: "assigned_user_id", label: "Assignee User ID", type: "number", required: true },
        { name: "due_date", label: "Due Date", type: "date", required: true },
        {
          name: "priority",
          label: "Priority",
          type: "select",
          options: [
            { label: "Low", value: "low" },
            { label: "Medium", value: "medium" },
            { label: "High", value: "high" },
          ],
        },
        {
          name: "status",
          label: "Status",
          type: "select",
          options: [
            { label: "Incomplete", value: "incomplete" },
            { label: "Completed", value: "completed" },
          ],
        },
        { name: "description", label: "Description", type: "textarea" },
      ]}
      createEndpoint="/task"
      updateEndpoint="/task/{id}"
      deleteEndpoint="/task/{id}"
      detailPathTemplate="/tasks/{id}"
      statusActions={[
        { label: "Complete", value: "completed", method: "patch" },
        { label: "Reopen", value: "incomplete", method: "patch" },
      ]}
    />
  );
}
