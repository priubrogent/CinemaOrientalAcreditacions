# Handoff: FesNits — Sistema d'Acreditacions (Redesign)

## Overview

Redesign of the **FesNits** accreditation management system for the Festival Nits de Cinema Oriental. The app manages three independent accreditation streams (Premsa, Professional, Nitòman) plus a Super Nitòman variant within Nitòman. For each stream, staff can:

- View incoming accreditation requests
- Assign codes from a pool
- Send confirmation emails to requesters
- Manage code pools, email templates, and per-type settings
- (Admin) manage users and their type-level permissions

The redesign focuses on **clarity of pipeline state**, **bulk actions**, **search & filtering**, and a **minimalist editorial visual language**.

---

## About the Design Files

The files in `design/` are **design references created in HTML** — a clickable prototype showing the intended look and behavior. They are **not production code to copy directly**.

The task is to **recreate these designs in the target Next.js + TypeScript + Tailwind codebase** (`CinemaOrientalAcreditacions` repo), using its established patterns (App Router, Drizzle ORM, NextAuth, Tailwind tokens, Server Actions). Treat the HTML as a spec — the source of truth for visual decisions, copy, and interaction model.

Bits that exist in the prototype but are **NOT** to be ported to production:
- The `Tweaks` panel and `useTweaks` hook (palette/density/dark/userScope) — only for exploring design variants.
- Mock data factory `makeRows()` — replace with real queries against the `accreditations` and `code_pool` tables.
- Hand-rolled checkbox/chip CSS — wherever the repo already has a shadcn/ui or similar primitive, use it.

---

## Fidelity

**High-fidelity (hifi).** Pixel-perfect mockups with final colors, typography, spacing, layout, and interaction behavior. The developer should reproduce the UI faithfully using the codebase's stack — Tailwind classes, real DB queries, real auth — but the visual outcome should match the prototype.

---

## Visual Language

A single sans typeface (**Geist**), minimalist, editorial-but-restrained. Warm cream paper background (`#f5f1e8`), high-contrast ink (`#171514`), and a single festival-red accent (`#c8201c`). Status uses a 4-hue oklch palette harmonized at the same chroma. Generous spacing, thin rules, no shadows, no gradients.

Each accreditation type carries a workspace tint (Premsa = blue, Professional = green, Nitòman = purple) that surfaces in the sidebar marker and hero eyebrow — subtle, not skin-deep.

---

## Design Tokens

### Colors

```css
/* Surfaces */
--paper:     #f5f1e8;
--paper-2:   #ede7d8;
--card:      #fbf8f1;

/* Ink scale */
--ink:       #171514;
--ink-90:    #2a2622;
--ink-70:    #4a4540;
--ink-50:    #8a8278;
--ink-30:    #b8b0a3;

/* Rules */
--rule:      #d9d0bd;
--rule-soft: #e7dfd0;

/* Festival red (primary accent) */
--accent:    #c8201c;
--accent-20: rgba(200, 32, 28, 0.18);
--accent-08: rgba(200, 32, 28, 0.08);

/* Workspace tints (per accreditation type) */
--premsa:        #2b3ea8;
--professional:  #1f6e4a;
--nitoman:       #6a4ca8;

/* Pipeline step hues (oklch, same chroma) */
--c-neutral: oklch(0.55 0.02 80);    /* total */
--c-warn:    oklch(0.62 0.16 65);    /* esperant codi — amber */
--c-info:    oklch(0.55 0.14 250);   /* per enviar — blue */
--c-ok:      oklch(0.55 0.14 155);   /* enviat — green */
/* + matching -bg variants at 8–10% alpha */
```

### Dark mode

```css
--paper:   #0f0d0c;
--paper-2: #181614;
--card:    #1a1816;
--ink:     #f0ece2;
--accent:  #ff5a52;
/* (full ramp inverted; see styles.css :42-55) */
```

### Typography

- **Font family**: `Geist` for everything (display + body), `Geist Mono` for codes, order IDs, and kbd hints.
- Load via `geist/font` package in Next.js.

