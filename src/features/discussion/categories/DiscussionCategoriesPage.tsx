import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, name: "General" },
  { id: 2, name: "Project Questions" },
] satisfies ResourceRecord[];

export default function DiscussionCategoriesPage() {
  return (
    <ResourceCrudPage
      title="Discussion Categories"
      description="Categories used to organize project and company discussions."
      endpoint="/discussion-category"
      columns={[{ key: "name", label: "Category Name" }]}
      fields={[{ name: "name", label: "Category Name", required: true }]}
      breadcrumbs={[{ label: "Discussion", value: "/discussion" }]}
      createButtonLabel="Add Category"
      initialRecords={initialRecords}
    />
  );
}
