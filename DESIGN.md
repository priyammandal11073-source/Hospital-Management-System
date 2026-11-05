# 🎨 Nivora Care Hospital Management System — Design System

> **Document Version**: 2.1.0  
> **Status**: Verified Active Design Tokens & UI Guidelines  
> **Aesthetic Theme**: Emil Kowalski Borderless Quiet Clinical — Soft tone-on-tone depth, borderless containers, high-contrast typography, and fluid micro-interactions

---

## 1. Design Philosophy & Aesthetic Foundation

Nivora Care implements a **borderless, quiet clinical interface** inspired by Emil Kowalski's design engineering principles:
- **Tone-on-Tone Surface Depth**: Eliminates harsh, noisy structural box borders in favor of clean layer elevations, soft diffused ambient shadows (`shadow-2xs`, `shadow-sm`), and subtle liquid glass backdrops (`rgba(255, 255, 255, 0.85)`).
- **Physical Popout & Wobble Micro-Interactions**: Interactive cards and dashboard tiles feature an instantaneous, physical popout effect (`translateY(-2px)` / `translateY(-3px)`) and subtle wobble physics on hover without jank or layout thrashing.
- **Strict Frame Budget & Recalculation Elimination**: Motion uses composite-only properties (`transform`, `opacity`, `box-shadow`) with scoped class selectors, strictly eliminating expensive Chromium `:has()` DOM style recalculation stalls.
- **Uncompromised Contrast Ratio (WCAG AAA)**: Selected menu items, dark-mode panels, badges, and primary text maintain strict contrast compliance (minimum 4.5:1 for body copy, >7:1 for headings and selected tabs).

---

## 2. Color Palette & Design Tokens

### 2.1 Core Neutral & Surface Colors

| Token Name | Hex Value | Purpose / Usage |
|---|---|---|
| **Warm Parchment Canvas** | `#f7f6f3` | Main app background (`body`) |
| **Pure White** | `#ffffff` | Content cards, data tables, form controls, and modal sheets |
| **Clinical Ink** | `#172b35` | Primary typography and headers |
| **Muted Slate** | `#52656e` | Secondary descriptions, metadata, and placeholders (5.64:1 on parchment) |
| **Subtle Slate** | `#94a3b8` | Decorative icons only; do not use for normal-size text on light surfaces |
| **Input / Control Border** | `#7b8b91` | Form boundaries with 3.53:1 contrast against white |
| **Card Border** | `#dce5e8` | Low-emphasis container outline, not the only control boundary |
| **Dark-Surface Supporting Text** | `#cbd5e1` | Supporting text on dark navy/teal panels |
| **Focus Ring** | `#0f766e` | Keyboard focus indicator (5.47:1 against white) |

### 2.2 Semantic Clinical Status Colors

| Domain Status | Background Class | Text Class | Border / Ring | Semantic Meaning |
|---|---|---|---|---|
| **Active / Confirmed** | `bg-teal-50` / `bg-teal-100` | `text-teal-800` | `border-teal-200` | Confirmed appointment, active clinical case |
| **Success / Completed** | `bg-green-50` / `bg-emerald-100` | `text-green-800` | `border-green-200` | Completed appointment, verified lab report |
| **Pending / Triage** | `bg-amber-50` / `bg-amber-100` | `text-amber-800` | `border-amber-200` | Waiting queue, pending bill, under observation |
| **Consultation** | `bg-purple-50` / `bg-purple-100` | `text-purple-800` | `border-purple-200` | Doctor active consultation, specialist review |
| **Danger / Cancelled** | `bg-rose-50` / `bg-rose-100` | `text-rose-800` | `border-rose-200` | Cancelled booking, critical abnormal lab result, ER Red |
| **Clinical Brand / Teal**| `bg-teal-50` / `bg-teal-600` | `text-teal-800` / `white` | `border-teal-200` | Primary brand CTAs, OPD ticket headers, official stamps |

### 2.3 Surface Design Tokens

| Utility Class | Backdrop Blur & Color | Border & Box-Shadow | Purpose / Usage |
|---|---|---|---|
| `.liquid-glass-elevated` | Opaque white | `border: #dce5e8;` restrained layered shadow | Floating modals, sheets, and quick-action panels |
| `.liquid-glass-pill` | White | `border: #dce5e8;` subtle shadow | Filter tabs, breadcrumb chips, and profile controls |
| `.liquid-glass-subtle` | `#f7f9fa` | `border: #e5ecee` | Secondary controls and notification cards |
| `.liquid-glass-nav` | Near-opaque white | `border: #dce5e8` | Sticky top and bottom navigation with safe-area insets |
| `.liquid-glass-sidebar` | `#f9fbfb` | `border-right: #dce5e8` | Docked navigation sidebar on tablets and desktops |

---

### 2.3 Contrast and Surface Rules

