---
name: FinControl
description: Personal financial control — cash flow, credit, and categories for one user
colors:
  ledger-black: "#111827"
  ink-hover: "#1f2937"
  base-bg: "#f9fafb"
  surface: "#ffffff"
  surface-2: "#f3f4f6"
  surface-3: "#e5e7eb"
  border: "#e5e7eb"
  border-subtle: "#f3f4f6"
  text-secondary: "#6b7280"
  text-muted: "#9ca3af"
  text-placeholder: "#d1d5db"
  income-green: "#10b981"
  income-green-bg: "#ecfdf5"
  expense-red: "#ef4444"
  expense-red-bg: "#fef2f2"
  warning-amber: "#f59e0b"
  warning-amber-bg: "#fffbeb"
  info-blue: "#3b82f6"
  info-blue-bg: "#eff6ff"
typography:
  display:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui"
    fontSize: "clamp(1.875rem, 3.5vw, 2.75rem)"
    fontWeight: 700
    lineHeight: 1.05
    letterSpacing: "-0.02em"
  headline:
    fontFamily: "Hanken Grotesk, ui-sans-serif, system-ui"
    fontSize: "1.25rem"
    fontWeight: 700
    lineHeight: 1.25
    letterSpacing: "-0.01em"
  title:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Inter, ui-sans-serif, system-ui"
    fontSize: "0.6875rem"
    fontWeight: 700
    lineHeight: 1
    letterSpacing: "0.1em"
  mono:
    fontFamily: "JetBrains Mono, ui-monospace, monospace"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.5
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
  xl: "24px"
  full: "9999px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  "2xl": "40px"
components:
  button-primary:
    backgroundColor: "{colors.ledger-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-primary-hover:
    backgroundColor: "{colors.ink-hover}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ledger-black}"
    rounded: "{rounded.md}"
    padding: "12px 24px"
  summary-card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.xl}"
    padding: "24px"
  nav-item-default:
    backgroundColor: "transparent"
    textColor: "{colors.text-secondary}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
  nav-item-active:
    backgroundColor: "{colors.ledger-black}"
    textColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: "10px 12px"
---

# Design System: FinControl

## 1. Overview: The Accountant's Ledger

**Creative North Star: "The Accountant's Ledger"**

FinControl's visual system is built on a single principle: the ledger. Not a banking app, not a SaaS dashboard — a well-kept record. Every element earns its place the way an entry earns its place in a ledger: by carrying information. Decoration without meaning is wasted ink.

The system is monochromatic by design. Ledger Black (`#111827`) is the sole accent color. Income and expense are marked in semantic green and red — not as brand choices, but as signals, the way a bookkeeper uses red ink for debits. Everything else is neutral. Color appears not because it was sprinkled for visual interest, but because it means something.

The experience should feel like opening a trusted report: clear headers, tight rows, number-forward typography. Both light and dark themes are first-class. In light mode, the surface is near-white with black ink — like paper. In dark mode, it's a deep navy-black with muted slate text — like a backlit terminal at night. Neither theme is an afterthought.

**Key Characteristics:**
- Numbers are the hero: financial amounts use JetBrains Mono with tabular-nums alignment, always
- Color is a signal, not a style — only income green, expense red, warning amber appear in color
- Light and dark themes are designed at equal fidelity; hardcoded hex values in components are forbidden
- Density is earned: compact by default, nothing padded for visual comfort alone
- The accent (`--accent`) inverts per theme: Ledger Black in light, near-white in dark

## 2. Colors: The Ledger Palette

A monochromatic foundation punctuated by semantic signals. The palette rejects decoration in favor of meaning. No brand color beyond Ledger Black; no color appears without earning it.

### Primary
- **Ledger Black** (`#111827`): The dominant accent. Nav active states, primary buttons, icon containers, the brand wordmark, active form borders. Its rarity makes it commanding — it only appears on things that matter.
- **Ink Hover** (`#1f2937`): The hover state for Ledger Black surfaces. A subtle step, not a dramatic shift.