| Role           | Size  | Weight | Tracking  |
|----------------|-------|--------|-----------|
| Hero title     | 38px  | 500    | -0.035em  |
| Section h3     | 18px  | 500    | -0.02em   |
| Stat / flow-n  | 30px  | 500    | -0.03em   |
| Body           | 14px  | 400    | normal    |
| Body small     | 13px  | 400    | normal    |
| Eyebrow / caps | 11px  | 500    | 0.16em uppercase |
| Mono (codes)   | 12-13px | 400  | 0.02em    |

### Radii

```
--r-sm: 4px
--r-md: 6px
--r-lg: 10px
```

### Spacing

8-px grid. Common values: 4, 8, 12, 14, 16, 20, 24, 32, 40, 48.

### Density modes (responsive control)

`comfy` (default) and `default` — affect padding and row-height. In production this could be a user preference or just drop the `comfy` variant.

---

## Information Architecture

```
/login                                  → Login screen
/                                       → Redirect to first available type
/[type]                                 → Dashboard (accreditations list)  [type ∈ premsa | professional | nitoman]
/[type]/codes                           → Code pool manager
/[type]/templates                       → Email template editor
/[type]/settings                        → Per-type config (auto-assign, auto-send, webhook)
/admin/users                            → User management (admin only)
/admin/activity                         → Global audit log (admin only)
```

**Access control:** A user has `role` (Admin | Operator) and `types: string[]` (subset of `['premsa','professional','nitoman']`). The sidebar shows only the types the user has access to. Admin sees an additional "Administració" section. If a user has only one type, the sidebar heading reads "El teu espai" (singular) instead of "Els teus espais".

---

## Screens

### 1. App Shell (`AppShell`)

**Layout:** 2-column grid. Left sidebar fixed `240px`. Right column: sticky topbar (`56px`) + scrollable main.

**Components:**

#### Sidebar
- **Brand block** (top): logo mark (SVG, custom — circular disk with crescent cutout and 3 dots, original mark, NOT a copyrighted festival logo) + "FesNits" wordmark in Geist 22px/600/-0.04em + sub-line "Acreditacions · 23a edició" 11px uppercase tracked.
- **Nav group "Els teus espais"** (or "El teu espai"): one button per accessible type. Each button: type marker dot (`8px` circle in workspace color), label, sub-label. Active state = ink fill, paper text. Below active type, indented child links: Acreditacions / Codis / Plantilles / Configuració.
- **Admin group** (if `user.role === 'Admin'`): Usuaris, Activitat global.
- **Footer block**: festival dates `14 — 19` in Geist 22px/-0.04em accent-red, "Juliol 2026 · Vic" caps below.

#### Topbar
- Left: breadcrumb `Festival Nits de Cinema Oriental / Sistema d'Acreditacions`.
- Right: search button with `⌘K` kbd, notifications bell with red dot badge, user chip (avatar circle with first initial in accent-red bg + name + role).

---

### 2. Dashboard (`/[type]`) — the main screen

The screen staff live in. Three stacked sections inside `main`:

#### A. Stats Hero
- **Eyebrow**: `[type-marker] Espai independent · {sub-label}`
- **Title**: type label (Premsa / Professional / Nitòman) in Geist 38px/500/-0.035em.
- **Lede**: one-line description with the type name emphasized (bold, not italic).
- **Variant switch** (Nitòman only): pill-style segmented control with 3 options — Tots / Nitòman / Super Nitòman — each showing live count. Active = ink fill, paper text.
- **Pipeline strip** (`flow-strip`): a horizontal card showing 4 steps with arrows between them, plus a separated "Codis lliures" panel on the right:

  | Step           | Tone        | Label             | Hint                                  |
  |----------------|-------------|-------------------|---------------------------------------|
  | total          | neutral     | Sol·licituds      | Rebudes en total                      |
  | pending        | warn (amber)| Esperant codi     | Encara sense codi assignat            |
  | code_assigned  | info (blue) | Per enviar        | Codi assignat, falta enviar email     |
  | email_sent     | ok (green)  | Email enviat      | Tot completat                         |

  Each step: tinted bg (8-10% alpha), left border 3px in the hue, big number in hue color, label uppercase, hint small ink-50. Arrows `→` between in ink-30.

