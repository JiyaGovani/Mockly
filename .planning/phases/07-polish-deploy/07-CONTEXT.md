# Phase 7: Polish & Deploy — Context

## Phase Summary
Finishing UX polishes for Mockly: light theme overhaul (primary scope of this session), loading states, error boundaries, mobile responsiveness, rate limiting, and documentation.

## Scope (this discussion session)
Theme change — transitioning from dark indigo/violet glassmorphism to a warm cream + cocoa brown light theme.

---

<decisions>

### Theme Direction
**Warm Cream Light Theme** — off-white/warm backgrounds reminiscent of Figma or Vercel dashboard. Approachable, professional, premium.

### Background
**Subtle paper texture feel** — soft warm gradient, like a premium notebook:
- Base: `#fafaf9` (warm off-white)
- Mid tint: `#f5ede3` (warm cream)
- Gradient: `135deg, #fafaf9 0%, #f5ede3 50%, #fafaf9 100%`
- Replace the dark `#0f172a → #1e1b4b` body gradient entirely.

### Primary Accent Color
**Cocoa Brown** — deep chocolate-brown, bold and premium:
- Primary: `#78350f` (Amber 900)
- Primary dark: `#92400e` (Amber 800)
- Replaces indigo `#6366f1` / violet `#8b5cf6` as the main brand color.

### Cards & Panels
**Frosted light panels** — white/translucent with soft drop shadow (light glassmorphism):
- Background: `rgba(255, 255, 255, 0.75)`
- Backdrop blur: kept at 20px
- Border: `rgba(120, 53, 15, 0.1)` (subtle warm cocoa tint)
- Shadow: `0 4px 24px rgba(120, 53, 15, 0.08), inset 0 1px 0 rgba(255,255,255,0.9)`
- Replaces dark `rgba(255,255,255,0.08)` glass surfaces.

### Text Colors
- Primary text: `#1c1917` (Stone 900 — near-black with warmth)
- Muted text: `#78716c` (Stone 500)
- Replaces `#f1f5f9` (near-white) and `#94a3b8` (slate muted).

### Orb / Background Accents
- Warm amber/cream orbs replace indigo/violet orbs on auth pages
- Colors: `#fde68a` (Amber 200), `#fcd34d` (Amber 300), `#fdba74` (Orange 300)
- Keep the float animation, just change hue.

### Elements NOT changing
- Inter font family
- Micro-animations (float, fadeSlideIn, shake, spin)
- Page transitions (.page-enter)
- Button shape (rounded-xl, padding)
- Card border-radius (1.25rem)
- Layout structure

### Scope of Files to Update
1. `client/src/index.css` — CSS custom properties and body background
2. `client/src/components/Navbar.jsx` — text/border color classes
3. `client/src/components/AdminLayout.jsx` — sidebar bg + nav link classes
4. `client/src/pages/Login.jsx` — orb colors, text gradient, label classes
5. `client/src/pages/Register.jsx` — same as Login
6. Remaining pages (Questions, Dashboard, Practice, PlacementHub, AptitudeWorkspace, MockInterview, MockScorecard, admin pages) — `bg-slate-950`, `bg-slate-900`, `text-slate-*` dark classes → light equivalents

</decisions>

<canonical_refs>
- client/src/index.css
- client/tailwind.config.cjs
- client/src/components/Navbar.jsx
- client/src/components/AdminLayout.jsx
</canonical_refs>

<deferred>
- Loading skeletons for AI/DB fetches (Phase 7 plan 07-01, separate from theme)
- API rate limiting (Phase 7 plan 07-01, backend work)
- README documentation (Phase 7 plan 07-02)
</deferred>
