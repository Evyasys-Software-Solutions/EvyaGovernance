# Document Manifest

Defines the required sections and quality bar for every document in `.evyasys/docs/`.
The agent uses this as the generation spec. Developers use this to understand
what belongs in each file and where to add new content.

---

## STACK.md
**Purpose:** Complete technology inventory — no surprises for new joiners or reviewers.

Required sections:
- **Runtime** — language, version, runtime environment (Node 20, Python 3.12, JVM 21, etc.)
- **Frameworks** — core frameworks with exact version numbers from config files
- **UI libraries** — component libraries, CSS frameworks, icon sets
- **Database** — DB engine, ORM/query builder, migration tool, version
- **Testing** — unit, integration, e2e frameworks with versions
- **Build & tooling** — bundler, linter, formatter, type checker, version manager
- **Infrastructure** — cloud provider, containerisation, IaC tool
- **CI/CD** — pipeline tool (GitHub Actions, Azure Pipelines, etc.), deploy targets
- **Why this stack** — 1–2 sentences per major choice (extract from README or ADRs if available)

Quality bar: copy-pasteable for a "tech stack" slide. Every tool named with exact version, no missing dependencies.

---

## ARCHITECTURE.md
**Purpose:** Single source of truth for system structure. Orients every developer before they write a line.

Required sections:
- **System overview** — what the system does in 2–3 sentences (business language, not technical)
- **Architecture pattern** — name it specifically: Layered, Hexagonal, Event-driven, MVC, Feature-sliced, Monorepo, Microservices
- **Folder structure** — ASCII tree of the real project root showing every top-level directory and its purpose. Use the actual directory names found during the scan. Example:
  ```
  src/
  ├── app/          ← Next.js App Router pages and layouts
  ├── components/   ← Shared UI components
  │   └── ui/       ← shadcn/radix base components (never edit directly)
  ├── features/     ← Feature modules (auth, dashboard, billing)
  ├── lib/          ← Utility functions and third-party wrappers
  ├── hooks/        ← Global custom hooks
  ├── store/        ← Zustand/Redux global state
  ├── services/     ← API call layer
  ├── types/        ← Shared TypeScript types and interfaces
  └── styles/       ← Global CSS, tokens, design variables
  ```
- **Layer boundaries** — what each layer owns; what it must NOT import from (a table: Layer | Owns | May import from | Must NOT import from)
- **Import alias map** — every configured path alias from tsconfig or bundler config with its resolved path (e.g. `@/*` → `./src/*`, `@components/*` → `./src/components/*`)
- **Component map** — table or diagram of all major modules and their relationships
- **Data flow** — how data moves through the system (read path and write path separately, with real layer names)
- **Key design decisions** — 2–3 decisions that shaped this architecture (link to DECISIONS.md)
- **What NOT to do** — specific anti-patterns that violate this architecture, with real file examples

Quality bar: a new developer can sketch the system on a whiteboard after reading this. ASCII tree uses actual directory names from the scan.

---

## RULES.md
**Purpose:** The non-negotiable list. Every rule uses "must" or "never" — no ambiguity.

Required sections:
- **Architecture rules** — layer crossing rules and import rules specific to the layers found in this project
- **Never do** — hard prohibitions with the reason why (1 line each). Each must reference a real anti-pattern found or likely in this codebase
- **Always do** — hard requirements with the reason why (1 line each)
- **Data rules** — how data may and may not be accessed, validated, exposed
- **Security rules** — minimum security requirements (cross-reference SECURITY.md)
- **Frontend rules** — UI-specific hard rules: no inline styles, no magic color values, must use design tokens, accessibility rules (cross-reference UI_UX_STANDARDS.md)
- **Review rules** — what a reviewer must check before approving a PR

Quality bar: a linter or reviewer can verify every rule mechanically. No "prefer" or "consider" — only "must" and "never".

---

## STANDARDS.md
**Purpose:** How code looks. Enforces visual and structural consistency across the entire codebase.

Required sections:
- **File naming** — one rule per file type found in this project (components, services, tests, hooks, stores, contexts, types, utils). Include actual examples: `UserCard.tsx`, `useUserCard.ts`, `userCard.test.tsx`
- **Variable and function naming** — conventions per layer and per construct (interfaces, types, enums, constants, components, hooks, event handlers). Real examples from the codebase.
- **Import order** — exact order with a real example from the project. Typically: 1) External packages, 2) Internal aliases (@/), 3) Relative paths. Show how an existing file in the project is organised.
- **Export style** — named exports vs default exports rule per file type. Example: components use default export, utilities use named exports, types use named exports.
- **Formatting** — indentation, line length, quotes, semicolons, trailing commas (extracted from actual config files — not guessed)
- **TypeScript conventions** — `interface` vs `type` rule, `unknown` vs `any` policy, assertion style, generic naming
- **Function size** — maximum recommended lines or cyclomatic complexity per layer
- **Comment rules** — when to comment (non-obvious WHY), when not to (what the code already says), how to phrase JSDoc if used
- **Folder structure rules** — what goes where; what is forbidden at root; what belongs in `shared/` vs feature directories
- **className ordering** — if Tailwind is used: required tool (prettier-plugin-tailwindcss or eslint-plugin-tailwindcss), ordering convention, no inline style rule
- **Async patterns** — `async/await` vs Promise chain rule; error handling in async functions (try/catch vs `.catch()`)

Quality bar: a code review comment can reference a specific line in this document. Rules match the actual config files found in the scan.

---

## PATTERNS.md
**Purpose:** Approved patterns in use. Use these — do not reinvent them.

Required sections:
- One section per pattern found in the codebase
- For each pattern:
  - **Name** and **category** (creational, structural, behavioural, architectural)
  - **When to use** — specific trigger condition for this project
  - **When NOT to use** — the most common misuse seen in this codebase
  - **Canonical example** — real file path and real code structure from this project
  - **Anti-pattern** — the wrong version with a concrete explanation

Minimum patterns to document if found: Repository pattern, Service layer, Custom hook extraction, Context provider, Error boundary, HOC vs hook debate, Data fetching pattern (React Query / SWR / useEffect), Form schema validation.

