export type Project = {
  slug: string;
  title: string;
  category: string;
  year: number;
  // hue 0-360, used to tint the placeholder card/hero image
  hue: number;
};

export const PROJECTS: Project[] = [
  { slug: "atlas",     title: "Atlas",     category: "Brand Identity",   year: 2026, hue: 220 },
  { slug: "drift",     title: "Drift",     category: "Web Platform",     year: 2026, hue: 12  },
  { slug: "meridian",  title: "Meridian",  category: "Design System",    year: 2025, hue: 150 },
  { slug: "solstice",  title: "Solstice",  category: "Motion Design",    year: 2025, hue: 45  },
  { slug: "quorum",    title: "Quorum",    category: "Product Design",   year: 2025, hue: 280 },
  { slug: "echo",      title: "Echo",      category: "Interactive",      year: 2024, hue: 320 },
];

export function getProject(slug: string): Project | undefined {
  return PROJECTS.find((p) => p.slug === slug);
}
