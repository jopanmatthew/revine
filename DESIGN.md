---
name: revine.
description: Invoice financing for Indonesian SMEs. Turn invoices into opportunities.
colors:
  brand-900: "#0b1f1a"
  brand-700: "#16634b"
  mint: "#35cb9b"
  bg: "#f8faf6"
  card: "#ffffff"
  ink: "#1f2a26"
  ink-muted: "#6b6f6c"
  muted-surface: "oklch(0.97 0 0)"
  hairline: "oklch(0.922 0 0)"
  danger: "oklch(57.7% 0.245 27.325)"
  warning: "oklch(96.2% 0.059 95.617)"
  warning-foreground: "oklch(47.3% 0.137 46.201)"
typography:
  display:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.6rem"
    fontWeight: 700
    lineHeight: 1.04
    letterSpacing: "-0.03em"
  headline:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.75rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
  amount:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.4
    letterSpacing: "-0.025em"
    fontFeature: "\"tnum\""
  body:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 500
    lineHeight: 1.43
  term:
    fontFamily: "Satoshi, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1.45
rounded:
  md: "8px"
  lg: "10px"
  xl: "14px"
  2xl: "18px"
  full: "9999px"
spacing:
  gutter: "16px"
  row-x-desktop: "20px"
  card-pad: "16px"
  card-pad-desktop: "20px"
  stack: "24px"
  stack-desktop: "32px"
  target: "44px"
components:
  button-primary:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.card}"
    typography: "{typography.label}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-primary-hover:
    backgroundColor: "{colors.brand-900}"
  button-outline:
    backgroundColor: "{colors.bg}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "0 16px"
  button-outline-hover:
    backgroundColor: "{colors.muted-surface}"
  button-hero:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.brand-900}"
    rounded: "{rounded.lg}"
    height: "48px"
    padding: "0 24px"
  button-hero-hover:
    backgroundColor: "{colors.card}"
  input:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    typography: "{typography.body}"
    rounded: "{rounded.lg}"
    height: "44px"
    padding: "4px 10px"
  card:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "{spacing.card-pad}"
  segmented-control:
    backgroundColor: "{colors.muted-surface}"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.lg}"
    padding: "4px"
  segmented-control-active:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
  badge-created:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  badge-verified:
    backgroundColor: "transparent"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  badge-rejected:
    backgroundColor: "{colors.danger}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  badge-listed:
    backgroundColor: "{colors.mint}"
    textColor: "{colors.brand-900}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  badge-financed:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  badge-paid:
    backgroundColor: "{colors.brand-900}"
    textColor: "{colors.card}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  tag-warning:
    backgroundColor: "{colors.warning}"
    textColor: "{colors.warning-foreground}"
    rounded: "{rounded.full}"
    height: "20px"
    padding: "2px 8px"
  paid-toast:
    backgroundColor: "{colors.brand-900}"
    textColor: "{colors.card}"
    rounded: "{rounded.2xl}"
    padding: "16px 20px"
    width: "min(24rem, calc(100vw - 2rem))"
  action-sheet:
    backgroundColor: "{colors.card}"
    textColor: "{colors.ink}"
    rounded: "{rounded.2xl}"
    padding: "20px"
---

# Design System: revine.

Brand values, logo rules, badge styles and copy are owned by the designer's brand board as recorded in PRD.md §10.1 and §10.2. This file records how the shipped build in `apps/web` applies them. Where the two disagree, PRD.md wins and this file gets corrected.

## Overview

**Creative North Star: "Money Across Time"**

Every invoice is drawn as a short story about money: what you pay or receive today, what arrives on a date, and the gap between them. The visual system exists to make those two amounts and that gap the loudest thing on any surface. Everything else (who, which invoice, status, chain details) is quieter and sits around it.

