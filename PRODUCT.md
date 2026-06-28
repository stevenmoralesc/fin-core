# Product

## Register

product

## Users

A single user (Steven) managing personal finances in a Latin American context: cash flow, credit card limits, recurring expenses, and budget tracking. Uses the app daily or weekly to log transactions and review spending — the context is "settling the books," not casual browsing.

## Product Purpose

FinControl replaces the mental overhead of tracking liquidity, credit card capacity, and category spending across multiple accounts. Success looks like: the user can open the app, see exactly where they stand financially for the month, and log a transaction in under 10 seconds.

## Brand Personality

Precise · calm · trustworthy. The feel closest to Linear or Notion: everything earns its place, density is deliberate, and nothing screams for attention. The app should feel like a skilled accountant's report — not a bank's marketing site.

## Anti-references

- **Consumer banking apps** (Nequi, Nubank, Daviplata): saturated color gradients, big rounded bubbles, oversimplified UI that feels made for someone who has never seen a bank statement before.
- **Generic SaaS dashboards**: blue-everywhere chart card grids, hero metric templates, the admin-template aesthetic. If it looks like it came from a Tailwind UI starter, it's wrong.

## Design Principles

1. **Information before decoration.** Every visual decision must serve comprehension. Numbers, trends, and states need to be instantly readable — not buried under hover effects or visual chrome.
2. **Earned density.** The user opened the app to see data, not to be guided toward it. Compact layouts, tight vertical rhythm, and visible secondary data are features.
3. **Calm authority.** The interface should feel composed and steady — never alarming, never flashy. Color is a signal, not decoration; use it only when it carries meaning (income green, expense red, pending amber).
4. **Theme fidelity.** Light and dark modes are first-class citizens. No hardcoded hex values in components; every surface goes through design tokens.
5. **Spanish-native.** Labels, copy, and financial conventions are designed for the Latin American context, not translated from English.

## Accessibility & Inclusion

Target WCAG AA. Priority: text contrast (body ≥ 4.5:1, large text ≥ 3:1), keyboard navigability of all modals and dropdowns, reduced-motion respect for any transitions added. Single-user app, no known assistive-technology requirements beyond baseline.