- Normal text targets at least 4.5:1; large text at least 3:1. Meaningful control borders/focus indicators target at least 3:1.
- Light-surface utility text `text-slate-400` and `text-slate-300` resolves to `#52656e`. For dark panels, use `text-slate-200` (`#e2e8f0`) or `text-white`; dark banner copy must not use the light-surface muted token.
- Inputs, textareas, and selects use opaque white surfaces. Use `border-control` on fields; reserve `border-slate-200` and `border-slate-300` for low-priority separators and containers.
- Disabled controls retain readable text and use a neutral fill rather than opacity reduction. Focus rings must contrast against the adjacent surface.
- Keep `color-scheme: light` on the app root and controls unless a deliberate complete dark theme is implemented. Browser autofill must preserve the same foreground and surface.

## 3. Typography & Text Hierarchy

### 3.1 Font Families
- **Primary UI Sans**: `"Geist", "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, system-ui, sans-serif`
  - Used throughout the application for page titles, controls, tables, metrics, and badges.
  - Optical sizing active; page titles use restrained negative tracking and balanced wrapping.

### 3.2 Scale & Hierarchy Conventions

| Level | Tailwind Classes | Usage Context |
|---|---|---|
| **Page Title** | `text-xl md:text-2xl font-semibold tracking-tight` | Top of page; concise and consistent across portals |
| **Card Section Title**| `text-base font-semibold text-slate-800` | Modal headers, dashboard widget headers |
| **Metric Value (KPI)**| `text-3xl font-extrabold text-slate-900` | Top summary statistics & revenue metrics |
| **Table Header** | `text-[11px] font-bold uppercase tracking-wider text-slate-500` | `<thead>` column headers |
| **Body Standard** | `text-sm font-medium text-slate-600` | General narrative text and form labels |
| **Micro Caption** | `text-xs text-slate-400` | Timestamps, ABHA IDs, disclaimer notes |

---

## 4. Spacing, Sizing & Mobile / iPad Native Ergonomics

### 4.1 Safe Area Insets (Mobile & Tablet)
Configured via CSS custom properties in `index.css` and enabled by `<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0, viewport-fit=cover">`:
```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}
```
- **Top Header**: Padded with `padding-top: max(0px, env(safe-area-inset-top, 0px))` so navigation headers and emergency hotlines are never obscured by iPhone Dynamic Islands or camera notches.
- **Bottom Clearance**: Mobile content containers feature `pb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))]` on phones (`< md`) to prevent fixed bottom navigation bars from overlapping scrollable lists.

### 4.2 Touch Targets & Interactive Sizing
- **Minimum Interactive Size**: `.touch-target` and `@media (pointer: coarse)` enforce `min-height: 44px; min-width: 44px;` across buttons, tabs, inputs, and selects (Apple HIG standard).
- **Tap Highlight Elimination**: `-webkit-tap-highlight-color: transparent` prevents visual grey flashes on iOS touch events.
- **Overscroll Containment**: `overscroll-behavior: contain` on all scrollable modal bodies and containers prevents body scroll chaining and rubber-band jitter.
- **Card Padding**: Standard `p-4 sm:p-5 md:p-6` with rounded corners `rounded-2xl`.

### 4.3 Custom Global Cursors
- Default arrow cursor locked via `* { cursor: default; }` to eliminate unwanted browser I-beam flickering.
- Explicit pointer on all clickable elements: `a[href]`, `button`, `select`, `label[for]`, `.cursor-pointer`.
- Text cursor strictly restricted to typeable inputs: `input:not([type="checkbox"])`, `textarea`.

---

## 5. Reusable Component Catalog

All core reusable UI components reside in `client/src/components/ui/` and are re-exported via `client/src/components/ui/index.js`.

### 5.1 `<ConfirmDialog>`
Replaces browser-native `window.confirm()` with a sleek, non-blocking accessible modal dialog:
```jsx
import { ConfirmDialog } from "../components/ui/index.js";

<ConfirmDialog
  isOpen={Boolean(itemToDelete)}
  title="Remove Bed"
  message="Are you sure you want to remove this bed? This cannot be undone."
  confirmText="Remove Bed"
  cancelText="Cancel"
  variant="danger" // "danger" | "warning" | "primary"
  loading={isDeleting}
  onConfirm={handleConfirmDelete}
  onCancel={() => setItemToDelete(null)}
/>
```

### 5.2 `<PageHeader>`
Provides uniform page branding, subtitle descriptions, and responsive right-aligned action buttons:
```jsx
import { PageHeader } from "../components/ui/index.js";

<PageHeader
  title="Clinical Consultations"
  subtitle="Review and manage consultations assigned to your clinical schedule."
  action={
    <button className="px-4 py-2.5 bg-teal-600 text-white rounded-xl text-xs font-bold">
      + New Consultation
    </button>
  }
/>
```

### 5.3 `<DataTable>`
Provides sortable, searchable, paginated table views with responsive overflow wrappers and empty state fallbacks:
```jsx
import { DataTable } from "../components/ui/index.js";

<DataTable
  columns={[
    { key: "name", label: "Patient Name", sortable: true },
    { key: "age", label: "Age" },
    { key: "status", label: "Status" }
  ]}
  data={patientList}
  searchKey="name"
  pageSize={10}
/>
```

