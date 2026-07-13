import RecruitmentApplicationDetailPage from "@/features/recruitment/applications/detail/RecruitmentApplicationDetailPage";

export default function Page({ params }: { params: { id: string } }) {
  return <RecruitmentApplicationDetailPage params={params} />;
}
