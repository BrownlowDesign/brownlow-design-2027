import { notFound } from "next/navigation";
import { getProject } from "../../_data/projects";
import { CaseStudy } from "../../_scene/CaseStudy";

type Props = { params: Promise<{ slug: string }> };

export default async function VariantBCaseStudy({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();
  return <CaseStudy variant="b" project={project} />;
}

export function generateStaticParams() {
  return [
    { slug: "atlas" },
    { slug: "drift" },
    { slug: "meridian" },
    { slug: "solstice" },
    { slug: "quorum" },
    { slug: "echo" },
  ];
}