Quality bar: a developer can copy the canonical example and adapt it within 5 minutes.

---

## FRONTEND.md
**Purpose:** Frontend-specific rules for every developer writing UI code.
Write "Not applicable" at top if no frontend layer exists.

Required sections:
- **Component file structure** — single-file vs multi-file convention. Document the exact structure used in this project:
  - Single-file: `UserCard.tsx` contains component, types, and styles
  - Multi-file: `UserCard/index.tsx`, `UserCard/UserCard.tsx`, `UserCard/types.ts`, `UserCard/styles.module.css`, `UserCard/UserCard.test.tsx`, `UserCard/UserCard.stories.tsx`
  - Rule: when does a component get its own directory? (threshold: X sub-components, or has stories, or has tests)
  - Barrel exports: does `components/index.ts` exist? What is exported? What is NOT exported?

- **Component anatomy rules** — props interface naming (`UserCardProps`, not `Props` or `IUserCardProps`), props destructuring convention, children typing (`React.ReactNode` vs `React.ReactElement`), ref forwarding rule, display name for dev tools

- **Hook rules** — naming prefix (`use` required), co-location rule (hook in same directory as component vs `hooks/` at feature level vs `hooks/` at root), when to extract a hook (reused ≥2 times, or >20 lines of state logic), rule for hooks that call APIs (lives in services vs in component)

- **Context and provider rules** — naming (`*Context`, `*Provider`), location (feature-level `context/` vs global `providers/`), what belongs in context (truly shared state) vs what does NOT (component-local state, server data), rule against deeply nested providers

- **State management** — identify which library is used (Redux/Zustand/Jotai/Context/React Query). Document:
  - What goes in global state vs local (`useState`) vs server state (React Query/SWR) vs URL state
  - Store/atom naming conventions
  - Selector or derived state pattern used
  - Real file path of the store

- **Client vs Server components** (Next.js App Router only — skip if not applicable) — what belongs in Server Components (data fetching, heavy computation, no interactivity), what requires Client Components (event listeners, browser APIs, hooks), where the boundary lives (`"use client"` directive placement rule), passing server data to client components

- **Data fetching** — library used (React Query, SWR, Axios, fetch). Key patterns: where queries are defined (co-located vs `hooks/queries/`), cache key naming, loading/error state handling, optimistic updates pattern if used

- **Form handling** — library used (react-hook-form / formik / native). Document:
  - Schema validation library (zod / yup) and schema location (`schemas/` or co-located)
  - Field registration pattern (register vs Controller vs Field)
  - When to use controlled vs uncontrolled inputs
  - Form component structure (FormField wrapper pattern if used)

- **Routing** — approach (file-based App Router / Pages Router / React Router / TanStack Router), protected route pattern (middleware vs component guard), route parameter typing, navigation helper (useRouter, useNavigate, Link)

- **Styling** — CSS approach used in this project (Tailwind utility-first / CSS Modules / styled-components / emotion). Rules:
  - No inline `style={{}}` for design values — use tokens
  - Class naming rule (if CSS Modules: `.camelCase`; if Tailwind: ordering tool required)
  - Theming: how to access theme values in non-Tailwind code
  - Dynamic class rule: `cn()` / `clsx` / `classnames` — which is used, how

- **Image and asset handling** — component used (`next/image` or `<img>`), required alt text rule, aspect ratio handling, where static assets live (`public/` structure), import rule for SVGs (as component vs as URL)

- **Accessibility (component level)** — semantic HTML first rule, ARIA attribute usage (when to add `aria-label`, `aria-describedby`, `role`), form label requirement, focus management on dynamic content, colour contrast rule (reference DESIGN_SYSTEM.md colour tokens)

- **Performance patterns** — code splitting (dynamic `import()`, `React.lazy` + `Suspense`), memoisation rule (`useMemo` / `useCallback` — when justified, not premature), virtual list threshold, image lazy loading

- **Environment variables** — which prefix exposes vars to the browser (`NEXT_PUBLIC_` / `VITE_`), rule against logging env vars, where to define type declarations for env vars

Quality bar: a frontend developer starting a new component, hook, or page has all answers here without asking anyone.

---

## BACKEND.md
**Purpose:** Backend-specific rules. Write "Not applicable" at top if no backend layer exists.

Required sections:
- **API layer** — how routes/controllers are structured (cross-reference API_STANDARDS.md)
- **Service layer** — what services own, how they communicate, dependency injection approach
- **Repository/Data layer** — data access patterns, ORM usage rules (cross-reference DB_STANDARDS.md)
- **Middleware** — what middleware is registered, in what order, which is mandatory for every route vs opt-in
- **Authentication flow** — how auth is implemented end-to-end (cross-reference SECURITY.md)
- **Background jobs** — queue/job patterns used, retry strategy, failure handling
- **Configuration** — how config is loaded, env var naming convention, required vs optional
- **Logging** — what is logged, at what level, structured format (cross-reference ERROR_HANDLING.md)

Quality bar: a backend developer can add a new API endpoint without asking anyone.

---

## DB_STANDARDS.md
**Purpose:** Database rules. Write "Not applicable" at top if no database exists.

Required sections:
- **Schema conventions** — table/collection naming (snake_case, plural), column naming rules with real examples from the actual schema
- **Primary keys** — strategy used in this project: UUID, ULID, serial/sequence, CUID — with real example from schema
- **Timestamps** — `created_at`/`updated_at` presence, timezone handling (`timestamp` vs `timestamptz`), auto-update mechanism
- **Foreign keys** — naming pattern (e.g. `{entity}_id`), required indexes, cascade rules — with real example
- **Migrations** — tool used (Prisma Migrate, Alembic, Flyway, Knex), naming convention for migration files, command to create and run, rollback approach
- **Query patterns** — approved ORM/query patterns, N+1 prevention rule (select includes, eager loading), raw query policy (allowed only for…), pagination standard (cursor vs offset)
- **Indexes** — when to add (foreign keys always, query predicates on large tables), naming convention, composite index rules
- **Soft delete** — pattern used (`deleted_at`, `is_active`, `status` enum) or explicit statement that hard delete is used. If soft delete: rule for querying (default where clause, scope, middleware)
- **Seeding** — test data seeding approach; what is seeded in each environment; seed file location

