import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, category_name: "Web Development" },
  { id: 2, category_name: "Mobile App" },
] satisfies ResourceRecord[];

export default function ProjectCategoryPage() {
  return (
    <ResourceCrudPage
      title="Project Categories"
      description="Project category records used by create/edit project forms and reporting filters."
      endpoint="/project-category"
      columns={[{ key: "category_name", label: "Category Name" }]}
      fields={[{ name: "category_name", label: "Category Name", required: true }]}
      breadcrumbs={[{ label: "Projects", value: "/projects" }]}
      createButtonLabel="Add Category"
      initialRecords={initialRecords}
    />
  );
}
