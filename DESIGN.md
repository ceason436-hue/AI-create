---
name: Neo-Fluid AI
colors:
  surface: '#f9f9ff'
  surface-dim: '#d7dae4'
  surface-bright: '#f9f9ff'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#f1f3fe'
  surface-container: '#ebedf8'
  surface-container-high: '#e5e8f2'
  surface-container-highest: '#e0e2ec'
  on-surface: '#181c23'
  on-surface-variant: '#414754'
  inverse-surface: '#2d3038'
  inverse-on-surface: '#eef0fb'
  outline: '#717785'
  outline-variant: '#c0c6d6'
  surface-tint: '#005db7'
  primary: '#005bb3'
  on-primary: '#ffffff'
  primary-container: '#0073e0'
  on-primary-container: '#fefcff'
  inverse-primary: '#a9c7ff'
  secondary: '#536500'
  on-secondary: '#ffffff'
  secondary-container: '#c8ef00'
  on-secondary-container: '#576a00'
  tertiary: '#9a4100'
  on-tertiary: '#ffffff'
  tertiary-container: '#c15300'
  on-tertiary-container: '#fffbff'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#d6e3ff'
  primary-fixed-dim: '#a9c7ff'
  on-primary-fixed: '#001b3d'
  on-primary-fixed-variant: '#00468c'
  secondary-fixed: '#caf204'
  secondary-fixed-dim: '#b1d400'
  on-secondary-fixed: '#171e00'
  on-secondary-fixed-variant: '#3e4c00'
  tertiary-fixed: '#ffdbcb'
  tertiary-fixed-dim: '#ffb691'
  on-tertiary-fixed: '#341100'
  on-tertiary-fixed-variant: '#783100'
  background: '#f9f9ff'
  on-background: '#181c23'
  surface-variant: '#e0e2ec'
typography:
  display-xl:
    fontFamily: Space Grotesk
    fontSize: 80px
    fontWeight: '700'
    lineHeight: '1.0'
    letterSpacing: -0.04em
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 48px
    fontWeight: '700'
    lineHeight: '1.1'
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '600'
    lineHeight: '1.2'
  body-lg:
    fontFamily: Plus Jakarta Sans
    fontSize: 18px
    fontWeight: '500'
    lineHeight: '1.6'
  body-sm:
    fontFamily: Plus Jakarta Sans
    fontSize: 14px
    fontWeight: '400'
    lineHeight: '1.5'
  label-bold:
    fontFamily: Space Grotesk
    fontSize: 16px
    fontWeight: '700'
    lineHeight: '1.0'
rounded:
  sm: 0.25rem
  DEFAULT: 0.5rem
  md: 0.75rem
  lg: 1rem
  xl: 1.5rem
  full: 9999px
spacing:
  base: 8px
  section-gap: 120px
  container-padding: 32px
  gutter: 24px
  stroke-thick: 3px
  stroke-thin: 1.5px
---

## Brand & Style

This design system is built for the next generation of AI innovators. It bridges the gap between high-tech precision and youthful creativity through a **Bold High-Contrast** style infused with **Neo-Brutalist** and **Glassmorphic** elements. 

The aesthetic is intentionally loud and unapologetic, designed to evoke energy, speed, and disruptive thinking. It utilizes a "fluid-logic" approach where rigid digital structures are broken by irregular, organic shapes, signaling that AI is a tool for human imagination rather than just cold computation. The interface relies on massive visual weight, thick strokes, and vibrant color blocks to create a highly memorable, tactile experience.

## Colors

The palette is anchored by a high-vibrancy "Digital Blue" and "Neon Sulfur." The color strategy utilizes a **zonal contrast model**, where large sections of the UI alternate between primary blue and secondary green backgrounds. 

- **Primary & Secondary:** Used for massive color blocks and primary calls to action.
- **Accents:** Light Blue and Light Green are reserved for glassmorphism highlights, hover states, and internal card backgrounds to maintain legibility within saturated sections.
- **Contrast:** Black and White provide the structural "bones" of the system, ensuring that despite the loud colors, the content hierarchy remains accessible and sharp.

## Typography

This design system uses a dual-font strategy. **Space Grotesk** is used for all headlines and labels to reinforce the "tech-inspired" and geometric nature of the brand. Its quirky terminals complement the irregular shapes of the UI.

**Plus Jakarta Sans** handles the body copy. Its friendly, wide apertures ensure high readability even when placed over vibrant or semi-transparent glass backgrounds. Use tight leading for headlines to create a "brick" of text, and generous leading for body text to balance the visual density of the bold strokes.

## Layout & Spacing

The layout follows a **Rigid Fluid Grid**. While the underlying structure is a 12-column grid, elements frequently "break" the grid with irregular, protruding shapes and fluid blobs that overlap container edges.

- **Sectioning:** Alternating background colors define the narrative flow. Use 120px vertical padding between these major shifts.
- **Rhythm:** Spacing units are strictly multiples of 8px. Use large 32px internal padding for cards to allow the heavy 3px strokes and rounded corners room to breathe.
- **Negative Space:** Despite the bold colors, use "void" space (Black or White) to separate high-intensity blue and green sections.

## Elevation & Depth

Depth is not communicated through shadows, but through **Tonal Stacking** and **Glassmorphism**.

1.  **Level 0 (Base):** Flat, high-saturation color blocks (Blue #0082FC or Green #C9F100).
2.  **Level 1 (Containers):** White or Black surfaces with thick 3px borders. No shadows.
3.  **Level 2 (Interactivity):** Glassmorphic overlays with a `backdrop-filter: blur(20px)` and 40% opacity white/light-blue tints.
4.  **Level 3 (Fluid Accents):** Organic, irregular "blobs" that sit behind content but above the base background to create a sense of moving energy.

## Shapes

The shape language is the core differentiator of this design system. It mixes geometric precision with organic unpredictability.

- **Primary Containers:** Large 24px corner radii for a friendly, modern feel.
- **Fluid Elements:** Use `border-radius` with four distinct values (e.g., `100px 40px 80px 30px`) to create irregular, "squircle" shapes for background decorations and image masks.
- **Strokes:** Every interactive element must have a visible stroke (minimum 2px). This "contains" the vibrant colors and prevents visual bleed.

## Components

- **Buttons:** Thick 3px black borders. Primary buttons use #000000 background with #FFFFFF text. Hover state shifts the button 4px up and right with a "hard shadow" effect using the primary or secondary color.
- **Cards:** Use White or Black backgrounds with 24px corners. Within a Blue section, cards should feature a Light Blue glassmorphic header.
- **Input Fields:** Thick borders, no shadows. Focus state changes the border from Black to Neon Green.
- **Chips/Tags:** Pill-shaped (fully rounded) with #000000 background and high-contrast Neon Green text for maximum "active" energy.
- **Fluid Masks:** Images should never be simple rectangles; apply the irregular `fluid-organic` radii to all featured imagery.
- **Progress Indicators:** Use thick, chunky bars. The "unfilled" portion should be a low-opacity version of the "filled" portion (e.g., Neon Green on Light Green).