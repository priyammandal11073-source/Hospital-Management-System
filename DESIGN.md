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

## 4. Spacing, Sizing & Layout Conventions

### 4.1 Safe Area Insets (Mobile & Tablet)
Configured via CSS custom properties in `index.css`:
```css
:root {
  --sat: env(safe-area-inset-top, 0px);
  --sar: env(safe-area-inset-right, 0px);
  --sab: env(safe-area-inset-bottom, 0px);
  --sal: env(safe-area-inset-left, 0px);
}
```
Ensures status bars and home indicator bars on mobile devices never obscure buttons or navigational headers.

### 4.2 Touch Targets & Interactive Sizing
- **Minimum Interactive Size**: `.touch-target` enforces `min-height: 44px; min-width: 44px;` on all primary action buttons, tabs, and checkboxes.
- **Card Padding**: Standard `p-5 sm:p-6` with rounded corners `rounded-2xl`.
- **Card Shadow & Ring**: `shadow-xs ring-1 ring-slate-200/80` ensuring crisp definition on both retina screens and legacy monitors.

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

### 5.4 Additional Design System Components
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
- **Modal Dialog Semantics**: Modals include `role="dialog"`, `aria-modal="true"`, and clear close dismiss handlers.
- **Color Independence**: Status tags combine color tinting with explicit text labels (e.g., `Checked In (Waiting)`, not just a green circle).
- **High Visual Contrast**: Text elements maintain minimum 4.5:1 contrast against surface backgrounds.
