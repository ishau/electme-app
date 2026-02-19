import { redirect } from "next/navigation";

export default async function CandidateDetailPage({ params }: { params: Promise<{ candidateId: string }> }) {
  const { candidateId } = await params;
  redirect(`/candidates/${candidateId}/insights`);
}