Quality bar: a DBA can enforce these rules in review without reading source code.

---

## API_STANDARDS.md
**Purpose:** API contracts and conventions. The contract between frontend and backend.

Required sections:
- **API style** — REST / GraphQL / tRPC / gRPC (document only what actually exists in the codebase)
- **URL conventions** — resource naming, versioning strategy (`/api/v1/`), path structure with real examples from the codebase
- **HTTP methods** — which method for which operation (real CRUD mapping used in this project)
- **Request format** — required headers, body format, authentication header — with real examples
- **Response format** — success envelope shape, pagination format, metadata fields — with real examples from actual API responses or handler code
- **Error format** — exact error object structure (`{ code, message, details, traceId }`), HTTP status codes mapped to error types
- **Versioning strategy** — how breaking changes are handled, deprecation policy
- **Authentication** — how API auth is passed (JWT Bearer, API key header, session cookie, etc.)

Quality bar: a new endpoint can be designed by reading only this document, with no inconsistency.

---

## TESTING.md
**Purpose:** How testing works in this project — strategy, tools, and expectations.

Required sections:
- **Test strategy** — unit / integration / e2e — which layer covers which scenarios (with layer names from ARCHITECTURE.md)
- **Coverage requirements** — minimum coverage percentage per layer (or explicit "no requirement" if none configured)
- **File naming** — test file naming convention and co-location rule (e.g. `UserCard.test.tsx` next to `UserCard.tsx`, or in `__tests__/`)
- **Test structure** — Arrange / Act / Assert (or Given / When / Then) — show a real example from the codebase
- **Mocking rules** — what to mock (external services, time, environment), what NOT to mock (business logic), which mock library is used
- **Fixtures and factories** — how test data is created; factory file location; builder pattern if used
- **E2E** — tool (Playwright / Cypress), what flows are covered, selector rule (`data-testid` vs ARIA vs CSS class), how to run
- **Running tests** — exact commands for unit, integration, e2e, and coverage (copy from package.json scripts)
- **What makes a bad test** — specific anti-patterns found or prohibited in this codebase (snapshot abuse, testing implementation details, etc.)

Quality bar: a developer writing their first test in this project has all answers here.

---

## SECURITY.md
**Purpose:** Security requirements. Every rule here is a blocker in code review.

Required sections:
- **Authentication** — mechanism (JWT, session, OAuth, API key), token storage rule (httpOnly cookie vs localStorage — never localStorage for sensitive tokens), expiry policy
- **Authorisation** — RBAC/ABAC model, where permission checks happen (middleware, service, or both), which middleware enforces it
- **Input validation** — where validation happens (controller, service, schema), library used (zod, joi, class-validator), rule against trusting client-supplied IDs without ownership check
- **Output encoding** — XSS prevention (React auto-escaping + `dangerouslySetInnerHTML` rule), Content-Security-Policy header, content-type headers
- **Secrets management** — where secrets live (environment variables only), how they are loaded, what is strictly forbidden (committed secrets, logging secrets, client-side exposure)
- **Dependency hygiene** — audit process (`npm audit`, Dependabot, Snyk), update policy, how to handle critical CVEs
- **CORS** — allowed origins, allowed methods, allowed headers, credentials flag — with real config from the codebase
- **Rate limiting** — implemented where, which library/middleware, limits per endpoint type
- **Known risks** — any known vulnerabilities, TODOs, or areas that need security attention (name them — do not sanitise)

Quality bar: a security reviewer can use this as a checklist without reading source code.

---

## DESIGN_SYSTEM.md
**Purpose:** Visual language — the exact values and rules that make the UI consistent.
Write "Not applicable" at top if no frontend layer exists.

> **Extraction rule:** Read the actual config files. Do not describe the library — describe this project's implementation.
> Real values only. Never write "uses Tailwind default colours" — write the actual colour names and hex values.

Required sections:
- **Design token source** — where the tokens live. One of: `tailwind.config.*` (extract `theme.extend`), `src/styles/tokens.*`, `globals.css` CSS custom properties, MUI/Chakra/Ant `theme.ts`. Quote the file path.

- **Colour palette** — extracted from the actual config. Format as a table:
  | Token name | Value | Semantic role |
  |---|---|---|
  | `primary` | `#0070f3` | CTAs, links, focus rings |
  | `destructive` | `#ef4444` | Delete actions, error states |
  | `muted` | `#f1f5f9` | Disabled backgrounds, subtle surfaces |
  Document: light/dark mode support (yes/no), how dark mode is toggled (class, data-attribute, media query)

- **Typography scale** — extracted from config. Format as a table:
  | Token | Size | Line height | Weight | Usage |
  |---|---|---|---|---|
  | `text-xs` | 0.75rem | 1rem | 400 | Labels, captions |
  | `text-sm` | 0.875rem | 1.25rem | 400 | Body secondary |
  Font family: primary font name (from config), fallback stack, where font is loaded (next/font, Google Fonts link, local file)

- **Spacing scale** — extracted from config. List all custom spacing values with usage rule. Example: use `4` (1rem) as the standard component internal padding; use `6` (1.5rem) between form fields; `16` (4rem) for section gaps.

- **Border radius scale** — all tokens with usage rule. Example: `rounded` (0.25rem) for inputs, `rounded-md` for cards, `rounded-full` for badges and avatars.

- **Shadow / elevation scale** — all shadow tokens with semantic meaning. Example: `shadow-sm` for cards, `shadow-md` for dropdowns, `shadow-lg` for modals. If using a z-index system, document the z-index scale:
  | Layer | z-index | Used for |
  |---|---|---|
  | Base | 0 | Normal flow |
  | Raised | 10 | Sticky headers, floating buttons |
  | Dropdown | 100 | Select menus, comboboxes |
  | Overlay | 200 | Backdrop |
  | Modal | 300 | Dialogs, drawers |
  | Toast | 400 | Notifications |
  | Tooltip | 500 | Tooltips |