The world is calm, premium fintech in two greens. App screens are a pale green-white ground with white cards edged by a hairline ring, set in Satoshi at three weights, with amounts in bold tabular figures. The landing hero, the footer and a few moments of weight (the Paid badge, the paid toast, the credit credential) sit on the deep brand green. Mint is the accent, and it only ever appears as a fill or on dark. Density is deliberately low: the product is demoed live in three windows side by side, so amounts are large and rows are roomy.

The build is phone-first. Primary actions sit under the thumb, sheets rise from the bottom, every target is 44px on phones, and desktop is the same column given more room rather than a different layout.

**Key Characteristics:**
- The money bridge (pay amount, term line, receive amount) is the one signature and recurs wherever money moves.
- White cards on #F8FAF6 with a 1px ink-at-10% ring; shadows only for things that float.
- Satoshi 400 / 500 / 700 only; amounts always bold and tabular.
- Two greens with clear jobs: brand-700 acts, brand-900 weighs; mint is fill only.
- Status is always text plus colour, using the PRD §10.1 badge set.
- One quiet motion vocabulary on a single strong ease-out curve.

## Colors

A restrained two-green palette on a near-white green-tinted ground, with mint held back as an accent fill and amber reserved for time running out.

### Primary
- **Ledger Green** (brand-700): the acting colour. Primary buttons with white text, links and green text, focus rings, the caret, native control accent, the money bridge's term line and dots, done states in the transaction stepper, the Financed badge, the Verified outline.
- **Deep Forest** (brand-900): the colour of weight. Landing hero and footer, primary button hover, the Paid badge, the paid toast, the credit credential card, the "never on-chain" panel, selection text, and the tint of every shadow.

### Secondary
- **Fresh Mint** (mint, still to be confirmed by the designer, PRD §21): the logo dot, the Listed badge fill, the landing's Launch app button and hero planes, icons and small headings on brand-900, the selection wash, and the row-settle highlight.

### Neutral
- **Morning Paper** (bg): the app background and the sticky header and bottom bar (at 90% with blur).
- **Card White** (card): cards, list cards, sheets, popovers, inputs on forms.
- **Forest Ink** (ink): body text, headings and amounts. Also the Buyer role chip fill on the landing.
- **Slate Moss** (ink-muted): secondary text, field labels in the bridge and stat strip, the Created badge outline. Also the source of the scrollbar thumb (45% mix).
- **Quiet Fill** (muted-surface): the segmented control and role switcher track, outline-button hover, neutral notes such as a cancelled wallet request.
- **Hairline** (hairline): shadcn borders and input strokes. Cards themselves use a ring of ink at 10%, and dividers inside cards use ink at 7%.

### Status
- **Signal Red** (danger): the Rejected badge fill, error notes (red text on a 10% red wash), failed stepper steps. Tailwind red-600 until the designer supplies one.
- **Amber Wash / Amber Ink** (warning / warning-foreground): the Overdue and Listing expired tags, slow-network and low-gas notes, and the overdue money bridge (amber dashed line). Tailwind amber-100 and amber-800 until the designer supplies them.

### Named Rules
**The Mint Is Fill Rule.** Mint never sets text on a light background (about 2:1). It is a fill (Listed badge, hero CTA, planes, highlights) or it is text and icons on brand-900. Green text on light is brand-700.

**The Two Greens Rule.** brand-700 is for things you can act on or read as green; brand-900 is for weight and arrival (hover, Paid, the paid toast, dark panels). Do not swap them.

## Typography

**Display Font:** Satoshi (self-hosted via next/font/local, with ui-sans-serif, system-ui fallback)
**Body Font:** Satoshi
**Label/Mono Font:** Satoshi for labels; the system monospace stack only for wallet-address input

**Character:** One geometric grotesk at three weights. Bold carries headings and money, medium carries labels and buttons, regular carries everything you read. Tight negative tracking on everything bold.

