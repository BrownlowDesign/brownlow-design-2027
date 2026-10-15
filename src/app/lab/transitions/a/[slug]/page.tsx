import { notFound } from "next/navigation";
import { getProject } from "../../_data/projects";
import { CaseStudy } from "../../_scene/CaseStudy";

type Props = { params: Promise<{ slug: string }> };

export default async function VariantACaseStudy({ params }: Props) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  return (
    // viewTransitionName on the hero container matches the card wrapper in the
    // index page, enabling the shared-element morph via View Transitions API.
    <div style={{ viewTransitionName: `hero-${slug}` }}>
      <CaseStudy variant="a" project={project} />
    </div>
  );
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