- **Animation tokens** — duration values (`duration-150`, `duration-300`), easing curves (`ease-in-out`), which interactions animate (hover, focus, modal appear, accordion expand). `prefers-reduced-motion` rule: all CSS transitions must use `@media (prefers-reduced-motion: reduce)` or the Tailwind `motion-safe:` prefix.

- **Component library** — which library is in use (shadcn/ui, MUI, Chakra, Radix, Ant Design, or custom). For each major component type, document:
  | Component | Source | Variants | Usage note |
  |---|---|---|---|
  | Button | `components/ui/button.tsx` | default, destructive, outline, ghost, link | Primary CTA uses `default`; destructive actions use `destructive` |
  | Input | `components/ui/input.tsx` | — | Always wrap in FormField for label + error |
  | Dialog | `components/ui/dialog.tsx` | — | Confirmation dialogs use this; never use `window.confirm` |
  | Badge | `components/ui/badge.tsx` | default, secondary, destructive, outline | Status indicators only |

- **Icons** — library used (Lucide, Heroicons, Phosphor, Radix Icons, custom SVG). Import pattern, size rule (use `size` prop or `w-4 h-4` class), colour rule (inherit from text colour). How to add a new icon.

- **Grid and layout** — column system, container max-width, page-level padding, responsive layout pattern (sidebar collapses at which breakpoint)

- **Adding a new component** — step-by-step: where to create, naming convention, what to export, whether to add a story, whether to document here

Quality bar: any developer can implement a new UI feature that is visually consistent with the entire product by reading only this document and the Figma file (if one exists).

---

## UI_UX_STANDARDS.md
**Purpose:** Interaction and experience consistency. Every user-facing feature must follow these patterns so the product feels unified, not assembled from separate decisions.
Write "Not applicable" at top if no frontend layer exists.

> **Extraction rule:** Identify the actual patterns used in this codebase. Do not recommend patterns that are not present — document what exists and formalise it as the standard. If a pattern is absent where one is needed, flag it as a gap with the recommended approach.

Required sections:
- **Loading states** — document which loading pattern is used for each context in this project:
  | Context | Pattern | Component | Rule |
  |---|---|---|---|
  | Page / route transition | Route-level skeleton | `loading.tsx` (Next.js) | Show within 100ms |
  | List / table data | Row skeletons | `Skeleton` component | Match real content shape |
  | Button action in progress | Inline spinner + disabled | `Button loading` prop | Disable during request |
  | Full-page blocking action | Overlay spinner | `LoadingOverlay` | Only for irreversible actions |
  Rule: never show raw `undefined`, `null`, or `[object Object]` in the UI while loading.

- **Empty states** — what renders when a query returns zero results. Mandatory anatomy:
  - Visual (illustration or icon — which one)
  - Heading (what it says — examples from the codebase)
  - Supporting text (optional guidance)
  - Primary CTA (when to include, what the label is)
  Cite the component used (`EmptyState`, `EmptyPlaceholder`, or the inline pattern). Document whether empty state varies by permission (user has no data vs user cannot create).

- **Error states** — map each error type from ERROR_HANDLING.md to a UI pattern:
  | Error category | UI pattern | Component | User message rule |
  |---|---|---|---|
  | Form validation | Inline field error | FormMessage | Specific: "Must be at least 8 characters" |
  | API 400 (client error) | Form-level error banner | Alert (destructive) | Show API message if safe |
  | API 401/403 | Redirect to login or 403 page | — | "You don't have permission to view this" |
  | API 404 | 404 page or inline not-found | — | "This {resource} doesn't exist" |
  | API 500 / network | Error boundary fallback or toast | ErrorBoundary, Toast | "Something went wrong. Please try again." |
  Rule: never show raw error codes or stack traces to end users.

- **Success feedback** — what happens after a successful action:
  | Action type | Feedback pattern | Duration | Example |
  |---|---|---|---|
  | Save / update | Toast (success) | 3s auto-dismiss | "Changes saved" |
  | Create new item | Toast + navigate/scroll to item | 3s | "User created" |
  | Delete | Toast (success) | 3s | "User deleted" |
  | Destructive bulk action | Toast with undo option | 5s | — |
  Toast library used (sonner / react-hot-toast / react-toastify), position, maximum stack count.

- **Confirmation dialogs** — which actions require a confirmation dialog before proceeding:
  - Hard deletes (no undo)
  - Bulk destructive actions
  - Irreversible state changes
  Dialog anatomy: title (noun + action: "Delete user?"), body text (consequence: "This action cannot be undone"), confirm button (destructive, verb: "Delete"), cancel button (neutral: "Cancel"). Component used.
  Rule: never use `window.confirm()` or `window.alert()`.

- **Form UX patterns** — document the standard for forms in this project:
  - Validation timing: on `onChange` / `onBlur` / `onSubmit` (which is the standard, when to deviate)
  - Label placement: always-visible label above field (never placeholder-only for required fields)
  - Required field indicator: asterisk (`*`) with legend, or implicit
  - Help text placement: below the field, before the error message
  - Submit button state: disabled until form is valid, or always enabled with validation on submit
  - Multi-step form pattern (if used): stepper component, validation per step vs final submit
  - Character limit: counter appears at N characters remaining

- **Navigation and wayfinding** — document the active state pattern for each navigation type found in this project (sidebar nav, top nav, tabs, breadcrumbs). Include:
  - CSS/class applied to active nav item
  - Breadcrumb generation rule (manual vs auto from URL)
  - Page `<title>` update rule (static vs dynamic)
  - Back navigation: browser back vs in-app back button (which is used when)

- **Focus and keyboard interaction** — non-negotiable rules:
  - Never remove the browser focus outline without providing a visible replacement
  - Modal / drawer opens: focus moves to the first interactive element inside
  - Modal / drawer closes: focus returns to the trigger element
  - Escape key: closes any overlay (modal, drawer, dropdown, popover)
  - Tab order: follows DOM order; `tabindex` values above 0 are forbidden
  - All interactive elements reachable by keyboard