### Neutral
- **Base Background** (`#f9fafb`): The page canvas. Near-white with a faint gray tint to keep it from reading as stark white.
- **Surface** (`#ffffff`): Card and panel backgrounds. One step lighter than base, establishing the primary layer hierarchy.
- **Surface 2** (`#f3f4f6`): Secondary containers, input backgrounds, category chip resting state, list-item hover tint.
- **Surface 3** (`#e5e7eb`): Tertiary level — active chips, pressed states, toggle container fill.
- **Border** (`#e5e7eb`): Standard dividers, card borders, input stroke.
- **Border Subtle** (`#f3f4f6`): Barely-there dividers between list items.
- **Secondary Text** (`#6b7280`): Labels, captions, metadata, sidebar nav default text.
- **Muted Text** (`#9ca3af`): Timestamps, disabled labels, supplementary copy.
- **Placeholder Text** (`#d1d5db`): Form placeholders, decimal parts in split-amount display.

### Semantic Signals
- **Income Green** (`#10b981`): Income amounts, positive trends, success states, the INGRESO toggle. Never decorative — always a financial signal.
- **Expense Red** (`#ef4444`): Expense amounts, negative values, error states, the GASTO toggle. Signal only.
- **Warning Amber** (`#f59e0b`): Budget overruns, caution flags, pending states.
- **Info Blue** (`#3b82f6`): Informational callouts, help copy, neutral alerts.

Each semantic color has a paired soft background (`--success-bg`, `--danger-bg`, etc.) used as icon container fill on KPI cards — always at reduced opacity, never as a surface fill.

**The Signal Rule.** Semantic colors (green, red, amber, blue) appear only when they encode financial or interaction meaning. Using Income Green as a decorative brand accent, a button tint, or a heading color is prohibited.

**The Monochrome Rule.** There is no brand color beyond Ledger Black. If you reach for a tint, a gradient, or any chromatic hue not listed as a semantic signal — stop. The palette has no room for it.

## 3. Typography: The Ledger Voice

**Display Font:** Hanken Grotesk (700–800 weight — bold headings, page titles, the wordmark)
**Body Font:** Inter (400–600 — all body text, labels, UI copy, metadata)
**Numeric Font:** JetBrains Mono (400–500 — every monetary amount, transaction counts, numeric data)

**Character:** Hanken Grotesk brings confident, slightly compressed geometry at large sizes — more distinctive than Inter at display scale, with a bookish seriousness that fits the North Star. Inter carries everything else with maximum legibility at small sizes. JetBrains Mono keeps amounts in lockstep column alignment regardless of digit count, making comparison effortless.

### Hierarchy
- **Display** (Hanken Grotesk, 700, `clamp(1.875rem, 3.5vw, 2.75rem)`, line-height 1.05, tracking −0.02em): Financial amounts on KPI cards. Tabular-nums. The number is the content — nothing else at this size.
- **Headline** (Hanken Grotesk, 700, `1.25rem`, line-height 1.25, tracking −0.01em): Section titles, modal headers, page-level view names.
- **Title** (Inter, 600, `0.875rem`, line-height 1.4): Card section headings, list group date headers, sidebar brand wordmark companion text.
- **Body** (Inter, 400, `0.875rem`, line-height 1.5): Transaction descriptions, metadata, form labels, modal body copy. Max line length: 60–70ch.
- **Label** (Inter, 700, `0.6875rem`, line-height 1, tracking 0.1em, UPPERCASE): KPI card metric identifiers only — e.g. "INGRESOS DEL MES". One per card maximum. Nowhere else.
- **Mono** (JetBrains Mono, 400–500, `0.875rem`, tabular-nums): All monetary amounts, everywhere. Transaction list, summary cards, modals, tooltips — no exceptions.

**The Mono Rule.** Every monetary amount uses JetBrains Mono with `font-variant-numeric: tabular-nums`. Proportional digits in financial data break column alignment and are a readability failure.

**The Label Ceiling Rule.** The uppercase tracked label pattern (`text-[11px] font-bold uppercase tracking-widest`) is permitted only on KPI card metric identifiers. It must not appear as section eyebrows on pages, modal headers, navigation group labels, or any other context. One per KPI card is the maximum.

## 4. Elevation

Flat by default. Surfaces are at rest — no ambient shadows, no decorative depth. A surface earns a shadow only when it lifts in response to state: hover interaction, floating overlay, or modal presentation.

