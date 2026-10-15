import { IndexGrid } from "../_scene/IndexGrid";
import { PROJECTS } from "../_data/projects";

export default function VariantBIndex() {
  return <IndexGrid variant="b" projects={PROJECTS} />;
}