- **Responsive behaviour** — for each major layout pattern found in the project, document the breakpoint behaviour:
  | Layout | Mobile (< sm) | Tablet (sm–lg) | Desktop (> lg) |
  |---|---|---|---|
  | Sidebar nav | Hidden, hamburger menu | Collapsible icon-only | Full labels |
  | Data table | Card list | Horizontal scroll | Full table |
  | Modal | Bottom sheet | Centred modal | Centred modal |
  | Form | Single column | Single column | Two-column for long forms |
  Reference breakpoint values from DESIGN_SYSTEM.md.

- **Motion and animation** — document which UI interactions animate in this project and the rules:
  - Page/route transitions: yes/no, which animation
  - List item add/remove: yes/no, animation type
  - Accordion / collapsible: expand/collapse animation
  - Modal appear: fade + scale or slide
  - Toast appear/dismiss: slide in from position
  Reference duration and easing tokens from DESIGN_SYSTEM.md.
  Hard rule: all animations must respect `prefers-reduced-motion` (no exceptions).

- **Copy and tone conventions** — document the rules for user-facing text found in this codebase:
  - Button labels: verb-first imperative ("Save changes", "Delete user") not OK/Submit/Confirm
  - Case: sentence case for all UI text (not title case)
  - Error messages: specific and actionable ("Email address is already in use") not generic ("An error occurred")
  - Placeholder text: short hint of expected value, not a repeated label ("you@example.com" not "Enter your email")
  - Empty state headings: noun-first ("No users found") not question form
  - Confirmation dialog bodies: state the consequence ("This will permanently delete the user and all associated data") not just "Are you sure?"

- **Accessibility baseline** — non-negotiable requirements for every component:
  - All images have meaningful `alt` text (empty `alt=""` for decorative images)
  - All form inputs have associated `<label>` elements (not just placeholder)
  - Icon-only buttons have `aria-label`
  - Colour alone is never the only means of conveying information (pair with text or icon)
  - Minimum contrast ratio: 4.5:1 for normal text, 3:1 for large text (WCAG AA)
  - Dynamic content updates announced via `aria-live` where appropriate

Quality bar: a designer and a developer can independently implement any new feature and produce a UI that is behaviourally and visually consistent with every existing feature — without asking anyone.

---

## WORKFLOWS.md
**Purpose:** Dev process — how work moves from a task to a merged PR.

Required sections:
- **Branch naming** — convention with real examples: `feature/`, `fix/`, `chore/`, `hotfix/`
- **Commit messages** — format, scope rules, tools (commitlint, husky), real examples
- **Pull request process** — how to raise a PR, required reviewers, approval count, draft vs ready
- **Code review checklist** — what a reviewer checks (link to RULES.md and UI_UX_STANDARDS.md for UI changes)
- **Merge strategy** — squash / rebase / merge — which is used and why
- **Release process** — how releases are cut, tagged, and deployed (automated or manual)
- **Hotfix process** — emergency change process, branch from, how to deploy

Quality bar: a new joiner can raise their first PR without asking anyone.

---

## DEPLOYMENT.md
**Purpose:** How the system gets to production — and back if something goes wrong.

Required sections:
- **Environments** — all named environments (dev, staging, prod) and what differs between them
- **CI/CD pipeline** — stages in order, what each does, what triggers each stage
- **Build process** — how the app is built per environment, build-time variables
- **Secrets in CI** — which secrets exist, where configured, how to rotate
- **Deployment steps** — step-by-step for a normal deploy (automated or manual steps clearly marked)
- **Rollback procedure** — how to roll back, decision criteria, time budget
- **Health checks** — how to verify a deploy succeeded
- **Monitoring** — what is monitored, what alerts exist, who is paged

Quality bar: an ops engineer can deploy or roll back without developer help.

---

## ERROR_HANDLING.md
**Purpose:** Consistent error strategy across the entire codebase.

Required sections:
- **Error taxonomy** — categories with names: Validation, Authentication, Authorisation, NotFound, Conflict, ExternalService, Internal
- **Error object shape** — exact fields on every error (`code`, `message`, `details`, `traceId`, `httpStatus`)
- **HTTP status codes** — mapping of each error category to HTTP status used in this project
- **Logging levels** — debug / info / warn / error — exact trigger condition for each
- **Log format** — structured fields (timestamp, level, traceId, userId, message, context), PII rules
- **User-facing messages** — rules for what to show vs hide; default fallback message (cross-reference UI_UX_STANDARDS.md Error states)
- **External service errors** — how 3rd-party failures are handled, retry strategy, circuit breaker

Quality bar: every error in production is traceable, categorised, and produces a consistent user message.

---

## DECISIONS.md
**Purpose:** Architecture Decision Records (ADRs) — the why behind every major choice.

Format per decision:
```
## ADR-NNN — <Title>
**Date:** YYYY-MM-DD
**Status:** Accepted | Superseded by ADR-NNN | Deprecated
**Context:** What problem required a decision. What constraints existed.
**Decision:** What was decided in one sentence.
**Consequences:** Pros and cons. What changed. What was traded off.
```

Required: at least one ADR per major technology or architecture choice found in the scan.
If the reasoning is unknown, write: "Context: Inferred from codebase scan — original decision not documented."

Quality bar: any developer can understand why the stack looks the way it does.

---

## PERFORMANCE.md
**Purpose:** Performance standards — prevents slow-by-design code reaching production.

Required sections:
- **Budgets** — response time targets per API tier (p50, p95, p99), page load budget (LCP, TTI), bundle size budget (initial JS, per-route chunks)
- **Database** — max query time, index requirements for queries on large tables, pagination requirements
- **Caching** — what is cached, where (browser, CDN, server), TTL, invalidation strategy
- **Frontend** — Core Web Vitals targets (LCP < 2.5s, CLS < 0.1, INP < 200ms), lazy-loading rules, image optimisation, font loading strategy
- **Known hot paths** — list of endpoints or operations that are performance-sensitive (must be flagged in review)
- **Profiling** — how to profile locally (exact commands), which APM tool is used in production
- **Anti-patterns** — specific patterns forbidden: N+1 queries, synchronous I/O in hot paths, unbounded list rendering without pagination, importing entire icon libraries

Quality bar: a reviewer can flag a performance regression without running a benchmark.

---

