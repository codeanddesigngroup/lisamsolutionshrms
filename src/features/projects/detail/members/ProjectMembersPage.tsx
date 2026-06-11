import ProjectWorkspacePage from "@/components/admin/ProjectWorkspacePage";

export default function ProjectMembersPage() {
  return (
    <ProjectWorkspacePage
      section="Members"
      description="Manage the employees assigned to this project, mirroring Laravel project-member workflows."
      endpointCandidates={["/project-members/{projectId}", "/project-member?project_id={projectId}", "/project/{projectId}/members"]}
      projectDataKeys={["members"]}
      columns={[
        { key: "name", label: "Member" },
        { key: "email", label: "Email" },
        { key: "employee_detail.designation.name", label: "Designation" },
        { key: "employee_detail.department.team_name", label: "Department" },
      ]}
      fields={[
        { name: "user_id", label: "Employee ID", type: "number", required: true, placeholder: "Employee user ID" },
        { name: "hourly_rate", label: "Basic Salary (PKR)", type: "number", placeholder: "Optional basic salary" },
      ]}
      createEndpoint="/project-member"
      updateEndpoint="/project-member/{id}"
      deleteEndpoint="/project-member/{id}"
      createButtonLabel="Add Member"
    />
  );
}
