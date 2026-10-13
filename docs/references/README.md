# References

Library docs pinned to the versions in `package.json`, in LLM-friendly form (`*-llms.txt` or trimmed markdown).
Agents read these instead of guessing APIs from memory, because these libraries change between major versions.

Task 000 populates this folder. For each library, save the official `llms.txt` if one exists; otherwise save a trimmed markdown of the API pages we use:

- `next-llms.txt` — App Router, layouts/templates, view transitions, `next/dynamic`
- `r3f.md` — Canvas, frameloop, useFrame, invalidate
- `drei-view.md` — `View`, tunnels
- `gsap-scrolltrigger.md` — ScrollTrigger, ticker (if a lab uses it)
- `lenis.md` (if a lab uses it)
- `motion.md` (if a lab uses it)
- `style-dictionary.md` — v4 config, DTCG, custom formats
- `playwright-screenshots.md` — `toHaveScreenshot`, snapshot paths

Record the version at the top of each file. When a dependency's major version changes, refresh its reference in the same PR.