## ONBOARDING.md
**Purpose:** Get a new developer productive in one hour.

Required sections:
- **Prerequisites** — software to install before cloning (OS, Node version, Docker, etc.) with minimum versions
- **Setup steps** — numbered, complete steps from `git clone` to the running app (exact commands, not summaries)
- **Environment variables** — table: variable name | purpose | where to get the value | required/optional
- **Project structure tour** — 5-minute walk-through (reference ARCHITECTURE.md folder tree)
- **First PR checklist** — what to do before raising a first PR (tests, lint, docs, etc.)
- **Key contacts** — who owns what (role names, not personal names — or Slack channels)
- **Common problems** — 3–5 common setup issues with their exact fix (not "check the docs")

Quality bar: a new joiner is running the app locally within one hour using only this document.

---

## GLOSSARY.md
**Purpose:** Shared vocabulary — eliminates miscommunication between dev, product, and QA.

Format per term:
```
**<Term>** — <Definition in plain language>. *Used in: <where it appears in the codebase or domain>.*
```

Required: one entry per domain concept found in the codebase — infer from entity names,
route names, service names, enum values, and config keys. Minimum 10 entries.

Quality bar: product, QA, and dev use the same word to mean the same thing.

---

---

## fe/STYLING_MICRO_STANDARDS.md
**Purpose:** The single source of truth for every visual token, icon size, and CSS rule. Zero raw values anywhere outside the token file.
Write "Not applicable" at top if no frontend layer exists.

Required sections:
- **Token file location** — the single file where all raw values live (e.g. `src/styles/tokens.css`, `tailwind.config.ts`, `globals.css`). Quote the exact path found during the scan. State the rule: raw values appear in this file only — nowhere else.
- **Complete token catalogue** — extract every CSS custom property or Tailwind `theme.extend` entry actually defined in the project:
  - *Colour scale* — primary, secondary, neutral, plus semantic aliases (bg-page, bg-card, text-primary, text-secondary, border-default, border-focus, interactive states, disabled)
  - *Typography* — font families, font sizes (every step in the scale), font weights, line heights, letter spacing
  - *Spacing* — the spacing scale with px equivalents (4px base grid)
  - *Border radius* — every step with semantic usage (input, card, modal, pill)
  - *Shadows* — every step with semantic usage (card, dropdown, modal, sticky)
  - *Z-index scale* — every named z-index with its semantic layer (dropdown, sticky, overlay, drawer, modal, toast, tooltip)
  - *Motion tokens* — duration values, easing curves, composite transition tokens
  - *Component tokens* — per-component computed tokens (input heights, button heights, card padding, nav height, sidebar widths, modal padding)
- **Typography micro-rules** — complete style → token mapping table. Every text style in the product (H1–H6, Body Large/Default/Small, Caption, Label, Helper Text, Error Text, Badge, Button SM/MD/LG, Nav Item, Tab, Table Header, Table Cell, Tooltip, Empty State Title/Body) maps to exact font-size, font-weight, and line-height tokens
- **Icon size matrix** — every UI context maps to an exact icon size and Tailwind class. Cover: button icons (sm/md/lg), icon-only buttons, form field adornments, error/success field icons, sidebar nav, top nav, breadcrumb separator, table row actions, table sort/checkbox, dropdown items, tab icons, badge icons, avatar placeholders, empty state illustrations, alert/banner icons, toast icons, modal close button, card action icons, stat card icons, loading spinners (button/inline/page), notification bell, profile avatar
- **Spacing anatomy** — component-level spacing table: label→input gap, input→helper/error gap, field→field gap, section→section gap, card padding (default + compact), modal padding, table cell padding, page section gaps, nav item height and padding, badge padding, avatar→name gap, dropdown item padding, tooltip offset, toast padding
- **CSS architecture rules** — 7 rules:
  1. *No inline styles* — `style={{}}` is banned except for setting CSS custom property values for dynamic data (e.g. `--progress: ${pct}%`)
  2. *No hardcoded values* — no raw hex, px, rem, or arbitrary Tailwind `[]` values in components; always use a named token
  3. *No `!important`* — fix specificity instead
  4. *CSS scoping* — raw values live in `:root` in the token file only; component styles use CSS Modules or Tailwind utilities; never style another component's internals from a parent stylesheet
  5. *State classes use tokens* — `:hover`, `:active`, `:focus-visible`, `:disabled` all reference token variables; never remove focus outline without providing an accessible replacement
  6. *Responsive is mobile-first, named breakpoints only* — no magic pixel values in `@media` queries; use Tailwind responsive prefixes or named breakpoint variables only
  7. *No duplicate styles* — same CSS in two components = extract shared class or component; three or more = definitely a token or utility
- **Dark mode** — if dark mode is implemented: which tokens change (semantic aliases only, never scale tokens), how the mode is toggled (class, `data-theme` attribute, or `prefers-color-scheme` media query), why components must use semantic aliases not scale tokens

Quality bar: ESLint + Stylelint can mechanically verify every rule. A developer can add a new component using only token names — zero raw values needed.

---

## fe/HOOKS_DEEP_RULES.md
**Purpose:** The complete behavioural contract for every custom hook. Prevents the most common React hook bugs — stale closures, memory leaks, unnecessary re-renders, misused memoization.
Write "Not applicable" at top if no frontend React layer exists.

Required sections:
- **The 8-rule hook contract** — every custom hook must satisfy all eight rules. State each rule explicitly with a concrete example drawn from the actual codebase:
  1. Single Responsibility — one hook, one concern
  2. Deterministic Return — typed return shape, consistent regardless of internal state
  3. Safe Cleanup — every side effect has a corresponding cleanup (subscription, timer, listener)
  4. Error Surface — throws or returns an error field; never silently swallows exceptions
  5. Dependency Honesty — every `useEffect`/`useCallback`/`useMemo` dep is in the array or its exclusion is justified with a comment
  6. SSR Safety — no `window`/`document` access without existence check
  7. Composability — can be consumed by another hook without modification
  8. Test Isolation — all external dependencies injectable or mockable via arguments