### Hierarchy
- **Display** (700, 2.6rem on phones, 3.75rem from 640px, 4.5rem from 1280px; line-height 1.04; -0.03em): the landing H1 only.
- **Headline** (700, 1.75rem on phones to 2.25rem from 640px; tight leading and tracking): the app's page heading (greeting) and, at 1.875rem to 2.25rem, landing section titles.
- **Title** (700, 1.125 to 1.25rem): sheet titles, card and step headings.
- **Amount** (700, tabular figures, tight tracking): 1rem to 1.5rem depending on surface; 1.75rem in the paid toast. Amounts of Rp1 miliar and up step down one size so both sides of a bridge still fit.
- **Body** (400, 1rem, about 1.5): paragraphs, summaries (ink-muted, max about 42rem), list content. Landing ledes go to 1.125rem.
- **Label** (500, 0.75 to 0.875rem): buttons, field and stat labels, row titles, badges (0.75rem).
- **Term** (500, 0.6875rem, brand-700 or amber): the "in 30 days" label on the money bridge line.

Sentence case throughout. No uppercase, no letter-spaced labels.

### Named Rules
**The Tabular Money Rule.** Every Rupiah amount renders through the amount component with tabular figures and no wrapping; amounts in rows and tables are right-aligned.

**The Three Weights Rule.** 400, 500 and 700 are the only weights shipped. Light and Semibold stay off until the designer uses them (PRD §10.1).

## Layout

One centred column, max 72rem (max-w-6xl), with a 16px gutter at every width. App screens stack heading, tabs and list with 24px gaps on phones and 32px from 640px; the page keeps 96px of bottom room on phones so the sticky action never covers the last row.

Breakpoints: 640px is the main seam (sheets switch from bottom to side, the sticky action becomes inline, stat strips become columns, touch targets relax); 768px brings the role switcher into the header and drops inputs to 14px; 1024px opens the landing's two-column hero; 1280px is the display size step. The money bridge uses container queries instead, stacking vertically below about 19.5rem of its own width (20 to 30rem for large or miliar-scale amounts).

Rows inside list cards pad 16px all round, 20px horizontally from 640px. On phones a row's action drops beneath it and right-aligns.

**The Thumb Rule.** On phones every target is at least 44px tall (buttons, inputs, segmented options at 40px inside a 4px track), the screen's primary action is a sticky bottom bar with safe-area padding, and sheets rise from the bottom. From 640px controls tighten to 36 to 40px.

**The Ledger Rule.** Totals are one hairline-divided strip, never a row of separate tiles. On phones the strip reads as a ledger: label left, amount right.

**The Edge-to-Edge Device Rule.** The viewport covers the notch (viewport-fit cover, theme colour brand-900), and every bottom-anchored surface adds `env(safe-area-inset-bottom)` to its padding.

## Elevation & Depth

Flat by default. Cards rest on a 1px ring of ink at 10% with no shadow; layering is tonal (white on Morning Paper, Quiet Fill tracks, a 90% blurred header and bottom bar). Shadows are kept for surfaces that genuinely float, and every one is tinted with brand-900 and pulled in with negative spread so it reads as a soft drop under the object rather than a grey halo.

### Shadow Vocabulary
- **Seat** (`0 1px 2px rgb(11 31 26 / 0.08)`): the active segment in a segmented control.
- **Thumb** (`0 1px 3px rgb(11 31 26 / 0.2)`): the slider handle.
- **Lift on hover** (`0 8px 28px -14px rgb(11 31 26 / 0.28)`): marketplace cards on hover (200ms).
- **Float** (`0 18px 40px -20px rgb(11 31 26 / 0.45)`): standard toasts.
- **Hero card** (`0 30px 60px -30px rgb(11 31 26 / 0.45)`): the landing example card over the hero.
- **Dark slab** (`0 18px 40px -24px rgb(11 31 26 / 0.7)` and `0 24px 48px -20px rgb(11 31 26 / 0.75)`): the credit credential and the paid toast, both on brand-900.

