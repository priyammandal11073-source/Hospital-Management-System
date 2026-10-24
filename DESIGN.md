# 🎨 Nivora Care Hospital Management System — Design System

> **Document Version**: 2.0.0  
> **Status**: Verified Active Design Tokens & UI Guidelines  
> **Aesthetic Theme**: Editorial Healthcare — Warm Parchment & High-Precision Clinical Contrast  

---

## 1. Design Philosophy & Aesthetic Foundation

Nivora Care avoids the sterile, generic look of typical hospital software in favor of an **Editorial Clinical Aesthetic**. 

By pairing **Fraunces serif typography** with subtle, tactile **paper-grain texture overlays** and vibrant, harmonious status badges, the interface feels like fine stock stationery—delivering authoritative calm, high visual contrast, and immediate clarity during critical healthcare operations.

---

## 2. Color Palette & Design Tokens

### 2.1 Core Neutral & Surface Colors

| Token Name | Hex Value | Purpose / Usage |
|---|---|---|
| **Parchment Surface** | `#f7f6f3` | Main app background (`body`) providing tactile, warm paper feel |
| **Pure White** | `#ffffff` | Content cards, data table containers, and modal sheets |
| **Dark Slate Body** | `#0f172a` | Primary typography, headers, and modal text |
| **Muted Slate** | `#475569` | Secondary descriptions, subheadings, table headers |
| **Subtle Slate** | `#94a3b8` | Borders, divider lines, placeholders, and icon fills |
| **Card Border** | `#e2e8f0` | Subtle container outline with `ring-1 ring-slate-200/80` |

### 2.2 Semantic Clinical Status Colors

| Domain Status | Background Class | Text Class | Border / Ring | Semantic Meaning |
|---|---|---|---|---|
| **Active / Confirmed** | `bg-blue-50` / `bg-blue-100` | `text-blue-800` | `border-blue-200` | Confirmed appointment, active clinical case |
| **Success / Completed** | `bg-green-50` / `bg-emerald-100` | `text-green-800` | `border-green-200` | Completed appointment, verified lab report |
| **Pending / Triage** | `bg-amber-50` / `bg-amber-100` | `text-amber-800` | `border-amber-200` | Waiting queue, pending bill, under observation |
| **Consultation** | `bg-purple-50` / `bg-purple-100` | `text-purple-800` | `border-purple-200` | Doctor active consultation, specialist review |
| **Danger / Cancelled** | `bg-rose-50` / `bg-rose-100` | `text-rose-800` | `border-rose-200` | Cancelled booking, critical abnormal lab result, ER Red |
| **Clinical Brand / Teal**| `bg-teal-50` / `bg-teal-600` | `text-teal-800` / `white` | `border-teal-200` | Primary brand CTAs, OPD ticket headers, official stamps |

### 2.3 Liquid Glass Design Tokens (Glassmorphism & Surfaces)

| Utility Class | Backdrop Blur & Color | Border & Box-Shadow | Purpose / Usage |
|---|---|---|---|
| `.liquid-glass-elevated` | `bg-white/80 backdrop-blur-xl` | `border border-white/60 shadow-lg` | Primary floating modals, KPI summary cards, and quick dial panels |
| `.liquid-glass-pill` | `bg-white/75 backdrop-blur-md` | `border border-slate-200/60 shadow-2xs` | Status badges, filter tabs, breadcrumb chips, and profile pills |
| `.liquid-glass-subtle` | `bg-slate-50/60 backdrop-blur-xs` | `border border-slate-200/40` | Table row hover states, secondary dropdowns, notification cards |
| `.liquid-glass-nav` | `bg-white/85 backdrop-blur-md` | `border-b border-slate-200/80 shadow-2xs` | Sticky top navigation bar with dynamic safe-area insets |
| `.liquid-glass-sidebar` | `bg-white/70 backdrop-blur-lg` | `border-r border-slate-200/80` | Docked navigation sidebar on tablets and desktops |

---

## 3. Typography & Text Hierarchy

### 3.1 Font Families
- **Display Serif**: `"Fraunces", Georgia, "Times New Roman", serif`
  - Applied to `h1`, page-level headers, and the Nivora Care wordmark.
  - Optical sizing active; letter-spacing: `-0.015em`; `text-wrap: balance`.
- **Primary Body Sans**: `"Instrument Sans", "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif`
  - Applied to `body`, form controls, data tables, metrics, and badges.

### 3.2 Scale & Hierarchy Conventions

| Level | Tailwind Classes | Usage Context |
|---|---|---|
| **Page Title** | `text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900` | Top of page inside `<PageHeader>` |
| **Card Section Title**| `text-lg sm:text-xl font-bold text-slate-800` | Modal headers, dashboard widget headers |
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

### 5.6 Additional Design System Components
- **`<ActionDropdown>`**: Compact, accessible action menu replacing cluttered horizontal button rows.
- **`<ConfirmDialog>`**: Non-blocking accessible modal dialog replacing browser `window.confirm()`.
- **`<SidebarCollapseButton>`**: Accessible keyboard (`Ctrl+B`) & click toggle for sidebar width (`w-16/20` vs `w-56/64`).
- **`<EmptyStateCard>`**: Clean graphic placeholder when queries return zero results.
- **`<SkeletonTable>`**: Animated pulse rows simulating table content during network fetch.
- **`<PageLoader>`**: Suspense fallback spinner matching the brand teal theme.
- **`<PatientBanner>`**: Persistent banner displaying active patient name, age, gender, and ABHA ID atop clinical worksheets.
- **`<QrScannerModal>`**: Native HTML5 camera barcode/QR scanner modal for ABHA cards.
- **`<PatientQrCardModal>`**: Thermal health ID card generator with printable QR code.

---

## 6. Accessibility & Motion Guidelines

- **Reduced Motion Support**:
  ```css
  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      transition-duration: 0.01ms !important;
    }
    body::before { display: none; }
  }
  ```
- **Direct-Manipulation Gestures**: Navigation drawers support a fluid left-edge swipe gesture (`touchstart` < 28px, swipe right > 60px) with interruptible CSS transitions.
- **Modal Dialog Semantics**: Modals include `role="dialog"`, `aria-modal="true"`, and clear close dismiss handlers.
- **Color Independence**: Status tags combine color tinting with explicit text labels (e.g., `Checked In (Waiting)`, not just a green circle).
- **High Visual Contrast**: Text elements maintain minimum 4.5:1 contrast against surface backgrounds.
