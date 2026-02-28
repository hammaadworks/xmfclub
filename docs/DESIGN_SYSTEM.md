# Design System & Brand Guidelines: xmfclub

This document defines the visual language, branding standards, and UI/UX patterns for the **xmfclub** platform. It ensures consistency across the frontend components and brand materials.

---

## 1. Brand Identity & Vibe
- **Name:** xmfclub
- **Domain:** xmfclub.com
- **Vibe:** High-energy, intense, professional, futuristic, kinetic.
- **Philosophy:** Modular training ("A la Carte") meets traditional martial arts discipline.
- **Mood:** Kinetic, Motion, Wide, Tech-forward.

---

## 2. Global Design Rules

### 2.1 Color Palette (Energy Orange & Success Green)

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| **Primary** | `#F97316` | `--color-primary` | Main brand color, active states. |
| **Secondary** | `#FB923C` | `--color-secondary` | Borders, subtle highlights. |
| **CTA/Accent** | `#22C55E` | `--color-cta` | "Success Green" for conversion buttons. |
| **Background**| `#1F2937` | `--color-background`| Main dark mode canvas. |
| **Text** | `#F8FAFC` | `--color-text` | High-contrast white/gray for readability. |

---

### 2.2 Typography

- **Headings (Kinetic Feel):** `Syncopate`
- **Body (Tech Feel):** `Space Mono`
- **Google Fonts Import:**
```css
@import url('https://fonts.googleapis.com/css2?family=Space+Mono:wght@400;700&family=Syncopate:wght@400;700&display=swap');
```

---

### 2.3 Spacing & Shadows

| Token | Value | Usage |
|-------|-------|-------|
| `--space-md` | `1rem` | Standard padding/gap. |
| `--space-2xl`| `3rem` | Section margins. |
| `--shadow-lg`| `0 10px 15px rgba(0,0,0,0.1)` | Modals, high-lift cards. |

---

## 3. UI Patterns & Components

### 3.1 The Bento Grid (Feature Showcase)
- Used for high-information density without clutter (Apple-style).
- Cards should have subtle hover scales (`1.02`) and high-contrast borders.

### 3.2 The Horizontal Scroll Journey
- Immersive product discovery for the "A la Carte" modules.
- Keeps the navigation visible while the user "travels" through the curriculum.

### 3.3 The "Grid-to-Reels" Pattern
- **E-commerce Grid:** Standard product discovery.
- **Full-Screen Reels:** Interactive vertical video reviews for high-conversion affiliate sales.

---

## 4. Engineering Checklist (Anti-Patterns)

- ❌ **No Emojis as Icons:** Always use SVG (Lucide or Heroicons).
- ❌ **No Static States:** All clickable elements *must* have a `cursor-pointer` and a smooth transition (150-300ms).
- ❌ **No Layout Shifting:** Avoid transforms that alter the document flow on hover.
- ❌ **Accessibility:** Maintain 4.5:1 minimum contrast.

---

## 5. Technical Implementation (Styling Stack)
- **CSS Strategy:** Vanilla CSS variables for core themes + Tailwind CSS for utility-first layout.
- **Icon Set:** `lucide-react`.
- **Component Library:** `shadcn/ui` (Customized with xmfclub variables).