- **Low-pool alert** (conditional): when `codesAvailable < pending + codeAssigned + 3`, show a red-tinted banner with warning bullet and "Afegir codis" link.

#### B. Toolbar
- **Default mode:**
  - Filter chips: `Totes / Pendents / Per enviar / Enviades`, each with count.
  - Search input (placeholder "Cerca per nom, email, codi o comanda…").
  - View toggle (List / Cards).
  - "Exportar CSV" ghost button.
  - "+ Nova acreditació" primary button.
- **Selection mode** (when ≥1 row selected): toolbar fills with ink-black bg. Shows "[N] seleccionades" + bulk actions: "Assignar codis" / "Assignar + Enviar" + kbd hint "Shift+E per enviar · Esc per sortir". Close `✕` resets.

#### C. List or Cards

**List view (default)** — table with columns:
- Checkbox
- Client (name 14px/500 + email 12px ink-50; if `variant === 'super'`, render a gold "SUPER" tag inline)
- Comanda / Mitjà (order_id mono + outlet italic 11px ink-50)
- Codi (mono pill in paper-2 bg, or `—` if null)
- Estat (status pill — see `StatusPill` below)
- Data (created date short; if sent, second line `→ {sent date}`)
- Accions: contextual button per status:
  - `pending` → "Assignar" (primary)
  - `code_assigned` → "Enviar" (primary)
  - `email_sent` → "Reenviar" (ghost)
  - Plus chevron toggle to expand detail.

Row hover = paper-2 bg. Row checked = accent-08 bg. Row expanded = paper-2 bg, no bottom border, followed by detail row.

**Cards view** — same data, grid of cards `repeat(auto-fill, minmax(280px, 1fr))`. Header (name + status pill), `<dl>` of meta fields, footer with primary action + Detalls.

#### D. Row Detail (expanded)

Two-column grid inside the row. Left = meta `<dl>` + activity timeline. Right = email preview (mock with from/to header, subject, body, code block in dashed border), and detail actions: "Enviar email" (if `code_assigned`), "Editar plantilla", "Copiar enllaç", "Eliminar acreditació" (danger ghost).

#### E. Footer hint

Small ink-50 strip with kbd shortcuts: `↑ ↓` navegar · `Space` seleccionar · `E` enviar · `⌘K` cerca.

---

### 3. Code Pool (`/[type]/codes`)

- Stats hero with `Total / Disponibles / Assignats`.
- "Afegir codis" card: heading, helper text, textarea (mono, paste codes one per line, dedupe on import), foot with count + "Importar al pool" button.
- "Codis disponibles" grid of mono code tiles, monospace, paper-2 bg.

---

### 4. Email Templates / Settings (placeholders in prototype)

Currently render a "Pròximament" placeholder. **Implementation scope**:
- Templates: subject + body editor with variable insertion (`{{customer_name}}`, `{{code}}`, etc.) and live preview using a sample row. Per-type templates.
- Settings: toggles for `auto_assign_on_order` and `auto_send_on_assign`; webhook secret; from-address; CC list.

---

### 5. User Management (admin) — not yet mocked

Out of scope for this handoff. Match the visual language of the rest of the app (paper background, ink type, Geist).

---

### 6. Login — not yet mocked

Out of scope for this handoff. Recommend a centered card on paper bg with the brand mark, single email + password, single primary button. Match the visual language.

---

## State Management

Per-type list page state (largely URL-synced via `searchParams`):
- `filter`: 'all' | 'pending' | 'code_assigned' | 'email_sent'
- `q`: search term
- `variant` (Nitòman only): 'all' | 'nitoman' | 'super'
- `viewMode`: 'list' | 'cards' (could be a localStorage preference)
- `selected`: Set<id> (client-only)
- `expanded`: id | null (client-only)

Server data:
- `rows: Accreditation[]` (fetched server-side)
- `codesAvailable: number` (count from `code_pool` where `used = false`)

---

## Interactions & Behavior