- **useEffect rules** — when `useEffect` IS appropriate (subscribing to external data sources, syncing non-React state like DOM/localStorage/third-party libraries, post-render focus management) vs when it is NOT (data fetching — use React Query; deriving state from props — compute during render; attaching event handlers directly to elements — use library hooks). Dependency array rules: every dep listed, or the omission must have an `// eslint-disable-next-line react-hooks/exhaustive-deps` comment with a one-line explanation; suppressing the rule without explanation is banned
- **Memoization decision rules** — `useMemo`: only for expensive computations (>1ms measured) or values used as deps in another hook; never for primitive values or simple concatenation. `useCallback`: only for functions passed as props to `React.memo`-wrapped children or functions used inside `useEffect` deps; never for closures that have no downstream impact. `React.memo`: apply to pure display components (list rows, table cells), expensive renders, components whose props change rarely; skip for components that always receive new or primitive props. **Decision rule: measure first. Default to no memoization — add only with evidence.**
- **Data fetching hook patterns** — use the project's data fetching library (React Query or equivalent) for all server state. Document the standard patterns: query hook (queryKey array convention, staleTime/gcTime, retry logic that skips 401/403), mutation hook (onSuccess invalidation + cache preload, onError toast), optimistic update hook (cancelQueries + setQueryData rollback on onError), infinite scroll hook (getNextPageParam convention). State the rule: `useState` + `useEffect` for server data is banned
- **Hook composition pattern** — compose primitive hooks (useDebounce, usePagination, useFilters) and data hooks (useUsers) into feature hooks (useUserList). The component layer consumes only the feature hook — it knows nothing about fetching, pagination, or debounce logic. Document the real composition hierarchy found in the codebase
- **Banned anti-patterns** — document each with a code example showing the wrong and correct version: hooks inside conditionals or loops, calling hooks from event handlers, giant multi-concern hooks (split rule: if hook has >3 independent state concerns it must be split), business logic in `shared/hooks/` (only in `features/<name>/hooks/`), returning JSX from hooks
- **Hook testing patterns** — `renderHook` + `act` + `waitFor`. State hook tests: all state transitions. Data hook tests: loading state (initially true), success state (data shape), error state (isError true). Wrap with the project's `QueryClientWrapper` test helper. Mock external services, never mock React internals

Quality bar: a code reviewer can evaluate any hook against the 8-rule contract in under 2 minutes.

---

## fe/DEPENDENCIES_WORKFLOW.md
**Purpose:** Dependency governance, feature development workflow, and code review contract. Prevents undiscussed dependencies and inconsistent PR quality.
Write "Not applicable" at top if no frontend layer exists.

Required sections:
- **Approved core libraries** — extracted from the actual `package.json`: one table row per library category (UI framework, routing, data fetching, form management, schema validation, global state, styling, component library, icons, HTTP client, date utilities, testing, E2E, API mocking, linting, formatting, bundler). Columns: Category | Library | Purpose | Version policy (locked major/minor/latest)
- **New dependency evaluation checklist** — every PR that adds a package must answer all six questions in the PR description:
  1. WHY — what problem does it solve that existing approved libraries cannot?
  2. BUNDLE — what is the minified + gzipped size impact? (rule: >50KB gzipped requires team approval)
  3. MAINTENANCE — last commit date, weekly downloads, open issues (rule: <10k weekly downloads or last commit >1 year = reject)
  4. SECURITY — `npm audit` result, known CVEs (rule: zero high/critical)
  5. TREE SHAKING — does it export ESM? (rule: CJS-only packages need explicit justification)
  6. ALTERNATIVE — is there an approved library that partially covers this? (rule: extend first, new package second)
- **Banned package patterns** — packages and patterns that are explicitly prohibited (with reason): full `lodash` import, `moment.js`, `jquery`, multiple CSS-in-JS solutions, multiple router libraries, multiple HTTP clients, multiple icon sets, `@types/*` packages that shadow existing types
- **Bundle size limits** — initial JS bundle, total initial load, per-route lazy chunk (extract from CI configuration or vite-bundle-reporter if present). Command to measure locally
- **Feature development workflow** — numbered steps: BRANCH (from main only, naming convention), PLAN (read relevant docs before coding), BUILD ORDER (types → service function → hook → component → styles → tests — always this sequence), SELF-REVIEW CHECKLIST (no hardcoded values, no inline styles, icons follow matrix, loading/empty/error states handled, RBAC guards present, TypeScript clean, no console.log, tests passing, PR <400 lines), PR (title format, body requirements, screenshots mandatory for UI changes, self-review checklist included)
- **Code review contract** — what reviewers check and in what order: architecture (patterns followed, shared code actually shared, new deps justified), design system (only tokens used, correct component from library, no re-implementations), security (RBAC on destructive actions, user input validated, no sensitive data in storage), quality (TypeScript complete, tests cover happy + error + loading + edge cases, no TODOs without ticket), performance (lists >50 items virtualized, memoization justified, route lazy-loaded). Review response protocol: `❌ Blocking:` must fix before merge; `💡 Suggestion:` optional improvement; `❓ Question:` needs clarification; `✅ Nice:` acknowledge good patterns

Quality bar: every PR has a complete PR description. A reviewer can process any PR against a written checklist without personal preference.

---

## UNIT_TESTING_COMPLETE.md
**Purpose:** Complete testing standards for both frontend and backend. The definitive reference for what to test, how to structure tests, and what coverage is required.

Required sections:
- **Coverage requirements table** — minimum branch and statement coverage per file type: utility functions (100%/100%), validation schemas (100%/100%), pure hooks/UI state (90%/95%), data fetching hooks (85%/90%), service functions (85%/90%), shared UI components (80%/85%), feature components (70%/80%), BE controllers (80%/85%), BE services (90%/95%), BE middleware (90%/95%), DB repository functions (80%/85%). Extract actual configured thresholds from `jest.config.*` or `vitest.config.*` if present; flag gaps where configured thresholds are lower than these targets
- **Standard test file structure** — every test file follows: outer `describe('[Unit Under Test]')` → `beforeEach(vi.clearAllMocks())` → `afterEach(cleanup())` → nested `describe('when [condition]')` → `it('should [verb] [result]')`. Show a real example from the codebase
- **Frontend test patterns** — four subsections with real examples:
  - *Utility function tests* — all branches (positive, negative, edge, invalid input), boundary values (0, max, max+1), error throwing
  - *Validation schema tests* — valid payload passes, every invalid field fails independently, normalisation (trim, lowercase) verified
  - *Component tests (complete coverage)* — initial render (all elements present, pre-fill behaviour), form validation (errors shown, submit blocked, errors cleared on correction), submission (correct payload, disabled during submit, spinner shown), loading state (all inputs disabled), accessibility (`axe` no violations, `aria-describedby` wired), RBAC/permission states (buttons present/absent per permission)
  - *RBAC/permission states* — `renderWithPermissions` wrapper, show and hide based on permissions