Tonal layering handles within-page depth without shadows. The sidebar uses `--sidebar-bg`; main content uses `--bg-base`; cards and panels use `--bg-surface`. This three-layer stack is visible without any shadow at all.

### Shadow Vocabulary
- **Resting** (`0 1px 2px 0 rgb(0 0 0 / 0.05)`): Applied to KPI cards at their resting state. Barely present — just enough to lift the card off base without drawing attention.
- **Lifted** (`0 4px 6px -1px rgb(0 0 0 / 0.07), 0 2px 4px -2px rgb(0 0 0 / 0.07)`): Hover state for interactive cards. Paired with a `translateY(-2px)` transform for a physical lift sensation.
- **Floating** (`0 10px 15px -3px rgb(0 0 0 / 0.08), 0 4px 6px -4px rgb(0 0 0 / 0.05)`): Modals, bottom sheets, popovers, dropdowns. Signals that the element is above the page layer.

**The Flat-By-Default Rule.** Shadows are a state, not a style. `shadow-sm` (resting) separates cards from base. `shadow-md` (lifted) responds to hover. `shadow-lg` (floating) signals overlay. Never apply `shadow-lg` to a resting surface. Never apply shadows as decoration.

## 5. Components

### Buttons
- **Shape:** Gently rounded (12px — `rounded-xl`)
- **Primary:** Ledger Black background, white text, `12px 24px` padding, Inter 500. The save, confirm, and CTA action in every modal.
- **Hover:** Ink Hover (`#1f2937`), transition 150ms ease. No transform.
- **Focus:** `outline: 2px solid #111827` at 2px offset; keyboard-navigable.
- **Ghost:** Transparent background, Ledger Black text, `1px solid --border`. Used for cancel, back, and non-destructive secondary actions.
- **Destructive:** Expense Red (`#ef4444`) background, white text. Delete and remove actions only — never as a primary CTA on first open.

### KPI Cards (SummaryCard)
FinControl's signature surface — the primary way financial state is communicated at a glance.

- **Corner Style:** Fully rounded (24px — `rounded-3xl`)
- **Top Border:** 3px solid colored top border encodes tone. Income Green for INGRESO cards; Expense Red for GASTO cards. The only permitted decorative use of semantic color on a surface.
- **Background:** `--bg-surface` (white in light mode, `#1a1d27` in dark)
- **Shadow:** Resting at `--shadow-sm`; hover lifts to `--shadow-md` paired with `translateY(-2px)`
- **Icon Container:** 36×36 `rounded-xl`, filled with the soft semantic background (`--success-bg` / `--danger-bg`)
- **Amount:** Display-level Hanken Grotesk 700, `clamp(1.875rem, 3.5vw, 2.75rem)`. Decimal part in `--text-placeholder` at 0.55em — a split-numeral effect that makes the integer dominant
- **Metric Label:** Uppercase tracked Inter 700 at 11px, `--text-muted`. Above the amount.
- **Pill Row:** Optional. Icon + caption label left; formatted Mono amount right. Secondary metric (e.g. transfers received).

### Transaction List
- **Container:** `--bg-surface`, `rounded-2xl` (16px)
- **Row anatomy:** 40×40 `rounded-xl` emoji container (Surface 2 fill) · description in Title + category in Muted below · Mono amount right-aligned
- **Amount color:** Income = Income Green; Expense = Expense Red; Transfer = `--text-primary`
- **Dividers:** `--border-subtle` between rows; none after the last
- **Date Group Headers:** Title weight, date text in Muted. "Hoy", "Ayer", or full `weekday day month year` in Spanish.
- **Empty state:** Centered Body text in Muted: "No hay movimientos"

### Inputs and Fields
- **Style:** `1px solid --border` stroke, `--bg-surface` fill, `rounded-xl` (12px)
- **Focus:** Border shifts to `--accent` (Ledger Black in light, near-white in dark). No glow, no colored ring, no shadow.
- **Placeholder:** `--text-placeholder` — light gray, clearly distinguishable from entered text
- **Number inputs:** Spinner controls removed globally. Amounts use `font-mono tabular-nums`.
- **Disabled:** `--bg-surface-2` fill, `--text-muted` text, not-allowed cursor.

