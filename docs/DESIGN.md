# Design rubric

> **Owner: Ryan.** Agents read this; they don't edit it except to propose changes in a PR comment.
> Until the `TODO` sections are filled in, content and final visual design tasks are blocked. Lab tasks use placeholder tokens and are judged on mechanics only.

The visual reviewer grades snapshots against the criteria below. Write criteria that someone with fresh eyes could check from a screenshot.

## Point of view
TODO — One or two sentences. What should someone feel in the first 5 seconds? What should they believe about you after 60?

## Typography
TODO — Typefaces, scale ratio, max line length, how headlines behave on scroll. What counts as a violation?

## Color and surface
TODO — Palette intent, contrast floor (≥ 4.5:1 body text is the default), how shaders relate to the palette.

## Layout and density
TODO — Grid, margins, how much whitespace is "too much", how case studies are paced.

## Motion personality
TODO — e.g. "Weighted, deliberate, never bouncy. Things arrive, they don't pop. Scroll scrubs, it doesn't trigger." List what's off-brand.

## Shaders
TODO — Role of WebGL: atmosphere, storytelling, or data? What should never happen (e.g. "no generic gradient blobs").

## Fail conditions (reviewer rejects if any are true)
- Text over a shader fails contrast at any checkpoint
- Layout shift visible between progress checkpoints that isn't an intended animation
- Reduced tier still has scroll-scrubbed movement
- Static tier hides content that exists in full tier
- TODO — add yours