- **Backend test patterns** — four subsections with real examples:
  - *Service layer* — business rule enforcement, side effects called/not-called per path, non-critical side effect failure handled, password never exposed in return
  - *Controller/route integration* — unauthenticated (401), insufficient permissions (403), valid request (201 + correct body), conflict (409), validation failure (400), requestId in response meta
  - *Middleware tests* — no auth header, malformed scheme, valid token (user attached), expired token
  - *Repository tests* — real test DB with transaction-per-test, rolled back after; found/not-found/soft-deleted variants
- **Test data factories** — factory pattern using `faker`: `build` (in-memory object), `buildMany` (array), `create` (DB insert with optional transaction). Location: `test/factories/`. Example for a real entity from the codebase
- **API mocking with MSW** — handler file structure, success + pagination handlers, error handler overrides (`errorHandlers` map), usage pattern: `server.use(errorHandlers.xxx)` in `beforeEach`
- **Test naming rule** — `it should [verb] [what] [when/given condition]`. List 5 good examples and 5 bad examples. Rule: the test name must be a complete behaviour statement readable without the surrounding describe blocks
- **What NOT to test** — implementation details, third-party library internals, CSS classes or Tailwind classes, snapshot tests for logic-heavy components, private functions, TypeScript types/interfaces, trivial property getters, `console.log` calls unless the log is a required audit event

Quality bar: a failing test message tells you exactly what broke without reading the source code.

---

## be/MICRO_STANDARDS_BE.md
**Purpose:** The micro-contract for Controller, Service, and Repository layers. Eliminates layer confusion — every line of code belongs in exactly one place.
Write "Not applicable" at top if no backend layer exists.

Required sections:
- **Controller contract** — a controller has exactly 3 jobs: (1) parse and validate request input using the schema library, (2) call exactly one service method, (3) format and return the response. Nothing else. Show a ✅ correct thin controller and a ❌ wrong controller with business logic, both drawn from real patterns in this codebase
- **Service contract** — a service has exactly 4 jobs: (1) enforce all business rules, (2) orchestrate repository calls and other services, (3) own and manage transactions when multiple writes are needed, (4) throw specific typed errors for every failure case. Show a ✅ correct service method: business rule check, delegated data access, non-critical side effect with catch-and-log, sanitised DTO return (no password field)
- **Repository contract** — a repository has exactly 4 jobs: (1) execute SQL queries or ORM calls, (2) map DB rows to domain objects, (3) handle DB-specific errors (unique violation → ConflictError, no rows → return null), (4) absolutely no business logic. Show a ✅ correct repository method with row mapping and a unique-violation catch; show a ❌ wrong repository with conditional business logic
- **Error flow** — how typed errors bubble through layers: repository catches DB errors and throws typed application errors (ConflictError, NotFoundError) → service catches expected errors and rethrows, or lets unexpected ones bubble → global error middleware catches everything and maps to HTTP status + error envelope (cross-reference ERROR_HANDLING.md for the full taxonomy and status mapping)
- **Logging micro-rules** — what each layer logs and at what level:
  - *Controller*: logs nothing — request/response logging is handled by middleware
  - *Service*: `info` for major state transitions (user created, order placed); `warn` for non-critical failures (welcome email failed, cache miss); `error` for unexpected failures; NEVER logs PII (passwords, raw tokens, full card numbers, SSNs)
  - *Repository*: `debug` only for query timing (development/staging only); never logs query parameters that contain PII
- **Transaction ownership rule** — transactions are owned by the service layer only. Repository methods accept an optional transaction context parameter and use it when provided. Controllers never open, commit, or rollback transactions

Quality bar: a reviewer can determine which layer a piece of code belongs in within 5 seconds of reading it.

---

## Document update triggers

| Trigger event | Documents to regenerate |
|---|---|
| New dependency added / removed | `STACK.md`, `ONBOARDING.md` |
| Framework version major bump | `STACK.md`, `DECISIONS.md`, affected layer doc |
| Lint / formatter config changed | `STANDARDS.md` |
| Design token changed | `DESIGN_SYSTEM.md`, `UI_UX_STANDARDS.md` |
| Database schema migration | `DB_STANDARDS.md` |
| New API endpoint pattern introduced | `API_STANDARDS.md`, `BACKEND.md`, `PATTERNS.md` |
| New frontend component pattern | `FRONTEND.md`, `PATTERNS.md`, `DESIGN_SYSTEM.md` |
| New UX interaction pattern introduced | `UI_UX_STANDARDS.md`, `FRONTEND.md` |
| Auth / security model changed | `SECURITY.md`, `BACKEND.md` |
| New test approach adopted | `TESTING.md` |
| CI/CD pipeline changed | `DEPLOYMENT.md`, `WORKFLOWS.md` |
| New environment added | `DEPLOYMENT.md`, `ONBOARDING.md` |
| Significant folder restructure | `ARCHITECTURE.md`, `PATTERNS.md`, `STANDARDS.md` |
| New error handling pattern | `ERROR_HANDLING.md`, `BACKEND.md`, `UI_UX_STANDARDS.md` |
| Performance budget revised | `PERFORMANCE.md` |
| New major architectural decision | `DECISIONS.md`, `ARCHITECTURE.md` |
| New team member onboarding reveals gaps | `ONBOARDING.md`, `GLOSSARY.md` |
| Code review finds recurring pattern | `PATTERNS.md`, `RULES.md` |