### Sidebar Navigation
- **Width:** 256px expanded, 80px icon-only collapsed. Collapse toggle: a 24×24 circle button at the right edge.
- **Background:** `--sidebar-bg` (slightly distinct from `--bg-base`, creating the shell boundary)
- **Active item:** Ledger Black fill (`--sidebar-item-active-bg`), white text, full-width `rounded-xl`. A clear high-contrast active signal.
- **Default item:** Transparent, `--sidebar-item-text` (muted gray). Hover: `--sidebar-item-hover` tint.
- **Brand mark:** 32×32 `rounded-xl` icon container in Ledger Black; "FinControl" in Inter 700 beside it.
- **User card:** Avatar (gradient circle with initials) · name + plan label · ThemeToggle button, pinned to the bottom.

### Month Picker Popover
A compact month/year selector surfaced from a pill button in the view header. The popover floats at `--shadow-lg`, `--bg-surface`, `rounded-2xl`. Month cells in `rounded-md`; active month in Ledger Black fill. Previous/next year via chevron buttons at the edges.

### Type Toggle (GASTO / INGRESO)
- **Container:** `--bg-surface-3` fill, `rounded-full`, padding 4px
- **Sliding knob:** Positioned absolutely, `rounded-full`, color-animated: Expense Red for GASTO, Income Green for INGRESO
- **Labels:** Inter 500 default, 700 when active and white. Arrow icon left of label text.
- **Transition:** Horizontal knob slide + color change, 200ms ease. No bounce, no elastic.

## 6. Do's and Don'ts

### Do:
- **Do** use JetBrains Mono with `font-variant-numeric: tabular-nums` for every monetary amount, on every screen, without exception.
- **Do** express income and expense exclusively in semantic green (`#10b981`) and red (`#ef4444`) — color serves as a ledger signal, not a decorative choice.
- **Do** treat Ledger Black as the sole brand accent: primary buttons, nav active states, the wordmark, active form borders — and nothing else.
- **Do** route every color through design tokens (`--bg-*`, `--text-*`, `--border`, `--accent`). Never hardcode hex values inside components. Both themes must work without modification.
- **Do** use `rounded-3xl` (24px) for KPI cards, `rounded-xl` (12px) for inputs, nav items, icon containers, and modal shells; `rounded-md` (8px) for chips and small cells. The radius scale carries information about hierarchy.
- **Do** apply `--shadow-sm` to resting cards, `--shadow-md` to hovered interactive cards, and `--shadow-lg` to floating overlays. Match shadow to state.
- **Do** suppress number input spinners globally — `input[type="number"]` always uses the textfield appearance.
- **Do** keep uppercase tracking labels (`text-[11px] font-bold uppercase tracking-widest`) exclusively for KPI card metric identifiers, never for section eyebrows or modal titles.

### Don't:
- **Don't** use consumer banking aesthetics: saturated gradient backgrounds, oversized rounded bubbles, color fills used as brand expression. This is a ledger, not Nequi, Nubank, or Daviplata.
- **Don't** use generic SaaS dashboard patterns: blue-everywhere chart cards, hero metric grids with large decorative icons, admin-template card layouts. If it looks like a Tailwind UI starter kit, rethink it.
- **Don't** use gradient text (`background-clip: text`) or decorative gradients anywhere. No gradients on surfaces, headings, or buttons.
- **Don't** use side-stripe borders (`border-left` or `border-right` > 1px in a brand color) on cards, list rows, or callouts. The only colored border in the system is the 3px top border on KPI cards, and only there.
- **Don't** use semantic signal colors (Income Green, Expense Red) for anything that isn't encoding income, expense, success, or danger. They are not available as brand tints, button colors, or heading accents.
- **Don't** apply `--shadow-lg` to resting surfaces. A card sitting on the page at rest does not float — it separates with `--shadow-sm` only.
- **Don't** use Hanken Grotesk for body text, metadata, or labels. It's a display font for headings and amounts. Body copy, labels, and metadata are Inter.
- **Don't** add uppercase-tracked eyebrows above page sections, modal titles, or navigation group labels. That pattern is reserved for KPI card metrics; anywhere else it reads as AI scaffolding.
- **Don't** use the gradient avatar (`bg-gradient-to-br from-indigo-400 to-purple-500`) pattern elsewhere in the app. It exists for the user avatar only and should not become a component pattern.