- **Assign code** (single or bulk): pull oldest unused code from pool for that type, write to accreditation row, set `status: 'code_assigned'`, decrement pool count. Use a DB transaction with `FOR UPDATE` lock to prevent double-assignment.
- **Send email** (single or bulk): render template with row data, send via configured SMTP/Resend, set `status: 'email_sent'`, `email_sent_at: now()`. Bulk "Assignar + Enviar" chains both for any pending rows in one action.
- **Variant filter** (Nitòman): filters client-side off the same query, or pass as URL param.
- **Search**: substring match on `customer_name`, `customer_email`, `code`, `order_id`. Debounce 150ms.
- **Keyboard**: `⌘K` opens global search modal (not in prototype, but place hook). `Esc` clears selection. `Shift+E` triggers bulk send when selection is non-empty.
- **Low pool alert**: render whenever `codesAvailable < pending + codeAssigned + 3`. Link opens the Codes page for that type.
- **Sidebar workspace tint**: applied via `data-current-type` attribute on `.app-shell`; CSS handles the rest via `--workspace` custom property.

### Transitions

All UI transitions use `80ms` ease for color/bg changes. No layout animations. No page transitions beyond default.

---

## Data Model Reference

For implementation, the existing schema should support:

```ts
accreditations:
  id, type ('premsa'|'professional'|'nitoman'), variant ('nitoman'|'super'|null),
  customer_name, customer_email, outlet, order_id,
  code (nullable, FK to code_pool.code),
  status ('pending'|'code_assigned'|'email_sent'),
  created_at, email_sent_at (nullable)

code_pool:
  id, type, code (unique), used (bool), assigned_to (FK accreditations.id, nullable), created_at

users:
  id, email, name, role ('Admin'|'Operator'), types (string[]), created_at

email_templates:
  id, type, subject, body_md, updated_at

type_settings:
  type (PK), auto_assign (bool), auto_send (bool), from_address, cc_list (string[])

activity_log:
  id, accreditation_id, actor_user_id, action, payload (jsonb), created_at
```

If the existing repo's schema differs, prefer extending it over replacing — particularly the `variant` column on `accreditations` (needed for Super Nitòman) which may not yet exist.

---

## Assets

- **Brand mark**: inline SVG in `Sidebar`, a crescent-disk + 3 dots motif. **Original artwork** created for this prototype — replace with the official FesNits logo if/when available.
- **Icons**: hand-rolled inline SVGs (search, bell, chevron, list/grid). Replace with `lucide-react` if the codebase already includes it (Search, Bell, ChevronDown, List, LayoutGrid).
- **Fonts**: Geist + Geist Mono. Use the `geist` npm package in Next.js.
- No raster images required.

---

## Files in this handoff

```
design_handoff_acreditacions/
├── README.md                          ← this file
└── design/
    ├── Acreditacions.html             ← entry point — open this in a browser
    ├── components.jsx                  ← all React components (Sidebar, Topbar, Dashboard, etc.)
    ├── styles.css                      ← tokens + every visual rule
    └── tweaks-panel.jsx                ← the Tweaks helper (NOT to be ported)
```

**Recommended reading order** for the implementer:
1. `styles.css` lines 1–55 — design tokens.
2. `components.jsx` `TYPES`, `STATUS`, `Sidebar`, `Topbar` — chrome.
3. `components.jsx` `StatsHero` → `Toolbar` → `AccRow` → `RowDetail` — the dashboard.
4. `components.jsx` `Dashboard` — composition, state, actions.
5. Ignore `useTweaks` and the tweaks-panel code entirely.

---

## Implementation Order (recommended)

1. **Tokens** in `tailwind.config.ts` + `globals.css` (Geist font, color palette).
2. **AppShell + Sidebar + Topbar** in `app/(app)/layout.tsx`.
3. **Static `/[type]` page** rendering `StatsHero` + `Toolbar` + `AccTable` with hardcoded data.
4. **Wire up real data** via Server Components reading from Drizzle.
5. **Server Actions** for `assignCode`, `sendEmail`, `bulkAssign`, `bulkSend`, `deleteAccreditation`.
6. **Search & filter URL params**.
7. **Row detail expansion** + email preview.
8. **Nitòman variant** (add `variant` column migration + filter).
9. **Code pool page**.
10. **Templates & settings pages** (still placeholder — confirm scope before building).
11. **Admin pages**.
12. **Login screen**.

Good luck.
