import { IndexGrid } from "../_scene/IndexGrid";
import { PROJECTS } from "../_data/projects";

export default function VariantCIndex() {
  return <IndexGrid variant="c" projects={PROJECTS} />;
}