### 5.4 `<Modal>` Responsive Bottom Sheet
Automatically adapts between a native iOS **Bottom Sheet** on phones (`< md`) and a centered elevated glass dialog on tablets and desktops (`>= md`):
```jsx
import Modal from "../components/ui/Modal.jsx";

<Modal
  isOpen={isOpen}
  onClose={() => setIsOpen(false)}
  title="Record Vital Signs"
  subtitle="Enter temperature, pulse rate, BP, and oxygen saturation."
  maxWidth="max-w-xl"
>
  {/* Content */}
</Modal>
```
- **Phone (`< md`)**: Slides up from the bottom with `items-end`, `rounded-t-[28px]`, an Apple HIG top drag indicator pill, and `max-h-[90dvh]`.
- **Tablet / Desktop (`>= md`)**: Centers with `items-center`, `rounded-2xl`, and glassmorphic elevated styling.

### 5.5 Table-to-Card Responsive Pattern
High-traffic operational lists (`Appointments`, `Patients`, `Doctors`, `MyPatients`, `WaitingRoomPage`) render:
1. **Desktop / Tablet (`>= md`)**: Full tabular view with column headers, sorting, and inline status badges.
2. **Phone (`< md`)**: Rich, touch-optimized card layout with patient avatars, primary badges, clear field labels, and large 44px action buttons.

### 5.6 Portal Navigation Redesign (Top Bar & Side Menu)

#### Top Navigation Bar
- **Glassmorphic Sticky Shell**: Rendered atop `<BaseLayout>` and `<DashboardLayout>` with `sticky top-0 z-30 bg-white/85 backdrop-blur-md`.
- **Integrated Elements**: 
  - Real-time Hospital Gateway brand pill with dynamic portal indicator.
  - Quick Search dialog with keyboard shortcut (`/` focus).
  - Staff / Patient identity chip with role badge.
  - Emergency SOS quick dial (`108` direct line).
  - Interactive notification bell with badge counter and slide-out popover.

#### Side Menu Navigation Bar
- **Borderless Docked Sidebar**: Docked on tablets and desktops (`md:w-56 lg:w-64`) with smooth collapsible mode (`SidebarCollapseButton` / `Ctrl+B`).
- **High-Contrast Selected Routes**: Active menu links are styled with high-contrast indicator pills (`bg-teal-700 text-white font-bold shadow-xs` in primary portals, or active role accent), ensuring unmistakable visual hierarchy.
- **Micro-Hover Feedback**: Navigation items use smooth, subtle hover states (`hover:bg-slate-100/70 hover:text-slate-900`) with zero border jitter.

### 5.7 Additional Design System Components
- **`<ActionDropdown>`**: Compact, accessible action menu replacing cluttered horizontal button rows.
- **`<ConfirmDialog>`**: Non-blocking accessible modal dialog replacing browser `window.confirm()`.
- **`<SidebarCollapseButton>`**: Accessible keyboard (`Ctrl+B`) & click toggle for sidebar width (`w-16/20` vs `w-56/64`).
- **`<EmptyStateCard>`**: Clean graphic placeholder when queries return zero results.
- **`<SkeletonTable>`**: Animated pulse rows simulating table content during network fetch.
- **`<PageLoader>`**: Suspense fallback spinner matching the brand teal theme.
- **`<PatientBanner>`**: Persistent banner displaying active patient name, age, gender, and ABHA ID atop clinical worksheets.
- **`<QrScannerModal>`**: Native HTML5 camera barcode/QR scanner modal for ABHA cards.
- **`<PatientQrCardModal>`**: Thermal health ID card generator with printable QR code.
- **`<UniversalPaymentModal>`**: Centralized multi-channel billing modal (Razorpay, UPI QR, Cards, Cash, Insurance).

---

## 6. Accessibility & Motion Guidelines

### 6.1 Popout & Wobble Physics
Interactive cards and dashboard tiles use scoped CSS rules for 60fps micro-interactions:
```css
.tile-popout, [data-popout="true"] {
  transition: transform 0.22s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.22s cubic-bezier(0.16, 1, 0.3, 1);
  will-change: transform;
}
.tile-popout:hover, [data-popout="true"]:hover {
  transform: translateY(-2.5px);
  box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08), 0 8px 10px -6px rgba(15, 23, 42, 0.04);
}
```

### 6.2 Reduced Motion Support
```css
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 0.01ms !important;
    transition-duration: 0.01ms !important;
    transform: none !important;
  }
}
```
- **Direct-Manipulation Gestures**: Navigation drawers support a fluid left-edge swipe gesture (`touchstart` < 28px, swipe right > 60px) with interruptible CSS transitions.
- **Modal Dialog Semantics**: Modals include `role="dialog"`, `aria-modal="true"`, and clear close dismiss handlers.
- **Color Independence**: Status tags combine color tinting with explicit text labels (e.g., `Checked In (Waiting)`, not just a green circle).
- **High Visual Contrast (WCAG AAA)**: Text elements maintain minimum 4.5:1 contrast against surface backgrounds; selected routes and primary buttons exceed 7:1.