### Named Rules
**The Ring Not Shadow Rule.** A card at rest gets the hairline ring, never a shadow. A shadow means the thing floats, moves or is being hovered.

## Shapes

Soft, consistent rounding derived from one 10px base radius. Controls (buttons, inputs, segmented tracks, error notes) use 10px; segments and small icon buttons 8px; cards, list cards and stat strips 14px; landing panels, role-picker cards, dark slabs, the paid toast and the bottom sheet's top edge 18px. Badges, role chips, dots and the sheet grabber are full pills. The only angled geometry is the hero planes: the mark's parallelograms, skewed -36deg with 36px corners, in a brand-700 to mint gradient, landing hero only.

## Components

### Buttons
Confident and quiet: solid green, medium weight, a small press.
- **Shape:** gently rounded (10px).
- **Primary:** brand-700 fill, white 500 text; 44px tall on phones (h-11), 36px from 640px; large screen actions stay 44px.
- **Hover / Focus / Press:** hover deepens to brand-900; focus shows a 3px ring of brand-700 at 50%; press scales to 0.97 over 150ms on the ease-out curve (not on menu triggers).
- **Outline:** bg fill with hairline border, Quiet Fill on hover. **Ghost:** used for row links, in brand-700 text.
- **Destructive:** red text on a 10% red wash, never a solid red button.
- **Landing only:** Launch app is a 48px mint button with brand-900 text that turns white on hover; How it works is a white-outline ghost on the dark hero.

### Status Badges
Text plus colour, always (PRD §10.1). 20px pills, 12px 500 text. Created and Verified are outlines (ink-muted, brand-700); Rejected, Listed, Financed and Paid are fills (danger, mint, brand-700, brand-900). Overdue and Listing expired are extra amber tags that sit next to the status, never replace it. Labels change by role, colours do not.

### Cards / Containers
- **Corner Style:** 14px (18px for landing panels and role-picker cards).
- **Background:** white on Morning Paper.
- **Shadow Strategy:** none at rest; see Elevation.
- **Border:** 1px ring of ink at 10%; internal dividers ink at 7%.
- **Internal Padding:** 16px, 20px from 640px.
- **List card:** one white card holding hairline-divided invoice rows: who and which on the left (500 title, 12px muted meta), the amount bold and right-aligned, the action under it on phones and in a third column from 640px.

### Inputs / Fields
- **Style:** 10px radius, hairline stroke, white on forms, 44px on phones and 40px from 640px.
- **Text:** 16px on phones (prevents iOS zoom), 14px from 768px. Wallet addresses in monospace.
- **Focus:** border turns brand-700 with a 3px brand-700 ring at 50%; caret is brand-700.
- **Error:** danger border and 3px ring at 20%, message below.

### Navigation
A sticky 56px header (logo, role switcher, balance pill, connect) over a blurred 90% bg with a hairline bottom border, under the always-visible testnet strip. The role switcher is a segmented control: Quiet Fill track, 4px inset, active segment white with ink text and a seat shadow, inactive ink-muted. On phones it moves to its own full-width row under the header with 40px segments.

### Money Bridge (signature)
Pay amount on the left, receive amount on the right, joined by a brand-700 line (35% opacity) that starts at a dot and ends in a chevron, with the term ("in 30 days") centred above it in the term style. Muted labels above, muted notes below. Overdue turns the line into an amber dashed rule with amber term text. When its container is too narrow, it stacks vertically: pay on top, the line running down, receive below. On the landing example only, the line draws once from left to right (900ms after a 400ms delay) and the chevron fades in after it. Screen readers get one plain sentence instead of the grid.

