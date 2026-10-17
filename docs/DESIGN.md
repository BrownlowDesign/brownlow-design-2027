
# Design rubric

> **Owner: Ryan.** Agents read this; they don't edit it except to propose changes in a PR comment.
> Until the `TODO` sections are filled in, content and final visual design tasks are blocked. Lab tasks use placeholder tokens and are judged on mechanics only.

The visual reviewer grades snapshots against the criteria below. Write criteria that someone with fresh eyes could check from a screenshot.

## Point of view
In the first 5 seconds: calm, precise, expensive — a quiet dark room where one clear sentence is lit. Nothing competes with the hero line.
After 10 seconds: this person makes hard technology usable, at every level from founding to 800M users, and the site itself is proof of the craft.

Reviewer check: on every checkpoint, there is exactly one obvious focal point. If the eye doesn't know where to land, it fails.

## Typography
- **Typefaces:** One sans for display and body, one mono for metadata (subtitles, labels, metrics, dates, case study tags). No third family. [DECIDE: Söhne + Söhne Mono (paid), or Inter Display/Inter + JetBrains Mono (free)]
- **Scale:** 1.25 ratio (major third) from a 17px body on desktop, 16px on mobile. Display sizes may jump to the next step on the scale but must land on it — no one-off sizes.
- **Weights:** Max 3 in use (e.g. 400, 500, 600). Display headlines use tight tracking (−1% to −3%); body uses default tracking; mono is never bold.
- **Line length:** Body 55–65ch. Headlines ≤ 20ch per line on desktop.
- **Line height:** Body 1.5–1.6. Display 1.0–1.15.
- **Headlines on scroll:** Headlines arrive line by line (opacity + ≤ 24px vertical travel) and then stay put. They never scale, blur, skew, or scrub with scroll once readable.
- **Metrics:** Numbers are the hero of case study cards — set in display or mono, larger than the surrounding text, never buried in a sentence.

**Violations:**
- Any size not in the scale
- Body text < 16px, or secondary text < 14px
- Widows (single word on the last line of a headline)
- Centered body text longer than 2 lines
- ALL CAPS on anything other than mono labels
- More than one headline competing at the same size in one viewport

## Color and surface
- **Intent:** Dark, neutral, quiet. Color is used for meaning and emphasis, not decoration. Reference: Hex dark product pages — restraint, layered near-black surfaces, one accent.
- **Base:** Near-black, never pure #000 (e.g. #0B0B0C). Surfaces step up in lightness for elevation (base → raised → overlay); max 3 surface levels.
- **Text:** Primary ≈ 92% white, secondary ≈ 64%, tertiary only for metadata. No pure #FFF body text.
- **Accent:** One accent hue. [DECIDE: hue] Used for interactive states, key metrics, and the shader's highlight — nowhere else. Accent covers < 5% of any viewport.
- **Contrast floor:** Body and secondary text ≥ 4.5:1. Large display text (≥ 24px) ≥ 3:1. Text over a shader is measured against the brightest shader pixel behind its bounding box, not the average.
- **Shaders and palette:** Shaders draw only from palette tokens (base surfaces + accent). Shaders are always darker than the text they sit behind.

**Violations:**
- A second accent hue
- Gradients that aren't from the shader system
- Borders brighter than secondary text
- Any surface lighter than the raised level outside an overlay or modal

## Layout and density
- **Grid:** 12 columns desktop, 8 tablet, 4 mobile. Max content width 1280px. Gutters 24px desktop, 16px mobile. Side margins ≥ 16px at 375px with no horizontal scroll.
- **Rhythm:** All spacing comes from an 8px scale. Section spacing is consistent across the homepage.
- **Whitespace:** Generous, but a viewport is never empty. "Too much" = any scroll checkpoint where the visible viewport has no content and no intentional shader moment. Max one full viewport of shader-only "breath" per story beat.
- **Density:** Case study cards show: role, one-line problem, 2–3 metrics, company. Nothing else. A recruiter must be able to qualify each card without clicking.
- **Case study pacing:** Page opens with a 3-line summary (problem, my role, outcome) and metrics above the fold. Then: context → key decisions → system/craft → result. One idea per section; no section longer than ~2 viewports without an image, diagram, or pull quote.

**Violations:**
- Elements off grid or spacing off the 8px scale
- Card layouts with mismatched heights in one row
- Images bleeding off-grid without being an intentional full-bleed
- Outcomes not visible in the first viewport of a case study

## Motion personality
Fast with control. Like a canopy pilot's swoop: real speed, absolute precision, a clean landing. Things arrive with weight and settle exactly where they belong. Nothing wobbles.

- **Easing:** Strong ease-out (e.g. cubic-bezier(0.22, 1, 0.36, 1)). No overshoot, no springs with bounce.
- **Duration:** UI 150–250ms. Content reveals 400–700ms. Nothing over 1s except scroll-scrubbed storytelling.
- **Distance:** Reveals travel ≤ 24px. Movement is vertical or along the content's reading direction.
- **Stagger:** ≤ 60ms between items, max 6 staggered items per group.
- **Scroll:** Scroll scrubs story moments (hero, beat transitions, shader). Ordinary content reveals trigger once and stay. Nothing re-animates on scroll-up.
- **Hover:** Responds in < 150ms. Subtle: surface lift, accent underline, or cursor-aware highlight. No scale > 1.02.

**Off-brand:**
- Bounce, elastic, wobble, overshoot
- Parallax on text
- Scroll-jacking (scroll speed or direction altered)
- Rotation or 3D flips of content
- Typewriter text effects
- Marquees/tickers
- Cursor followers and custom cursors
- Elements animating in from the sides for no reason

## Shaders
- **Role:** Atmosphere first, storytelling second, never data. The shader carries the site's thesis visually: scattered signal resolving into structure — noise becoming an organized field as you scroll. It's the visual metaphor for "context."
- **Behavior:** Shader state is tied to scroll progress through the story beats. It is calm when idle (slow drift at most) and never demands attention while someone is reading.
- **Placement:** Max one shader surface per viewport. Shaders sit behind or between content, never on top of it.
- **Intensity:** Behind text, the shader is dimmed or masked so contrast passes at the brightest point. Full intensity is only allowed in shader-only "breath" moments.
- **Tiers:** Reduced tier = a static frame of the shader at the matching story state. Static tier = a pre-rendered image. Both must look intentional, not broken.

**Never:**
- Generic gradient blobs or mesh-gradient lava lamps
- Particles for decoration
- Colors outside the palette
- Rainbow/iridescent hues
- Shader motion that continues at speed when the user isn't scrolling
- Visible banding or aliasing at any checkpoint
- A shader that reads as a stock "AI" visual (neural-net nodes, glowing brains, circuit traces)

## Fail conditions (reviewer rejects if any are true)
- Text over a shader fails contrast at any checkpoint
- Layout shift visible between progress checkpoints that isn't an intended animation
- Reduced tier still has scroll-scrubbed movement
- Static tier hides content that exists in full tier
- More than one focal point competes in a viewport
- Any type size, color, or spacing value not in the token set
- A second accent hue appears
- Any easing with visible overshoot or bounce
- Headline widow, or body line length > 75ch
- Horizontal scroll at 375px width
- Placeholder copy, lorem ipsum, or "TBD" in a content-tier snapshot
- A case study card missing role, company, or at least 2 metrics
- Stock imagery, stock illustration, or emoji in the UI
- Shader-only viewport appears more than once per story beat
- The contact CTA is not reachable within one scroll from the end of the homepage