import ResourceCrudPage, { ResourceRecord } from "@/components/admin/ResourceCrudPage";

const initialRecords = [
  { id: 1, discussion: "Project kickoff", replied_by: "Admin", message: "Agenda has been uploaded.", best_answer: "no" },
  { id: 2, discussion: "Deployment window", replied_by: "Developer", message: "Friday evening works.", best_answer: "yes" },
] satisfies ResourceRecord[];

export default function DiscussionReplyPage() {
  return (
    <ResourceCrudPage
      title="Discussion Replies"
      description="Create and moderate replies on discussions, including marking the best answer."
      endpoint="/discussion-reply"
      columns={[
        { key: "discussion", label: "Discussion" },
        { key: "replied_by", label: "Replied By" },
        { key: "message", label: "Message" },
        { key: "best_answer", label: "Best Answer" },
      ]}
      fields={[
        { name: "discussion", label: "Discussion", required: true },
        { name: "replied_by", label: "Replied By" },
        { name: "message", label: "Message", type: "textarea", required: true },
        {
          name: "best_answer",
          label: "Best Answer",
          type: "select",
          options: [
            { label: "No", value: "no" },
            { label: "Yes", value: "yes" },
          ],
        },
      ]}
      breadcrumbs={[{ label: "Discussion", value: "/discussion" }]}
      createButtonLabel="Add Reply"
      initialRecords={initialRecords}
      statusActions={[{ label: "Best", value: "yes", endpoint: "/discussion/setBestAnswer", method: "post" }]}
    />
  );
}