### Action Sheet and Transaction Stepper
Every flow uses one sheet: a bottom sheet on phones (18px top corners, grabber, max 92% of the viewport) and a right-hand panel up to 28rem from 640px. The footer holds the primary action, stays pinned while the body scrolls, and carries safe-area padding. The stepper lives in this sheet: one row per step with a 20px status icon (muted circle waiting, brand-700 spinner active, brand-700 check done, red cross failed, muted for a cancelled wallet request, a dash for "Not needed"), an Etherscan link once a hash exists, and the final "Done" row in 700 brand-900 that pops in once. It cannot be dismissed while running and never closes itself on error.

### Paid Toast
The one celebration. A brand-900 slab (18px radius, dark-slab shadow, a faint white ring) with "You got paid" in 500 white at 80% and the amount at 1.75rem bold white, a detail line, and a small dismiss button. Headless Sonner keeps stacking and swipe-to-dismiss. Ordinary toasts are white with a 14px radius, the float shadow and a 700 title.

### Motion
One curve, `cubic-bezier(0.23, 1, 0.32, 1)`, at 150 to 300ms for UI. The moments: button press scale; a 1.6s mint wash on any row whose status just changed (`data-fresh`, a colour change only); the landing line draw and the hero planes' 700ms fade-and-slide; the stepper's final check and the create-invoice success mark, which zoom in on entry. Spatial movement is gated by reduced-motion (motion-safe, or zoom falling back to a fade). No scroll-driven or looping motion apart from spinners.

### Browser Surfaces
Native chrome carries the palette: text selection is mint mixed 40% into white with brand-900 text; the caret and native control accents are brand-700; the scrollbar is ink-muted at 45% on a transparent track; the iOS tap highlight is off and taps skip the double-tap delay.

## Do's and Don'ts

### Do:
- **Do** lead every money surface with the money bridge or a bold tabular amount; the amounts and the gap between them come first.
- **Do** put white cards with a 1px ink-at-10% ring on the #F8FAF6 ground; keep 14px card corners and 10px control corners.
- **Do** use brand-700 for green text and actions, and brand-900 for hover, Paid and dark slabs.
- **Do** keep mint as a fill or as text and icons on brand-900.
- **Do** make phone targets 44px, put the primary action in the sticky bottom bar, and add `env(safe-area-inset-bottom)` to anything bottom-anchored.
- **Do** open every flow in the shared action sheet and run every on-chain action through the transaction stepper.
- **Do** tint shadows with brand-900 and reserve them for things that float or are hovered.
- **Do** use the single ease-out curve and gate any spatial motion behind reduced-motion.
- **Do** use Lucide icons at one stroke weight, 14 to 20px.

### Don't:
- **Don't** set mint text on a light background.
- **Don't** split totals into a row of separate stat tiles; use the hairline strip.
- **Don't** show status by colour alone or invent badge colours outside PRD §10.1.
- **Don't** add weights other than 400, 500 and 700, uppercase labels or letter-spaced labels.
- **Don't** redraw the logo or mark in CSS or code (PRD §10.1); use the designer's SVGs when they land.
- **Don't** use the slanted parallelogram planes anywhere but the landing hero, and add no other illustrations (PRD §10.1).
- **Don't** add a dark theme; dark brand-900 slabs inside the light theme are part of the world (PRD §6.2).
- **Don't** put a shadow on a resting card, or use grey or hard offset shadows.

## Open Decisions

- **Landing hero line above the H1.** The hero ships the dark logo plus the tagline "Turn invoices into opportunities." on one line above the H1, because PRD §9.2 pins an eyebrow there. The impeccable craft floor bans kickers and eyebrows. Awaiting the owner's call. Until then it is a one-off on the landing, not a pattern: no other surface gets a line above its heading.
- **Logo and favicon.** The logo SVGs, mark and favicon (PRD §10.1) are still pending from the designer. The current logo is a text stand-in (Satoshi 700, mint dot) to be swapped for the SVGs; it is not the logo and should not be copied as a lockup.
- **Mint, danger and warning values.** Mint is awaiting designer confirmation (PRD §21); danger and warning are Tailwind stand-ins until the designer adds them.
