# 📜 Nivora Care Hospital Management System — AI Coding & Project Rules

> **Document Version**: 2.0.0  
> **Applicability**: Mandatory for all Developers, AI Coding Agents, and Pair Programmers working in this repository.  

---

## 1. Prime Directives

1. **Do Not Break Working Functionality**: Nivora Care is a complex, 8-portal hospital operating system with hundreds of active clinical and operational workflows. Never perform broad, speculative rewrites or break existing API routes.
2. **Inspect Before Modifying**: Always read and verify the exact implementation, file contents, line numbers, and existing patterns before making changes.
3. **Preserve Backward Compatibility**: Legacy client imports rely on the canonical barrel export at [`client/src/services/api.js`](file:///c:/Users/priya/OneDrive/Documents/Default%20Project/Hospital-Management-System/client/src/services/api.js). When adding or modifying domain services, always update the corresponding domain service file AND ensure the barrel export remains intact.
4. **Never Hardcode Secrets**: Never commit, echo, or hardcode API keys, passwords, JWT secrets, or connection strings into source code, documentation, or git commits. Always use `server/config/env.js` and `client/src/config/env.js`.
5. **No Hallucinated Test Results**: Never claim a test, build, or command succeeded unless you have executed it and verified a 0 return code and passing test counts.

---

## 2. Server Architecture & Coding Rules

### 2.1 Async Route Handling & Error Standard
- Every Express route handler **must** be wrapped with `asyncHandler`:
  ```javascript
  import asyncHandler from "../middleware/asyncHandler.js";
  import AppError from "../utils/AppError.js";

  export const getEntity = asyncHandler(async (req, res) => {
    const item = await Model.findById(req.params.id);
    if (!item) {
      throw new AppError("Entity not found", 404);
    }
    return res.status(200).json({ item });
  });
  ```
- Do not introduce raw `try { ... } catch (err) { res.status(500)... }` blocks unless handling recoverable local operations (such as secondary sync notifications or test accounts).
- Use `AppError(message, statusCode)` for all operational failures.

### 2.2 Server Request Validation
- Every data mutation endpoint (`POST`, `PUT`, `PATCH`) must validate incoming input using **Zod** via the `validate` middleware:
  ```javascript
  import { validate } from "../middleware/validate.js";
  import { createEntitySchema } from "../validators/entityValidators.js";

  router.post("/", protect, validate(createEntitySchema), createEntity);
  ```
- Store Zod schemas under `server/validators/`.

### 2.3 Role-Based Authorization
- Protect staff routes using `protect` and `restrictTo(...)` from `server/middleware/authMiddleware.js`.
- Never rely on client-side role filtering alone; enforce IDOR checks on the server (e.g., verifying that a doctor can only view or modify their own consultation notes or prescriptions).

---

## 3. Client Architecture & UI Rules

### 3.1 Design System Adherence
- **Never use browser `window.confirm()`**: Always use `<ConfirmDialog>` from `../components/ui/index.js`.
- **Use `<PageHeader>`**: Maintain consistent visual hierarchy by rendering `<PageHeader title="..." subtitle="..." action={...} />` at the top of each view.
- **Color Consistency**: Adhere to the established clinical palette documented in `DESIGN.md`:
  - Brand action: `teal-600` / `teal-700`
  - Active/In-Progress: `blue-100` / `blue-800`
  - Completed/Verified: `green-100` / `green-800`
  - Warning/Pending: `amber-100` / `amber-800`
  - Critical/Danger: `rose-100` / `rose-800`
- **State Coverage**: Every asynchronous page or widget must explicitly handle all four visual states:
  1. **Loading State**: Render `<PageLoader>` or `<SkeletonTable>`.
  2. **Empty State**: Render `<EmptyStateCard>` when arrays have 0 length.
  3. **Success State**: Clean layout displaying loaded data.
  4. **Error State**: Informative, user-friendly alert banner with retry capability.

### 3.2 Service Layer Conventions
- Make all backend API requests through domain services located in `client/src/services/` (`patientApi.js`, `bedApi.js`, `prescriptionApi.js`, etc.).
- Never invoke raw Axios instances directly inside page components without using the centralized `httpClient.js` configured with auth interceptors.

### 3.3 Mobile & Tablet Responsiveness Rules
- **Apple HIG 44px Minimum**: All interactive elements (buttons, pills, tabs, selects) must maintain at least 44px height and width on coarse pointer devices.
- **Safe Area Inset Clearance**: Fixed or sticky headers must pad with `padding-top: max(0px, env(safe-area-inset-top, 0px))`. Content containers on phones (`< md`) must include bottom clearance (`pb-[calc(4rem+max(env(safe-area-inset-bottom,0px),8px))]`) to avoid overlapping the bottom navigation bar.
- **Mobile-Responsive Modals**: Use `<Modal>` from `../components/ui/Modal.jsx` which automatically renders as an Apple-style bottom sheet with a drag handle on `< md` and centers on `md+`.
- **Card Fallback on Small Screens**: When adding or revising data tables, always provide a touch-friendly stacked card view on mobile (`block md:hidden`) alongside the desktop table (`hidden md:table` or `hidden md:block`).
- **Mobile Keyboard Ergonomics**: On form inputs, provide appropriate `inputMode` (`"numeric"`, `"tel"`, `"email"`), `autoComplete`, and `enterKeyHint` (`"next"`, `"done"`).

---

## 4. Verification & Testing Requirements

- Whenever server code is modified:
  ```bash
  npm test --prefix server
  ```
  Ensure all 65+ Vitest tests pass with 0 failures.
- Whenever client code is modified:
  ```bash
  npm test --prefix client
  npm run build --prefix client
  ```
  Ensure all unit tests pass AND Vite compiles static bundles without syntax or duplicate export errors.

---

## 5. Mandatory Checklists

### 📋 Pre-Change Checklist
Before writing or modifying any file:
- [ ] Read the target file to understand current imports, exports, and line numbers.
- [ ] Check if a reusable component or service function already exists before creating a new one.
- [ ] Check if the change impacts database models or public API contracts.
- [ ] Verify that no secrets or environment variables will be hardcoded.
- [ ] Determine which test suite validates the targeted functionality.

### 📋 Post-Change Checklist
After completing any file modifications:
- [ ] Run `npm test --prefix server` and verify that all test suites pass.
- [ ] Run `npm test --prefix client` and verify that client tests pass.
- [ ] Run `npm run build --prefix client` and ensure Vite builds cleanly with 0 errors.
- [ ] Inspect `git status` to ensure only intended files were modified.
- [ ] If documentation was affected, update `PRD.md`, `ARCHITECTURE.md`, `DESIGN.md`, or `TRACKER.md` accordingly.
