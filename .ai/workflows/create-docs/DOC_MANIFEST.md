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
- **Extension hierarchy** — one-paragraph summary of how the project extends (Base → Domain → Feature), with the actual base class names and file paths. Cross-reference EXTENSION_PATTERNS.md for full detail.
- **Non-cloud infrastructure** — document the actual self-hosted infrastructure used: database server, Redis (if present), SMTP server, file storage location, process supervisor, Nginx config location. Make explicit that no cloud provider SDK is used — all infrastructure access goes through project wrappers documented in EXTENSION_PATTERNS.md.
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

## LOCALISATION.md
**Purpose:** The single source of truth for how text and values are managed — locale file structure, enum catalog, and constants catalog. A developer adding any feature knows exactly where every string and every named value lives.
Write "Not applicable" at top only if the project has no user-facing text (rare).

> **Extraction rule:** Read `lang/`, `locales/`, `resources/lang/`, `i18n/`, or the equivalent locale directory for the project's backend language. Read the enum/constant directories (e.g. `app/Enums/`, `app/Constants/`, `src/enums/`, `src/constants/`) and `assets/js/constants/` for frontend constants. Document only what exists — flag gaps as missing items that must be created.

Required sections:

### 1 — No-hardcode contract
State the rule explicitly and cite the actual file locations found in this project:
- Backend: all user-facing strings in the locale directory; all magic values in the enum/constant modules
- Frontend: all user-facing strings in the frontend locale file (e.g. `assets/js/locales/en.json`); all magic values in `assets/js/constants/`
- The only permitted string literals in business logic are locale keys and constant references

### 2 — Backend locale file structure
Extract the actual locale directory path and list every file found. Example structure (adapt to the actual language/framework):
| File (relative to locale root) | Namespace prefix | Purpose | Example key |
|---|---|---|---|
| `en/messages{.ext}` | `messages.` | Success, info, status messages | `messages.record_created` |
| `en/errors{.ext}` | `errors.` | Error messages keyed by ErrorCode | `errors.not_found` |
| `en/validation{.ext}` | `validation.` | All field validation messages | `validation.required` |
| `en/ui{.ext}` | `ui.` | Button labels, column headers, page titles, breadcrumbs, empty states | `ui.button_save` |
| `en/emails{.ext}` | `emails.` | Email subjects and body paragraphs | `emails.welcome_subject` |
| `en/notifications{.ext}` | `notifications.` | Toast/notification messages | `notifications.save_success` |
| `en/{domain}{.ext}` | `{domain}.` | Entity-specific labels (status labels, field labels) | `orders.status_pending` |

Key naming rule: `snake_case` only. Format: `{namespace}.{key}`. Example: `ui.button_delete_user`.
Parameter substitution: use the framework's i18n interpolation mechanism — never string concatenation.

### 3 — Frontend locale file structure
- File path (e.g. `assets/js/locales/en.json`)
- Loading mechanism (loaded at page init, injected as global, or fetched from API)
- Access pattern (e.g. `Lang.get('ui.button_save')`)
- How frontend and backend locale files stay in sync (shared keys, build step, or manual)
- List of all top-level namespaces used in the JSON file

### 4 — Enum catalog
Every enum or constant module found in the project. For each:
| Enum / Module | File path (actual) | Values | Has `label()` equiv | Has `values()` equiv | DB column mapped |
|---|---|---|---|---|---|
| `UserStatus` | [actual path] | ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION | Yes → `users.status.{value}` | Yes | `users.status` |
| `UserRole` | [actual path] | [extract actual values] | Yes → `roles.{value}` | Yes | `roles.name` |
| `Permission` | [actual path] | [extract all `{resource}:{action}` values] | Yes → `permissions.{value}` | Yes | `permissions.name` |
| `ErrorCode` | [actual path] | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT, SERVER_ERROR | Yes → `errors.{value}` | Yes | — |
| `QueueName` | [actual path] | DEFAULT, EMAILS, REPORTS, EXPORTS | No | Yes | — |

**Enum locale label pattern:** every enum value maps to a locale key. Document the exact pattern used.
**Enum `options()` equivalent:** returns `[{ value, label }, ...]` for use in select/radio/checkbox lists. Document which enums implement this and how views use it.
**Missing enums** (flag columns found in DB that store a finite set but have no enum): list each as refactor debt.

### 5 — Constants catalog
Every constant module found in the project:
| Module | File path (actual) | Constants defined | Used in |
|---|---|---|---|
| `PaginationConst` | [actual path] | `DEFAULT_PER_PAGE = 25`, `MAX_PER_PAGE = 100` | All list endpoints |
| `CacheTtl` | [actual path] | `SHORT = 300`, `MEDIUM = 900`, `LONG = 3600`, `DAY = 86400` | All cache set calls |
| `CachePrefix` | [actual path] | `USER`, `STATS`, `CONFIG`, `PERMISSIONS` | All cache key builders |
| `StorageConst` | [actual path] | `UPLOAD_PATH`, `EXPORT_PATH`, `MAX_FILE_SIZE`, `ALLOWED_MIMES` | StorageService |
| `DateFormat` | [actual path] | `DISPLAY`, `API`, `DATETIME_DISPLAY`, `DATETIME_API` | All date rendering |
| `AuthConst` | [actual path] | `MAX_LOGIN_ATTEMPTS`, `LOCKOUT_MINUTES`, `PASSWORD_RESET_EXPIRY`, `SESSION_LIFETIME`, `BCRYPT_COST` | Auth system |
| `QueueTimeout` | [actual path] | `SHORT`, `MEDIUM`, `LONG`, `REPORT` | All job timeout definitions |

**Frontend constants catalog** (in `assets/js/constants/` or equivalent):
| Module | File | Key exports | Used in |
|---|---|---|---|
| `Status` | `Status.js` | Mirrors backend status enums | Conditional rendering |
| `Permission` | `Permission.js` | All `{resource}:{action}` strings | `window.authUser.permissions.includes()` |
| `Routes` | `Routes.js` | All named route patterns | `BaseAjax` calls, redirect logic |
| `Events` | `Events.js` | All custom JS event names | `addEventListener`, `dispatchEvent` |

### 6 — Missing items (refactor debt)
| Gap | Location found | Type | Required action |
|---|---|---|---|
| Hardcoded string `'active'` | `{actual file}:{line}` | Enum | Replace with `UserStatus.ACTIVE` |
| Hardcoded `25` in paginator | `{actual file}:{line}` | Constant | Replace with `PaginationConst.DEFAULT_PER_PAGE` |
| DB column `orders.status` has no enum | — | Missing enum | Create `OrderStatus` enum |

Quality bar: a developer adding a new status column or a new user-facing message has an exact location to place it and an exact pattern to follow — no guessing.

---

## DTO_STANDARDS.md
**Purpose:** The definitive contract for every request DTO, response DTO, and API envelope in the project. Every data crossing a layer boundary has a documented type and shape.
Write "Not applicable" at top only if the project has no API or inter-layer data transfer.

> **Extraction rule:** Scan the project's request/input schema directory (e.g. `app/Http/Requests/`, `src/requests/`, `app/schemas/`) and response DTO directory (e.g. `app/DTOs/`, `src/dtos/`, `app/Http/Resources/`). Read the base API controller's response builder methods. Extract the actual envelope shape from real response examples or from the response builder code.

Required sections:

### 1 — Layer boundary contract
State which typed object crosses which boundary (use actual class names from this project):
```
HTTP Request → [RequestDTO validates + casts] → Service
Service → [ResponseDTO / typed collection] → Controller
Controller → [Base API Controller response builder] → JSON Envelope
Repository → [Domain Entity / scalar] → Service
```

### 2 — Request DTO catalog
For every Request DTO found in the project:
| DTO | File path (actual) | Validates | Fields (name: type, required/optional) | Strips unknown fields |
|---|---|---|---|---|
| `CreateUserRequest` | [actual path] | Yes — at controller boundary | `name: string (req)`, `email: string (req)`, `role_id: int (req)`, `password: string (req)` | Yes |
| `UpdateOrderRequest` | [actual path] | Yes | `status: OrderStatus (req)`, `notes: string (opt)` | Yes |

For each DTO document:
- Validation rules per field (min/max length, regex, enum check, unique check)
- Casting rules (what type each field is cast to after validation)
- Whether partial update is supported (all fields optional vs at least one required)

### 3 — Response DTO catalog
For every Response DTO found:
| DTO | File path (actual) | Source model | Exposed fields | Hidden fields | Used by |
|---|---|---|---|---|---|
| `UserData` | [actual path] | `User` model | `id`, `name`, `email`, `role`, `status`, `created_at` | `password`, session tokens | `UserService` |
| `OrderSummary` | [actual path] | `Order` model | `id`, `reference`, `status`, `total`, `created_at` | internal audit cols | `OrderService` |

### 4 — API response envelope
The exact envelope shapes used in this project (with real method names from the base API controller):

**Success — single record:**
```json
{
  "success": true,
  "message": "User created successfully.",
  "data": { "id": 1, "name": "...", "email": "...", "role": "...", "status": "..." },
  "meta": null
}
```

**Success — paginated list:**
```json
{
  "success": true,
  "message": "Users retrieved.",
  "data": [ {"...": "..."}, {"...": "..."} ],
  "meta": {
    "current_page": 1,
    "per_page": 25,
    "total": 142,
    "total_pages": 6,
    "has_next": true,
    "has_prev": false,
    "from": 1,
    "to": 25
  }
}
```

**Error — validation:**
```json
{
  "success": false,
  "message": "The provided data is invalid.",
  "data": null,
  "errors": { "email": ["The email field is required."], "role_id": ["Invalid role."] },
  "code": "VALIDATION_FAILED",
  "meta": null
}
```

**Error — business / auth:**
```json
{
  "success": false,
  "message": "You do not have permission to perform this action.",
  "data": null,
  "errors": null,
  "code": "FORBIDDEN",
  "meta": null
}
```

Document: which base controller method produces each shape and its exact method signature.

### 5 — Web (non-API) response patterns
- Redirect after create/update/delete with flash message: use the framework's redirect + flash mechanism with a locale key — never a hardcoded string.
- View data pattern: pass a typed collection of DTOs or named scalar values — never raw ORM model instances.
- Error display: use the framework's standard validation error rendering — never manually built error structures in a controller.
- Document which pages are API-driven (JS fetches data) vs server-rendered (data passed to view at render time).

### 6 — Pagination standards
- Default page size: `PaginationConst.DEFAULT_PER_PAGE`
- Max page size: `PaginationConst.MAX_PER_PAGE` (requests above this are silently capped)
- Pagination type: offset (standard) or cursor (large/real-time datasets) — document which endpoints use which
- Cursor pagination endpoints: list each with the cursor field name and sort order

### 7 — Missing or inconsistent DTOs (refactor debt)
| Gap | Location (actual file:line) | Issue | Required action |
|---|---|---|---|
| Raw request body passed to service | `{actual file}:{line}` | Unvalidated input crossing boundary | Create Request DTO |
| Service returns raw ORM model | `{actual file}:{line}` | Raw model crossing boundary | Wrap in Response DTO |
| Response uses ad-hoc structure | `{actual file}:{line}` | Non-standard envelope | Route through base controller response builder |

Quality bar: a developer adding a new endpoint has an exact pattern to follow for the request, the service return type, and the response shape — no design decisions needed.

---

## RBAC.md
**Purpose:** The complete authority on authentication and role-based access control in this project. Roles, permissions, guard placement, RBAC data model, and frontend integration — all in one document.
Write "Not applicable" at top only if the project has no authentication.

> **Extraction rule:** Read the User model/class (permission check method), authentication middleware, the `UserRole` and `Permission` enum/constant modules, and the role-permission seed script/fixture (path varies by language — e.g. `database/seeders/`, `src/seeds/`, `db/seeds/`, `fixtures/`). Extract the actual roles and permissions from the seeder and enum — document real values.

Required sections:

### 1 — Authentication mechanism
- Driver: session-based (web) / token-based (API) / both (document each surface)
- Session store: Redis / database / file (document the configured driver and why)
- Token type and storage: Bearer token, hashed in the tokens table (document actual table name)
- CSRF: middleware name and which route groups it applies to
- Rate limiting: middleware name, `AuthConst.MAX_LOGIN_ATTEMPTS`, `AuthConst.LOCKOUT_MINUTES`
- Password policy: minimum length (`AuthConst.PASSWORD_MIN_LENGTH`), hashing algorithm and cost (`AuthConst.BCRYPT_COST`)
- Session lifetime: `AuthConst.SESSION_LIFETIME`

### 2 — Role definitions
Extract every role from the `UserRole` enum/constant and the roles seed script:
| Role (enum value) | Display name (locale key) | Description | Default for new users |
|---|---|---|---|
| `SUPER_ADMIN` | `roles.super_admin` | Full system access, bypasses permission checks | No |
| `ADMIN` | `roles.admin` | Manages users and settings | No |
| `MANAGER` | `roles.manager` | Manages team records | No |
| `USER` | `roles.user` | Standard access | Yes |

Super-admin bypass rule: document whether SUPER_ADMIN bypasses the permission check entirely, and where in the user model/service this is implemented.
Multi-role support: document whether a user can have multiple roles simultaneously and how conflicts are resolved (most-permissive wins).

### 3 — Permission catalog
Extract every permission from the `Permission` constant/enum and the seed script:
| Permission | Resource | Action | Roles that have it |
|---|---|---|---|
| `user:create` | user | create | SUPER_ADMIN, ADMIN |
| `user:read` | user | read | SUPER_ADMIN, ADMIN, MANAGER |
| `user:update` | user | update | SUPER_ADMIN, ADMIN |
| `user:delete` | user | delete | SUPER_ADMIN, ADMIN |
| `report:export` | report | export | SUPER_ADMIN, ADMIN, MANAGER |
| `settings:manage` | settings | manage | SUPER_ADMIN |

Permission naming rule: always `{resource}:{action}`. Document any exceptions and why.
Locale key for each permission: `permissions.{resource}_{action}` — used in the permission management UI.

### 4 — Role → permission mapping source of truth
- File: document the exact path to the role-permission seed script in this project
- How to add a new permission: step-by-step (enum → locale → seed script → middleware/policy → view)
- How to add a new role: step-by-step (enum → seed script → assign permissions in seed → document here)
- How the seed is run (fresh install vs incremental migration)

### 5 — Guard placement
Three layers — document each with actual file paths from this project:

**Route middleware:**
| Middleware | File path (actual) | Checks | Applied to |
|---|---|---|---|
| `Authenticate` | [actual path] | Is user logged in? | All authenticated routes |
| `CheckPermission` | [actual path] | Does user's role have this permission? | Individual routes or route groups |

Document the exact route middleware registration pattern used in this project.

**Service layer (ownership checks):**
Document each service method that performs an ownership or data-scope check:
| Service method | Check performed (pseudocode) | Exception thrown on failure |
|---|---|---|
| `UserService.update(id, dto, actor)` | `record.owner_id === actor.id OR actor.can(Permission.ADMIN_ACCESS)` | `AuthorisationException` |
| `ReportService.export(id, actor)` | `report.created_by === actor.id OR actor.can(Permission.REPORT_EXPORT)` | `AuthorisationException` |

**View / frontend layer:**
- Backend template guard syntax used: document the actual template syntax for this project's view layer (e.g. `@can(...)`, `{% if user.can(...) %}`, `<% if permission? %>`)
- Frontend check pattern: `window.authUser.permissions.includes(Permission.USER_CREATE)`
- `window.authUser` injection: which middleware or base controller action injects it, what fields it contains
- DOM removal vs CSS hide rule: document that elements must be removed from DOM (not just hidden) for restricted actions

### 6 — Permission check implementation
- File path of the user model/class that implements the permission check method
- How the check resolves: from eager-loaded permissions, from cache, or from DB query
- Cache key pattern for user permissions: e.g. `auth.perms:{userId}`
- Cache TTL: `CacheTtl.MEDIUM`
- Where cache is invalidated: when role is changed (document the exact service method that invalidates)
- Super-admin bypass: document exactly where the super-admin shortcut check lives in the codebase

### 7 — Audit log
- Table: `audit_logs` (or equivalent — document exact table name and schema)
- What is logged: `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `PASSWORD_CHANGED`, `ROLE_CHANGED`, `PERMISSION_GRANTED`, `PERMISSION_REVOKED` (from `AuditAction` enum/constant)
- Schema: `id`, `user_id`, `action` (AuditAction value), `ip_address`, `user_agent`, `meta` (JSON), `created_at`
- Who writes to it: the `Auditable` mixin/trait on the User model + explicit calls in the auth service
- Retention policy: how long audit logs are kept before archival/deletion (from config)

### 8 — RBAC data schema
Tables used (with actual column names from the project's migration files):
| Table | Columns | Notes |
|---|---|---|
| `roles` | `id`, `name` (UserRole value), `display_name` (locale key), `description`, `created_at`, `updated_at` | — |
| `permissions` | `id`, `name` (Permission value), `display_name` (locale key), `group` (resource name), `created_at` | — |
| `role_permissions` | `role_id`, `permission_id` | Pivot — seeded by role-permission seed script |
| `user_roles` | `user_id`, `role_id`, `assigned_by`, `assigned_at` | Pivot — allows multi-role |

### 9 — Security checklist (auto-verified by ReviewDev)
Every PR touching auth or RBAC is checked against these items:
- [ ] No raw role string comparison (`=== 'admin'`) — uses `UserRole` enum/constant
- [ ] No raw permission string as a literal — uses `Permission` constant
- [ ] Route middleware applied to all new protected routes
- [ ] Ownership check present in service layer for resource-scoped operations
- [ ] New action button conditionally rendered via permission check (not always visible)
- [ ] New permission added to `Permission` constant, locale file, and seed script
- [ ] Audit log entry for any new authentication or role-change event
- [ ] Permission check resolved from cache (not a DB query per call)

Quality bar: a security reviewer can audit the entire RBAC system by reading this document. Adding a new role or permission has an unambiguous step-by-step procedure that requires no architectural decisions.

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
**Purpose:** Security requirements for application code AND self-hosted server. Every rule here is a blocker in code review.

Required sections:
- **Authentication** — mechanism (JWT, session, OAuth, API key), token storage rule (httpOnly cookie vs localStorage — never localStorage for sensitive tokens), expiry policy; cross-reference RBAC.md for full implementation
- **Authorisation** — RBAC/ABAC model, where permission checks happen (middleware, service, or both), which middleware enforces it; cross-reference RBAC.md for guard placement
- **Input validation** — where validation happens (controller boundary, Request DTO), library used, rule against trusting client-supplied IDs without ownership check
- **Output encoding** — XSS prevention (template auto-escaping rule, raw HTML injection rule), Content-Security-Policy header, content-type headers
- **HTTP security headers** — exact headers configured in Nginx (document each):
  - `Strict-Transport-Security` (HSTS): max-age, includeSubDomains
  - `X-Frame-Options: DENY` (clickjacking prevention)
  - `X-Content-Type-Options: nosniff`
  - `Referrer-Policy: strict-origin-when-cross-origin`
  - `Content-Security-Policy`: script-src, style-src, img-src, frame-src rules
  - `Permissions-Policy`: camera, microphone, geolocation
- **Secrets management** — where secrets live (.env file on server, never in git), how loaded, .env file permissions (640 — never 777), who has access to production .env, rotation procedure
- **Server security** — self-hosted server hardening:
  - SSH: key-only authentication (PasswordAuthentication no), no root SSH login, SSH on non-default port (optional)
  - Firewall: only ports 22, 80, 443 open; database and Redis ports blocked from internet
  - OS: automatic security updates enabled or documented manual update schedule
  - Database: app user has minimum privileges (SELECT/INSERT/UPDATE/DELETE on app tables only — no GRANT, no DROP, no access to other databases)
  - File permissions: app files owned by deploy user, not writable by web server process
- **CORS** — allowed origins (exact list), allowed methods, allowed headers, credentials flag — with real Nginx or application config
- **Rate limiting** — implemented at Nginx level and/or application level: exact limits per endpoint type (auth endpoints stricter)
- **Dependency hygiene** — audit process, update policy, how to handle critical CVEs
- **Known risks** — any known vulnerabilities, TODOs, or areas that need security attention (name them — do not sanitise)

Quality bar: a security reviewer can audit both the application code and the server configuration using this document as a checklist.

---

## DESIGN_SYSTEM.md
**Purpose:** The complete visual language for this project — every token, pattern, and component contract a developer needs to build UI that is instantly consistent with the rest of the product.
Write "Not applicable" at top if no frontend layer exists.

> **Extraction rule:** Read the actual config files — `tailwind.config.*`, `globals.css`, `tokens.css`, or `theme.ts`. Do not describe the library — describe this project's implementation.
> Real values only. Never write "uses Tailwind defaults" — write the actual names and values found.
>
> **CSS variable architecture rule (document this first, enforce everywhere):**
> All design values live as CSS custom properties in exactly one token file (e.g. `src/styles/tokens.css` or `:root` in `globals.css`). Components reference `var(--token-name)` — never raw hex, px, rem, or arbitrary values. Tailwind config (if used) reads from the same CSS variables. This guarantees a single source of truth: changing one variable updates the entire product. No inline `style={{}}` for design values; no page-specific overrides; no duplicated values.

Required sections:

### 1 — Token file and CSS variable architecture
- Exact file path where all raw token values are declared (the only place raw values may appear)
- How the token file is structured: scale tokens (raw values) → semantic aliases (purpose-named references to scale tokens)
- Example structure:
  - Scale: `--color-blue-500: #3b82f6` — raw value, named after position in the scale
  - Semantic: `--color-interactive: var(--color-blue-500)` — named after purpose, references the scale
  - Component: `--button-bg: var(--color-interactive)` — computed per component, references semantic alias
- Rule: components use semantic or component tokens; scale tokens are internal to the token file

### 2 — Colour system
Extract the full palette from the actual config. Format as two tables:

**Scale palette** (raw colour values):
| Token | Value | Scale position |
|---|---|---|
| `--color-blue-500` | `#3b82f6` | Mid-blue |

**Semantic colour aliases** (purpose-named — these are what components use):
| Token | References | Purpose |
|---|---|---|
| `--color-primary` | `var(--color-blue-500)` | Primary CTAs, focus rings, active states |
| `--color-primary-hover` | `var(--color-blue-600)` | Hover state for primary interactive elements |
| `--color-destructive` | `var(--color-red-500)` | Delete actions, critical error states |
| `--color-surface` | `var(--color-white)` | Page and card background |
| `--color-surface-raised` | `var(--color-neutral-50)` | Panels, sidebars, input backgrounds |
| `--color-surface-overlay` | `var(--color-neutral-100)` | Dropdown backgrounds, hover rows |
| `--color-border` | `var(--color-neutral-200)` | Default borders for inputs, cards, dividers |
| `--color-border-focus` | `var(--color-primary)` | Focus ring on interactive elements |
| `--color-text-primary` | `var(--color-neutral-900)` | Body text, headings |
| `--color-text-secondary` | `var(--color-neutral-500)` | Help text, placeholders, secondary labels |
| `--color-text-disabled` | `var(--color-neutral-400)` | Disabled field text |
| `--color-text-on-primary` | `var(--color-white)` | Text on primary-coloured surfaces |
| `--color-success` | `var(--color-green-500)` | Success states, positive feedback |
| `--color-warning` | `var(--color-amber-500)` | Warning states |
| `--color-error` | `var(--color-red-500)` | Field validation errors, error banners |
| `--color-info` | `var(--color-blue-400)` | Informational banners, tooltips |

Dark mode: document yes/no, toggle mechanism (`.dark` class / `data-theme="dark"` / `prefers-color-scheme`), which tokens change (semantic aliases only — scale tokens never change). Rule: components must use semantic aliases, never scale tokens, so that dark mode works by flipping one set of `:root[data-theme="dark"]` values.

### 3 — Typography system
Extract every font token from the actual config. Format as tables.

**Type scale:**
| Token | Size | Line height | Weight | Letter spacing | Usage |
|---|---|---|---|---|---|
| `--text-display` | 2.25rem | 2.5rem | 700 | -0.02em | Hero headings |
| `--text-h1` | 1.875rem | 2.25rem | 700 | -0.01em | Page titles |
| `--text-h2` | 1.5rem | 2rem | 600 | 0 | Section headings |
| `--text-h3` | 1.25rem | 1.75rem | 600 | 0 | Card headings, subheadings |
| `--text-h4` | 1.125rem | 1.5rem | 600 | 0 | Minor headings |
| `--text-body-lg` | 1rem | 1.75rem | 400 | 0 | Body large |
| `--text-body` | 0.875rem | 1.5rem | 400 | 0 | Default body text |
| `--text-body-sm` | 0.8125rem | 1.25rem | 400 | 0 | Secondary body |
| `--text-caption` | 0.75rem | 1rem | 400 | 0.01em | Captions, timestamps |
| `--text-label` | 0.75rem | 1rem | 500 | 0.05em | Form labels, table headers |
| `--text-button-sm` | 0.75rem | 1rem | 500 | 0.02em | Small button |
| `--text-button` | 0.875rem | 1.25rem | 500 | 0.01em | Default button |
| `--text-button-lg` | 1rem | 1.5rem | 500 | 0 | Large button |

**Font families:**
| Token | Value | Fallback | Loaded via |
|---|---|---|---|
| `--font-sans` | e.g. `'Inter'` | `system-ui, sans-serif` | next/font / Google Fonts / local |
| `--font-mono` | e.g. `'JetBrains Mono'` | `monospace` | next/font / Google Fonts / local |

Rule: never use `font-size`, `font-weight`, or `line-height` raw values in components. Always apply a named type token.

### 4 — Spacing scale
Extract the spacing scale from config. 4px base grid.
| Token | Value | Typical usage |
|---|---|---|
| `--space-1` | 0.25rem (4px) | Icon padding, tight gaps |
| `--space-2` | 0.5rem (8px) | Badge padding, inline gaps |
| `--space-3` | 0.75rem (12px) | Button horizontal padding (sm) |
| `--space-4` | 1rem (16px) | Card internal padding (compact), input padding |
| `--space-5` | 1.25rem (20px) | Button horizontal padding (default) |
| `--space-6` | 1.5rem (24px) | Card internal padding (default), form field gap |
| `--space-8` | 2rem (32px) | Section internal spacing |
| `--space-10` | 2.5rem (40px) | Section gap, modal padding |
| `--space-12` | 3rem (48px) | Page vertical section spacing |
| `--space-16` | 4rem (64px) | Page-level gaps, hero padding |

Rule: all spacing in components uses these tokens. No raw px or rem values in components.

### 5 — Border radius scale
| Token | Value | Used for |
|---|---|---|
| `--radius-none` | 0 | Sharp cards (explicit design choice) |
| `--radius-sm` | 0.125rem | Subtle rounding — badges, tags |
| `--radius-md` | 0.375rem | Inputs, buttons, select boxes |
| `--radius-lg` | 0.5rem | Cards, panels, dropdowns |
| `--radius-xl` | 0.75rem | Modals, drawers, large containers |
| `--radius-2xl` | 1rem | Featured cards, hero sections |
| `--radius-full` | 9999px | Avatars, pills, circular buttons |

### 6 — Shadow and elevation scale
| Token | Value | Semantic meaning | Used for |
|---|---|---|---|
| `--shadow-none` | none | Flat (no elevation) | Borderless flat panels |
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.05)` | Barely raised | Input fields, flat buttons |
| `--shadow-sm` | `0 1px 3px rgba(0,0,0,0.1)` | Level 1 elevation | Cards, default panels |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Level 2 elevation | Dropdowns, popovers |
| `--shadow-lg` | `0 10px 15px rgba(0,0,0,0.1)` | Level 3 elevation | Modals, command palettes |
| `--shadow-xl` | `0 20px 25px rgba(0,0,0,0.1)` | Level 4 elevation | Full-screen overlays, drawers |
| `--shadow-inner` | `inset 0 2px 4px rgba(0,0,0,0.06)` | Inset | Pressed buttons, active input wells |

**Z-index scale:**
| Token | Value | Layer |
|---|---|---|
| `--z-base` | 0 | Normal flow content |
| `--z-raised` | 10 | Sticky table headers, floating action buttons |
| `--z-sticky` | 20 | Sticky page header/nav bar |
| `--z-dropdown` | 100 | Select menus, comboboxes, datepicker popover |
| `--z-overlay` | 200 | Modal/drawer backdrop |
| `--z-modal` | 300 | Modals, drawers, side panels |
| `--z-toast` | 400 | Toast notifications |
| `--z-tooltip` | 500 | Tooltips |

### 7 — Animation and motion tokens
| Token | Value | Used for |
|---|---|---|
| `--duration-fast` | 100ms | Hover state colour change |
| `--duration-base` | 150ms | Button press, focus ring appear |
| `--duration-moderate` | 200ms | Dropdown open, accordion expand |
| `--duration-slow` | 300ms | Modal appear, drawer slide in |
| `--duration-slower` | 400ms | Page transitions |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Standard ease (Material ease-in-out) |
| `--ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Elements leaving the screen |
| `--ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | Elements entering the screen |
| `--ease-spring` | `cubic-bezier(0.34, 1.56, 0.64, 1)` | Playful pop (use sparingly) |

Hard rule: every CSS transition must be wrapped in `@media (prefers-reduced-motion: no-preference)` or use the Tailwind `motion-safe:` prefix. Reduced-motion fallback is instant (no transition).

### 8 — Form system
Forms are the most common UI surface. Every form element uses tokens — no page-specific overrides.

**Text inputs (input, textarea):**
| Token | Value | Purpose |
|---|---|---|
| `--input-height-sm` | 2rem (32px) | Small input height |
| `--input-height-md` | 2.5rem (40px) | Default input height |
| `--input-height-lg` | 3rem (48px) | Large input height |
| `--input-padding-x` | var(--space-3) | Horizontal inner padding |
| `--input-bg` | var(--color-surface) | Default background |
| `--input-bg-disabled` | var(--color-surface-raised) | Disabled background |
| `--input-border` | var(--color-border) | Default border colour |
| `--input-border-focus` | var(--color-border-focus) | Focus border colour |
| `--input-border-error` | var(--color-error) | Error state border |
| `--input-radius` | var(--radius-md) | Corner radius |
| `--input-shadow` | var(--shadow-xs) | Default shadow |
| `--input-shadow-focus` | `0 0 0 3px rgba(var(--color-primary-rgb), 0.2)` | Focus ring (accessible, 3px offset) |
| `--input-text` | var(--color-text-primary) | Input value text |
| `--input-placeholder` | var(--color-text-secondary) | Placeholder text |
| `--input-text-disabled` | var(--color-text-disabled) | Disabled value text |

Textarea: inherits all input tokens; `--textarea-min-height: 6rem`; vertical resize only.

**Label, help text, error text:**
| Element | Token used | Position rule |
|---|---|---|
| Label | `--text-label`, `--color-text-primary` | Above the field, always visible (never placeholder-only) |
| Required asterisk | `--color-error` | After the label text |
| Help text | `--text-body-sm`, `--color-text-secondary` | Below field, before error |
| Error text | `--text-body-sm`, `--color-error` | Below help text (replaces it when visible) |
| Error icon | error icon size from icon matrix | Left of error text |

Field vertical stack gap: `--form-field-gap: var(--space-1)` between label→input, `var(--space-1)` between input→help/error; `--form-section-gap: var(--space-6)` between fields.

**Select / Combobox / Dropdown:**
- Same height, border, radius, focus ring tokens as text input
- Dropdown panel: `--shadow-md`, `--radius-lg`, `--z-dropdown`, `--color-surface` background
- Dropdown item height: `--input-height-sm`; item padding: `var(--space-2) var(--space-3)`
- Selected item: `--color-primary` text or checkmark icon; hover item: `--color-surface-overlay` background

**Checkbox and Radio:**
| Token | Value | Purpose |
|---|---|---|
| `--checkbox-size` | 1rem (16px) | Control width/height |
| `--checkbox-border` | var(--color-border) | Unchecked border |
| `--checkbox-bg-checked` | var(--color-primary) | Checked background |
| `--checkbox-border-checked` | var(--color-primary) | Checked border |
| `--checkbox-radius` | var(--radius-sm) | Checkbox corner radius |
| `--radio-radius` | var(--radius-full) | Radio is always round |
| `--checkbox-focus-ring` | var(--input-shadow-focus) | Focus ring matches input |
Gap between checkbox/radio and its label: `var(--space-2)`. Stacked group gap: `var(--space-3)`.

**Toggle / Switch:**
| Token | Value |
|---|---|
| `--toggle-width` | 2.25rem (36px) |
| `--toggle-height` | 1.25rem (20px) |
| `--toggle-bg-off` | var(--color-border) |
| `--toggle-bg-on` | var(--color-primary) |
| `--toggle-thumb-size` | 1rem (16px) |
| `--toggle-thumb-bg` | var(--color-white) |
Transition: thumb slides using `--duration-base` `--ease-out`.

**Color picker:**
- Swatch size: 1.5rem × 1.5rem (24px), `--radius-sm`, `--shadow-xs`
- Active swatch: `--shadow-md` + `--input-shadow-focus` ring
- Hex input: standard text input tokens, monospace font (`--font-mono`)
- Popover panel: same as dropdown panel tokens (`--shadow-md`, `--radius-lg`, `--z-dropdown`)
- Rule: the color picker component is the only place where arbitrary hex values may appear as user data — they are data values (from user input), not design tokens

**Form layout — bordered vs borderless:**
Document two supported form surface variants:
- *Bordered*: inputs show `--input-border` at all times; cards/panels show `--color-border` outline
- *Borderless flat*: inputs have `--input-bg: var(--color-surface-raised)`, `border: none`, rely on background contrast; used inside panels that already have a border context
Rule: choose one variant per form section and apply consistently — never mix within a single form.

**Submit and form-level error state:**
- Submit button: disabled state until form is valid (or always enabled — document the project's choice)
- Form-level error banner: `--color-error` background tint, error icon, dismissible; appears above the form fields
- API error mapping: 400 → field-level errors; 422 → field-level errors; 500 → form-level banner

### 9 — Panel and card system
Panels are the structural building blocks of every page surface.

**Panel variants (document all that exist in this project):**
| Variant | Border | Shadow | Background | Radius | Use case |
|---|---|---|---|---|---|
| Default card | `--color-border` 1px | `--shadow-sm` | `--color-surface` | `--radius-lg` | Standard content containers |
| Flat panel | none | `--shadow-none` | `--color-surface-raised` | `--radius-lg` | Sidebar, filter panel, dense UI |
| Raised card | `--color-border` 1px | `--shadow-md` | `--color-surface` | `--radius-lg` | Featured content, selected state |
| Outlined panel | `--color-border` 1px | `--shadow-none` | transparent | `--radius-lg` | Inline info blocks, code blocks |
| Ghost card | none | `--shadow-none` | transparent | `--radius-lg` | Hover-only surface (table rows) |

**Panel token set:**
| Token | Value | Purpose |
|---|---|---|
| `--panel-padding` | var(--space-6) | Default internal padding |
| `--panel-padding-compact` | var(--space-4) | Compact mode (dense tables, sidebars) |
| `--panel-padding-lg` | var(--space-8) | Large/featured cards |
| `--panel-header-padding` | var(--space-4) var(--space-6) | Card header section |
| `--panel-footer-padding` | var(--space-4) var(--space-6) | Card footer section |
| `--panel-gap` | var(--space-4) | Gap between adjacent panels |
| `--panel-section-gap` | var(--space-6) | Gap between sections inside a panel |

**Panel anatomy rules:**
- Card header: title (using `--text-h3`), optional subtitle (`--text-body-sm`, `--color-text-secondary`), optional actions (right-aligned)
- Card body: main content area; scrollable only if explicitly needed (document which panels scroll)
- Card footer: secondary actions, pagination, totals; always separated by `--color-border` top border
- Dividers inside panels use `--color-border`, 1px, `var(--space-6)` margin top/bottom

### 10 — Page layout system
Document the project's actual page structure using tokens. A theme-level layout must be defined here so all pages are structurally consistent.

**Layout structure:**
```
Page root
├── Header (fixed / sticky)
├── Body
│   ├── Sidebar (left / right — collapsible)
│   └── Content area
│       ├── Page header (title + breadcrumb + actions)
│       ├── Content (panels, tables, forms)
│       └── Page footer (pagination, submit, secondary nav)
└── Footer (global, optional)
```

**Layout tokens:**
| Token | Value | Purpose |
|---|---|---|
| `--header-height` | 3.5rem (56px) | Fixed top navigation bar height |
| `--header-bg` | var(--color-surface) | Header background |
| `--header-border` | var(--color-border) | Header bottom border |
| `--header-shadow` | var(--shadow-sm) | Header elevation |
| `--header-z` | var(--z-sticky) | Header stacking |
| `--sidebar-width` | 15rem (240px) | Expanded sidebar width |
| `--sidebar-width-collapsed` | 3.5rem (56px) | Icon-only collapsed width |
| `--sidebar-bg` | var(--color-surface) | Sidebar background |
| `--sidebar-border` | var(--color-border) | Sidebar right border |
| `--sidebar-z` | var(--z-sticky) | Sidebar stacking |
| `--content-max-width` | 72rem (1152px) | Maximum content area width |
| `--content-padding-x` | var(--space-8) | Content horizontal padding |
| `--content-padding-y` | var(--space-6) | Content vertical padding |
| `--footer-height` | 3rem (48px) | Global footer height |
| `--footer-bg` | var(--color-surface-raised) | Footer background |
| `--footer-border` | var(--color-border) | Footer top border |
| `--page-header-gap` | var(--space-6) | Page header → content gap |

**Responsive layout behaviour:**
| Breakpoint | Sidebar | Content padding | Header |
|---|---|---|---|
| `< sm` (< 640px) | Hidden, hamburger menu opens drawer | `--space-4` | Height unchanged |
| `sm–lg` (640–1024px) | Collapsed (icon-only) | `--space-6` | Height unchanged |
| `> lg` (> 1024px) | Fully expanded with labels | `--space-8` | Height unchanged |

**Grid system:**
- Column count: 12 columns
- Gutter: `var(--space-6)` between columns
- Container max-width: `--content-max-width`
- Breakpoints: `sm: 640px`, `md: 768px`, `lg: 1024px`, `xl: 1280px`, `2xl: 1536px`
- Common layouts: 1-col (mobile), 2-col (tablet), 3-col (desktop), 4-col (dashboard grid)
- Page-level layout pattern used: document whether CSS Grid, Flexbox, or both are used and in which contexts

**Header anatomy:**
- Left: logo / app name, then navigation links or breadcrumbs
- Centre: global search (if present)
- Right: notifications icon, user avatar + menu, optional CTA button
- All items spaced using `--space-4`; icon sizes follow the icon size matrix

**Footer anatomy (global footer, if present):**
- Left: copyright text (`--text-caption`, `--color-text-secondary`)
- Right: legal links, version number
- Full-width, separated from content by `--color-border` top border

**Page header anatomy (inside content area, per-page):**
- Row 1: breadcrumb navigation (`--text-body-sm`, `--color-text-secondary`)
- Row 2: page title (`--text-h1`) + page-level action buttons (right-aligned)
- Row 3 (optional): tabs, filters, or secondary navigation
- Gap below page header to first content panel: `--page-header-gap`

### 11 — Component library
Which library is in use (shadcn/ui, MUI, Chakra, Radix, Ant Design, or custom). For each major component, document:
| Component | Source file | Variants | Tokens used | Usage note |
|---|---|---|---|---|
| Button | `components/ui/button.tsx` | primary, secondary, destructive, outline, ghost, link | `--color-primary`, `--radius-md`, text button tokens | Primary CTA = primary; destructive = destructive |
| Input | `components/ui/input.tsx` | default, error, disabled | All `--input-*` tokens | Always wrapped in FormField |
| Textarea | `components/ui/textarea.tsx` | default, error, disabled | All `--input-*` + `--textarea-min-height` | Vertical resize only |
| Select | `components/ui/select.tsx` | default, error, disabled | `--input-*`, `--z-dropdown`, `--shadow-md` | — |
| Checkbox | `components/ui/checkbox.tsx` | default, checked, indeterminate, disabled | All `--checkbox-*` tokens | — |
| Radio | `components/ui/radio.tsx` | default, selected, disabled | All `--checkbox-*` tokens | — |
| Toggle | `components/ui/toggle.tsx` | off, on, disabled | All `--toggle-*` tokens | — |
| ColorPicker | `components/ui/color-picker.tsx` | — | `--input-*`, swatch tokens, `--z-dropdown` | Only place user-data hex values appear |
| Card | `components/ui/card.tsx` | default, flat, raised, outlined, ghost | All `--panel-*` tokens | — |
| Dialog | `components/ui/dialog.tsx` | — | `--z-modal`, `--z-overlay`, `--shadow-lg`, `--radius-xl` | Never `window.confirm` |
| Drawer | `components/ui/drawer.tsx` | left, right, bottom | `--z-modal`, `--sidebar-width`, `--shadow-xl` | — |
| Badge | `components/ui/badge.tsx` | default, secondary, destructive, outline | `--radius-full`, `--text-label` | Status only |
| Alert | `components/ui/alert.tsx` | info, success, warning, error | semantic colour tokens | — |
| Toast | `components/ui/toast.tsx` | success, error, warning, info | `--z-toast`, semantic colour tokens | 3s auto-dismiss |
| Tooltip | `components/ui/tooltip.tsx` | — | `--z-tooltip`, `--shadow-md`, `--text-caption` | — |
| Popover | `components/ui/popover.tsx` | — | `--z-dropdown`, `--shadow-md`, `--radius-lg` | — |
| Skeleton | `components/ui/skeleton.tsx` | — | `--color-surface-raised` animated | Match shape of real content |
| Avatar | `components/ui/avatar.tsx` | sm, md, lg | `--radius-full`, size from spacing scale | — |

### 12 — Icons
Library used (Lucide, Heroicons, Phosphor, etc.). Import pattern. Size rule: sizes come exclusively from the icon size matrix in `fe/STYLING_MICRO_STANDARDS.md`. Colour rule: inherit from surrounding text colour via `currentColor` — never hardcode icon colour. How to add a new icon (import from approved library, name the usage context, add to icon size matrix if a new context).

### 13 — Expanding the design system
**Adding a new token:** add to the token file (scale entry if new raw value; semantic alias if new purpose). Reference in `DESIGN_SYSTEM.md` token table. Never add a raw value directly to a component.

**Adding a new component:** create in `components/ui/`, name matching kebab-case convention, consume only existing tokens (add tokens first if needed), document in the component library table above, decide whether a Storybook story is required (yes if the component has variants or interactive states).

**Adding a new page layout:** use existing layout tokens. If a new structural token is needed (e.g. `--right-panel-width`), add to the Layout tokens table first. Never hardcode the value inline.

**Expandability principle:** the token system is the extension point — not individual component files. New features inherit the existing visual language by consuming tokens. Changing one token cascades correctly because no raw values exist outside the token file.

Quality bar: a developer can build any new page, form, or component — and a QA engineer can verify visual consistency — using only this document. Zero design decisions need to be made during implementation.

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
**Purpose:** How the system gets to production — and back if something goes wrong. Self-hosted deploy process included.

Required sections:
- **Environments** — all named environments (local, staging, prod) and what differs between them: config, credentials, feature flags, log levels
- **CI/CD pipeline** — stages in order (lint → test → build → deploy), what each does, what triggers each stage (push to main, tag, manual)
- **Build process** — how the app is built per environment, build-time variables, output artefacts
- **Secrets in CI** — which secrets are stored in CI (SSH key, env file), where configured, how to rotate
- **Self-hosted deploy process** — exact steps to deploy to the server (not cloud):
  - Method: git pull on server / rsync from CI / deploy script (document which)
  - Steps: pull code → install dependencies → run migrations → clear cache → restart app server
  - Who runs it: CI/CD automation or human (document)
  - Deploy user: which OS user runs the deploy, what permissions they have
- **Zero-downtime deploy** — how deploys avoid dropping in-flight requests:
  - Rolling restart of application server workers
  - Maintenance page: how to enable before migrations, disable after
  - Database migration safety: backward-compatible migrations only in zero-downtime deploys
- **Pre-deploy checklist** — what must happen before every deploy: backup DB, test on staging, migrations reviewed, cache strategy clear
- **Post-deploy verification** — what to check after deploy: health check URL, smoke test commands, tail error logs for 2 minutes
- **Rollback procedure** — how to roll back: revert git to previous tag, re-run deploy, run down-migration if needed; decision criteria; time budget
- **Health checks** — URL and what it verifies (see INFRASTRUCTURE.md for health endpoint spec)
- **Maintenance mode** — command to enable/disable maintenance page, what users see

Quality bar: an ops engineer can deploy, verify, and roll back without asking a developer. Every step is a command, not a description.

---

## ERROR_HANDLING.md
**Purpose:** Consistent error strategy across the entire codebase — from exception to log to user message to alert.

Required sections:
- **Error taxonomy** — categories with names and codes: Validation (422), Authentication (401), Authorisation (403), NotFound (404), Conflict (409), ExternalService (502/503), Internal (500)
- **Error object shape** — exact fields on every error (`code`, `message`, `details`, `traceId`, `httpStatus`); reference DTO_STANDARDS.md for the API envelope
- **HTTP status codes** — mapping of each error category to HTTP status used in this project
- **Exception hierarchy** — base exception class, domain exceptions that extend it, which layer throws which (cross-reference EXTENSION_PATTERNS.md)
- **Logging levels** — debug / info / warn / error — exact trigger condition for each level; what context is logged at each level
- **Log format** — structured JSON fields: `timestamp` (ISO 8601), `level`, `traceId`, `requestId`, `userId`, `path`, `method`, `message`, `context` (object); PII rules (never log passwords, tokens, card numbers)
- **User-facing messages** — rules for what to show vs hide in production; default fallback message; locale key used; cross-reference UI_UX_STANDARDS.md Error states
- **External service errors** — how 3rd-party failures are handled, retry strategy (how many times, backoff), what happens when retries exhausted
- **Error alerting** — how production errors reach the team:
  - Tool: self-hosted Sentry / log-watcher script / application-level email notification / none (document which)
  - Threshold: what error level or count triggers a notification (e.g. any new ERROR in production)
  - Channel: email / Slack webhook / Teams webhook (document which)
  - On-call: who receives the alert, escalation if unacknowledged
- **Error monitoring dashboard** — where to see error rates and trends (Sentry / Grafana / log search / none)
- **Incident runbook** — when an alert fires: first steps, how to identify the error class, escalation path; cross-reference OBSERVABILITY.md

Quality bar: every error in production is traceable, categorised, produces a consistent user message, and triggers a notification to the right person.

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
**Purpose:** Performance standards for application code AND self-hosted server configuration — prevents slow-by-design code and under-tuned infrastructure reaching production.

Required sections:
- **Budgets** — response time targets: p50 < 200ms, p95 < 500ms, p99 < 1s for API endpoints; page load LCP < 2.5s; bundle size limits (document actual targets if configured)
- **Database** — max acceptable query time (flag in review if > 100ms), index requirements for any filter/sort on tables > 10k rows, pagination required on all list endpoints, N+1 query detection rule
- **Caching** — what is cached (permissions, config, computed stats), TTL per data type, invalidation triggers, Redis memory config (`maxmemory`, `maxmemory-policy`); cross-reference EXTENSION_PATTERNS.md caching strategy
- **Application server tuning** — worker/process count for self-hosted:
  - Formula: I/O-bound apps: `(CPU cores × 2) + 1` workers; CPU-bound: `CPU cores` workers
  - Memory per worker: document configured limit
  - Connection pool size: `workers × connections_per_worker` must not exceed DB `max_connections`
  - Language-specific: OPcache for PHP (memory, max accelerated files), JIT if enabled; Node cluster mode; Gunicorn worker class for Python
- **Nginx tuning** — `worker_processes auto`, `worker_connections`, `keepalive_timeout`, gzip config; document actual values in `nginx.conf`
- **Database server tuning** — key config values for this project's DB engine:
  - PostgreSQL: `shared_buffers` (25% of RAM), `work_mem`, `max_connections`, `effective_cache_size`
  - MySQL/MariaDB: `innodb_buffer_pool_size` (60-70% of RAM), `max_connections`, `query_cache_size`
  - Document actual configured values
- **Known hot paths** — list of endpoints or operations that are performance-sensitive; each must be flagged in code review with a performance comment
- **Load testing** — tool used (ab, wrk, k6, Locust) and how to run against staging: exact command, test scenario, expected throughput
- **Profiling** — how to profile locally: exact commands per language/framework (e.g. Xdebug, Node --inspect, py-spy); APM in production if any
- **Anti-patterns** — patterns forbidden: N+1 queries, synchronous I/O in HTTP request cycle, unbounded list queries, session read on every request without cache, cache stampede without locking

Quality bar: a reviewer can flag both a code-level performance regression and an under-tuned server config without running a benchmark.

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
**Purpose:** The mechanical contract for every CSS decision in this project. Specifies the exact token catalogue, icon sizes, spacing anatomy, and CSS architecture rules. Zero raw values anywhere outside the token file. ESLint and Stylelint can enforce every rule here.
Write "Not applicable" at top if no frontend layer exists.

> **Single source of truth principle:** All raw CSS values (colours, sizes, durations) live in exactly one file. Every component references tokens — never raw values. Changing any visual property is a one-line change in the token file, not a hunt across components.

Required sections:

### 1 — Token file location and architecture
- Exact file path of the token file (the only place raw values may appear)
- Three-tier structure used in this project:
  - **Tier 1 — Scale tokens** (raw values, never used by components directly): `--color-blue-500: #3b82f6`
  - **Tier 2 — Semantic aliases** (purpose-named references to scale tokens, used by most components): `--color-primary: var(--color-blue-500)`
  - **Tier 3 — Component tokens** (computed per component, references semantic aliases): `--input-border-focus: var(--color-border-focus)`
- Hard rule: components import and use Tier 2 or Tier 3 tokens only; Tier 1 tokens are internal to the token file
- Where Tailwind config reads from (CSS variables bridge: `colors: { primary: 'var(--color-primary)' }`)

### 2 — Complete token catalogue
Extract every token defined in the project. Organize by category. This is the authoritative list — if a value is not in this catalogue, it does not belong in any component.

**Colour scale tokens** (Tier 1 — raw values, token file only):
List every colour step actually defined: neutral-50 through neutral-950, brand colour scale, semantic colour steps.

**Colour semantic aliases** (Tier 2 — what components use):
- Surface: `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`
- Border: `--color-border`, `--color-border-focus`, `--color-border-strong`
- Text: `--color-text-primary`, `--color-text-secondary`, `--color-text-disabled`, `--color-text-on-primary`
- Interactive: `--color-primary`, `--color-primary-hover`, `--color-primary-active`
- Feedback: `--color-success`, `--color-warning`, `--color-error`, `--color-info`
- Each paired with a `-foreground` alias for text on that surface and an `-rgb` alias for alpha usage

**Typography tokens**: all `--text-*` (size, weight, line-height per style level), `--font-sans`, `--font-mono`

**Spacing tokens**: `--space-1` through `--space-16` (and any custom steps)

**Border radius tokens**: `--radius-none` through `--radius-full`

**Shadow tokens**: `--shadow-none` through `--shadow-xl`, `--shadow-inner`

**Z-index tokens**: `--z-base` through `--z-tooltip`

**Motion tokens**: `--duration-fast` through `--duration-slower`, `--ease-default`, `--ease-in`, `--ease-out`, `--ease-spring`

**Component tokens** (Tier 3 — grouped by component):
- Input: `--input-height-sm/md/lg`, `--input-padding-x`, `--input-bg`, `--input-bg-disabled`, `--input-border`, `--input-border-focus`, `--input-border-error`, `--input-radius`, `--input-shadow`, `--input-shadow-focus`, `--input-text`, `--input-placeholder`, `--input-text-disabled`
- Textarea: inherits input tokens; `--textarea-min-height`
- Checkbox/Radio: `--checkbox-size`, `--checkbox-border`, `--checkbox-bg-checked`, `--checkbox-border-checked`, `--checkbox-radius`, `--radio-radius`
- Toggle: `--toggle-width`, `--toggle-height`, `--toggle-bg-off`, `--toggle-bg-on`, `--toggle-thumb-size`, `--toggle-thumb-bg`
- Button: `--button-height-sm/md/lg`, `--button-padding-x-sm/md/lg`, `--button-radius`, `--button-font`
- Panel/Card: `--panel-padding`, `--panel-padding-compact`, `--panel-padding-lg`, `--panel-header-padding`, `--panel-footer-padding`, `--panel-gap`, `--panel-section-gap`
- Layout: `--header-height`, `--header-bg`, `--header-border`, `--header-shadow`, `--header-z`, `--sidebar-width`, `--sidebar-width-collapsed`, `--sidebar-bg`, `--sidebar-border`, `--sidebar-z`, `--content-max-width`, `--content-padding-x`, `--content-padding-y`, `--footer-height`, `--footer-bg`, `--footer-border`, `--page-header-gap`
- Form spacing: `--form-field-gap`, `--form-section-gap`
- Badge: `--badge-padding-x`, `--badge-padding-y`, `--badge-radius`, `--badge-font`
- Avatar: `--avatar-size-sm/md/lg`, `--avatar-radius`
- Tooltip: `--tooltip-max-width`, `--tooltip-padding`, `--tooltip-font`
- Toast: `--toast-padding`, `--toast-max-width`, `--toast-radius`
- Modal: `--modal-padding`, `--modal-radius`, `--modal-max-width-sm/md/lg/xl`
- Table: `--table-cell-padding-x`, `--table-cell-padding-y`, `--table-header-bg`
- Nav item: `--nav-item-height`, `--nav-item-padding-x`

### 3 — Typography micro-rules
Every text style used in the product maps to a named composition of tokens. No component invents a font size — it uses one of these named styles.

| Text style | `--text-*` token | Font family | Weight token | Usage |
|---|---|---|---|---|
| Display | `--text-display` | `--font-sans` | 700 | Hero headings |
| H1 | `--text-h1` | `--font-sans` | 700 | Page titles |
| H2 | `--text-h2` | `--font-sans` | 600 | Section headings |
| H3 | `--text-h3` | `--font-sans` | 600 | Card headings |
| H4 | `--text-h4` | `--font-sans` | 600 | Minor headings |
| Body Large | `--text-body-lg` | `--font-sans` | 400 | Lead text, intro paragraphs |
| Body | `--text-body` | `--font-sans` | 400 | Default body text |
| Body Small | `--text-body-sm` | `--font-sans` | 400 | Secondary body, help text |
| Caption | `--text-caption` | `--font-sans` | 400 | Timestamps, meta info |
| Label | `--text-label` | `--font-sans` | 500 | Form labels, table column headers |
| Helper Text | `--text-body-sm` | `--font-sans` | 400 + `--color-text-secondary` | Below field |
| Error Text | `--text-body-sm` | `--font-sans` | 400 + `--color-error` | Below field on error |
| Badge | `--text-label` | `--font-sans` | 500 | Status badges |
| Button SM | `--text-button-sm` | `--font-sans` | 500 | Small buttons |
| Button | `--text-button` | `--font-sans` | 500 | Default buttons |
| Button LG | `--text-button-lg` | `--font-sans` | 500 | Large buttons |
| Nav Item | `--text-body` | `--font-sans` | 500 | Sidebar navigation labels |
| Tab | `--text-body-sm` | `--font-sans` | 500 | Horizontal tab labels |
| Table Header | `--text-label` | `--font-sans` | 600 | Table `<th>` |
| Table Cell | `--text-body` | `--font-sans` | 400 | Table `<td>` |
| Tooltip | `--text-caption` | `--font-sans` | 400 | Tooltip content |
| Empty State Title | `--text-h3` | `--font-sans` | 600 | Empty state heading |
| Empty State Body | `--text-body` | `--font-sans` | 400 + `--color-text-secondary` | Empty state supporting text |
| Code / Mono | `--text-body-sm` | `--font-mono` | 400 | Inline code, code blocks, hex inputs |

### 4 — Icon size matrix
Every icon in the product has an exact size defined here. Developers never choose a size — they look up the context.

| Context | Size | Class / prop |
|---|---|---|
| Button icon (sm) | 12px | `w-3 h-3` |
| Button icon (default) | 16px | `w-4 h-4` |
| Button icon (lg) | 20px | `w-5 h-5` |
| Icon-only button (sm) | 16px | `w-4 h-4` |
| Icon-only button (default) | 20px | `w-5 h-5` |
| Icon-only button (lg) | 24px | `w-6 h-6` |
| Form field adornment (left/right) | 16px | `w-4 h-4` |
| Field validation error icon | 16px | `w-4 h-4` |
| Field validation success icon | 16px | `w-4 h-4` |
| Sidebar nav icon | 20px | `w-5 h-5` |
| Top nav / header icon | 20px | `w-5 h-5` |
| Breadcrumb separator | 16px | `w-4 h-4` |
| Table row action icon | 16px | `w-4 h-4` |
| Table sort icon | 14px | `w-3.5 h-3.5` |
| Table checkbox | per checkbox token | — |
| Dropdown item icon | 16px | `w-4 h-4` |
| Tab icon | 16px | `w-4 h-4` |
| Badge icon | 12px | `w-3 h-3` |
| Avatar placeholder | proportional to avatar size | — |
| Empty state illustration | 48px | `w-12 h-12` |
| Alert / banner icon | 20px | `w-5 h-5` |
| Toast icon | 20px | `w-5 h-5` |
| Modal close button | 20px | `w-5 h-5` |
| Card action / kebab menu | 16px | `w-4 h-4` |
| Stat card icon | 24px | `w-6 h-6` |
| Loading spinner (button) | 16px | `w-4 h-4` |
| Loading spinner (inline) | 20px | `w-5 h-5` |
| Loading spinner (page / overlay) | 32px | `w-8 h-8` |
| Notification bell | 20px | `w-5 h-5` |
| Profile avatar trigger | per avatar-md token | — |
| Color picker swatch | 24×24px | `w-6 h-6` |

### 5 — Spacing anatomy
Component-level spacing is looked up here — not invented per component.

| Component spacing | Token | Value |
|---|---|---|
| Label → input gap | `--form-field-gap` | `var(--space-1)` |
| Input → help/error text gap | `--form-field-gap` | `var(--space-1)` |
| Field → next field gap | `--form-section-gap` | `var(--space-6)` |
| Section → section gap (form) | `--space-8` | 2rem |
| Card padding (default) | `--panel-padding` | `var(--space-6)` |
| Card padding (compact) | `--panel-padding-compact` | `var(--space-4)` |
| Card padding (large) | `--panel-padding-lg` | `var(--space-8)` |
| Card header padding | `--panel-header-padding` | `var(--space-4) var(--space-6)` |
| Card footer padding | `--panel-footer-padding` | `var(--space-4) var(--space-6)` |
| Adjacent cards gap | `--panel-gap` | `var(--space-4)` |
| Modal padding | `--modal-padding` | `var(--space-10)` |
| Table cell padding | `--table-cell-padding-x` + `--table-cell-padding-y` | `var(--space-3)` + `var(--space-4)` |
| Page content padding (x) | `--content-padding-x` | `var(--space-8)` |
| Page content padding (y) | `--content-padding-y` | `var(--space-6)` |
| Page header → content gap | `--page-header-gap` | `var(--space-6)` |
| Nav item height | `--nav-item-height` | `var(--space-10)` |
| Nav item horizontal padding | `--nav-item-padding-x` | `var(--space-3)` |
| Badge padding x | `--badge-padding-x` | `var(--space-2)` |
| Badge padding y | `--badge-padding-y` | `var(--space-1)` |
| Avatar → label gap | `--space-2` | 0.5rem |
| Dropdown item padding | `var(--space-2) var(--space-3)` | — |
| Tooltip padding | `--tooltip-padding` | `var(--space-2) var(--space-3)` |
| Tooltip offset from target | 8px | `--space-2` |
| Toast padding | `--toast-padding` | `var(--space-3) var(--space-4)` |
| Color picker swatch grid gap | `--space-2` | — |

### 6 — CSS architecture rules (10 rules — mechanically enforceable)
Every rule can be verified by ESLint, Stylelint, or code review without personal preference.

1. **No inline styles** — `style={{}}` is banned in components except for setting CSS custom property values for dynamic runtime data (e.g. `style={{ '--progress': `${pct}%` }}`). Design tokens may never be inlined.

2. **No hardcoded values** — no raw hex, px, rem, percentage, or arbitrary Tailwind `[]` bracket values in component code. The only exception is `0` and `100%` when used as layout extremes. Every other value must reference a token.

3. **No `!important`** — if specificity is the problem, fix the selector structure. `!important` indicates a design system violation, not a solution.

4. **Three-tier token scoping** — raw scale values live in the token file `:root` only. Component code references Tier 2 semantic aliases or Tier 3 component tokens. Never reference a Tier 1 scale token directly in a component (e.g. `var(--color-blue-500)` in a component is banned — use `var(--color-primary)` instead).

5. **No cross-component styling** — a parent stylesheet never reaches into a child component's internals. `ComponentA` must not contain selectors that target `ComponentB`'s internal elements. Use props and variants instead.

6. **State classes use tokens** — `:hover`, `:active`, `:focus-visible`, `:disabled` states all reference token variables. Never write `color: #0070f3` in a hover state — write `color: var(--color-primary-hover)`. Never remove the browser focus outline without providing a visible focus ring using `--input-shadow-focus` or equivalent.

7. **Responsive is mobile-first, named breakpoints only** — no magic pixel values in `@media` queries. Use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) or CSS breakpoint variables only. Breakpoint values are defined once in the token file.

8. **No duplicate styles** — the same visual property written in two component files is a signal to extract a shared utility class, token, or component. Three or more occurrences is always a token or utility — never a per-component override.

9. **No page-specific CSS overrides** — a page file (route component) may not include CSS that overrides a shared component's appearance. Page-level layout (grid, padding, gap) is allowed. Component appearance changes must go through the component's variant system or a design token change.

10. **Motion requires reduced-motion guard** — every CSS `transition` and `animation` property must be enclosed in `@media (prefers-reduced-motion: no-preference)` or use the Tailwind `motion-safe:` prefix. The default (no media query) must be instant / no animation.

### 7 — Dark mode token contract
If dark mode is implemented:
- Only Tier 2 semantic aliases change between light and dark — scale tokens never change
- Mode is toggled via: `[data-theme="dark"]` attribute on `<html>` / `.dark` class / `prefers-color-scheme` media query (document which)
- Surfaces that change: `--color-surface`, `--color-surface-raised`, `--color-surface-overlay`, `--color-border`, `--color-text-primary`, `--color-text-secondary`
- Components that use semantic aliases automatically adapt — components that hardcode scale tokens do not (this is why the rule exists)
- Test: dark mode is verified by flipping the toggle and confirming all surfaces, text, borders, and interactive states invert correctly using only the semantic alias overrides

Quality bar: a Stylelint rule can block any component that references a raw value or Tier 1 scale token. A developer adding a new component can do it using only token names from this document — zero design decisions needed.

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

## EXTENSION_PATTERNS.md
**Purpose:** The definitive catalogue of every base class, wrapper, and extension point in this project. Describes the extension hierarchy that lets the system grow without duplication. Generated from actual codebase findings — not general advice.

> **Extraction rule:** Scan `app/Core/`, `app/Foundation/`, `app/Base/`, `assets/js/core/`, `lib/`, `shared/` (or equivalent paths found during the scan). Document only what exists. Flag gaps where a base class or wrapper is missing but should exist based on the patterns found.

Required sections:

### 1 — Extension hierarchy overview
Diagram the full inheritance/composition chain for this project (use actual class/module names found in the scan):

**Backend:**
```
BaseRepository
  └── UserRepository
  └── OrderRepository
  └── [every entity repository]

BaseService
  └── UserService
  └── OrderService
  └── [every feature service]

BaseController
  └── BaseApiController
      └── UserController
      └── OrderController
  └── BaseWebController
      └── DashboardController
```

**Frontend:**
```
BaseAjax
BaseTable → [every DataTable page]
BaseForm  → [every AJAX form page]
BaseModal → [every modal page]
BaseWidget → [every dashboard widget]
Page module pattern → [every page script]
```

### 2 — BaseRepository
- **File path**: exact path in this project
- **Provided methods**: list every method with its signature and what it does
- **How to extend**: what must be in every child repository (entity name, table name, primary key, soft-delete column if used)
- **What base handles so children never reimplement**: pagination, soft-delete filter, timestamp columns, transaction context parameter
- **Gaps**: any repository found that does NOT extend BaseRepository — flag each as a refactor debt item

### 3 — BaseService
- **File path**: exact path
- **Provided methods**: transaction wrapper, validation helper, common error re-throw pattern, logging hooks
- **What base handles**: transaction boundaries, validation error formatting, structured log entry/exit
- **How to extend**: required constructor injection pattern, what the child overrides vs inherits
- **Gaps**: any service that opens its own transactions or reimplements validation formatting

### 4 — BaseController / BaseApiController
- **File path(s)**: exact paths
- **Response builder methods**: `success()`, `error()`, `paginated()`, `validationError()` — document signatures and output shape for each
- **Auth guard method**: name and usage
- **How to extend**: what every child controller must call vs can override
- **Gaps**: any controller that builds its own JSON response or calls `response()->json()` directly

### 5 — Trait and mixin catalog
For each trait/mixin/composable found in the project:
| Trait / Mixin | File path (actual) | What it provides | Which models/classes use it |
|---|---|---|---|
| `Timestampable` | [actual path] | `created_at`, `updated_at` auto-management | All models |
| `SoftDeletable` | [actual path] | `deleted_at`, default scope | User, Order, ... |
| `Auditable` | [actual path] | Writes to audit_log on create/update/delete | User, Setting, ... |
| `Searchable` | [actual path] | `search(term)` scope on approved columns | User, Product, ... |
| `Cacheable` | [actual path] | `cached(key, ttl, cb)`, `invalidateCache(key)` | User, Setting, ... |

### 6 — Exception hierarchy
- **File paths**: AppException and all domain exceptions
- **Hierarchy diagram**: AppException → ValidationException, AuthorisationException, NotFoundException, ConflictException, ExternalServiceException
- **HTTP status mapping**: which exception maps to which status code (matches ERROR_HANDLING.md)
- **Usage rule**: which layer throws which exception; which layer catches and rethrows

### 7 — Frontend base modules
For each base module found:
| Module | File path | Exposed API | Plugins it wraps |
|---|---|---|---|
| `BaseAjax` | `assets/js/core/BaseAjax.js` | `get(url, opts)`, `post(url, data, opts)`, `put(...)`, `delete(...)`, `upload(...)` | jQuery $.ajax |
| `BaseTable` | `assets/js/core/BaseTable.js` | `init(sel, cfg)`, `reload()`, `destroy()`, `getSelected()` | DataTables |
| `BaseForm` | `assets/js/core/BaseForm.js` | `init(sel, cfg)`, `reset()`, `setErrors(obj)`, `disable()`, `enable()` | BaseAjax, ToastWrapper |
| `BaseModal` | `assets/js/core/BaseModal.js` | `show(url, opts)`, `confirm(title, body, onConfirm)`, `hide()` | Bootstrap Modal, BaseAjax |
| `BaseWidget` | `assets/js/core/BaseWidget.js` | `init(sel, cfg)`, `refresh()`, `setLoading(bool)` | BaseAjax |

### 8 — Plugin wrapper catalog
For each plugin wrapper found:
| Wrapper | File path | Wraps | Exposed API |
|---|---|---|---|
| `Select2Wrapper` | `assets/js/core/plugins/Select2Wrapper.js` | Select2 | `init(sel, opts)`, `setValue(sel, val)`, `getValue(sel)`, `destroy(sel)` |
| `DatePickerWrapper` | `assets/js/core/plugins/DatePickerWrapper.js` | Flatpickr | `init(sel, opts)`, `getValue(sel)`, `setValue(sel, date)`, `destroy(sel)` |
| `ToastWrapper` | `assets/js/core/plugins/ToastWrapper.js` | Toastr | `success(msg, title)`, `error(msg, title)`, `warning(msg, title)`, `info(msg, title)` |
| `ChartWrapper` | `assets/js/core/plugins/ChartWrapper.js` | Chart.js | `init(id, type, data, opts)`, `update(id, data)`, `destroy(id)` |

**Missing wrappers** (flag any plugin used directly in page scripts without a wrapper):
| Plugin used directly | In file | Refactor action |
|---|---|---|
| [e.g. `$.fn.select2` in `pages/user.js`] | `...` | Extract to Select2Wrapper |

### 9 — Non-cloud infrastructure wrappers
For each infrastructure wrapper found:
| Wrapper | File path (actual) | What it wraps | Key methods | Non-cloud constraint |
|---|---|---|---|---|
| `StorageService` | [actual path] | Local filesystem | `store(file, path)`, `get(path)`, `delete(path)`, `url(path)` | Local disk only — no S3 or cloud storage |
| `CacheService` | [actual path] | Redis (local) / file cache | `get(key)`, `set(key, val, ttl)`, `forget(key)`, `remember(key, ttl, cb)`, `tags(tags)` | Local Redis or file cache only |
| `MailerService` | [actual path] | SMTP (local) | `send(to, template, data)`, `queue(to, template, data)` | Local SMTP only — no SES or cloud mailer |
| `QueueService` | [actual path] | Database queue / Redis queue | `dispatch(job, payload)`, `dispatchAt(job, payload, time)` | Local DB or Redis queue — no SQS |
| `Logger` | [actual path] | File-based log | `debug(msg, ctx)`, `info(msg, ctx)`, `warn(msg, ctx)`, `error(msg, ctx)` | File logs with daily rotation — no CloudWatch |

**Missing wrappers** (flag any direct infrastructure call found outside a wrapper):
| Direct call found | In file | Refactor action |
|---|---|---|
| [e.g. direct file write in a service] | `{actual file}:{line}` | Route through StorageService |

### 10 — File storage conventions
- **Storage root path**: exact configured path (relative to project root)
- **Directory structure**: `storage/{type}/{YYYY}/{MM}/` — types used in this project (uploads, exports, temp, logs)
- **Naming rule**: UUID filename with original extension — never user-supplied filename
- **Database storage**: store relative path only — not absolute path
- **Access control**: files served through `FileController.serve(path)` only — direct URL access disabled in Nginx
- **Cleanup job**: name of the scheduled task that purges temp files older than 24h

### 11 — Queue and background job catalog
| Job class | File path (actual) | Triggered by | Payload | Retries | Timeout |
|---|---|---|---|---|---|
| `SendWelcomeEmailJob` | [actual path] | UserService.create() | `{ userId }` | 3 | 30s |
| `GenerateReportJob` | [actual path] | ReportService.request() | `{ reportId }` | 1 | 300s |

Worker configuration: process supervisor name, queue name(s), number of workers, restart policy.
Failed job handling: `failed_jobs` table, how failed jobs are reviewed and retried.

### 12 — Caching strategy
| Cached data | Cache key pattern | TTL | Invalidated by | Cache layer |
|---|---|---|---|---|
| User profile | `user:{id}:profile` | 15 min | UserService.update() | Redis |
| Dashboard stats | `stats:dashboard:{date}` | 1 hour | StatsJob (nightly) | Redis |
| Permission list | `auth:permissions:{userId}` | 30 min | RoleService.assign() | Redis |
| Config values | `config:{key}` | 1 day | SettingService.save() | Redis |

Session configuration: driver (Redis / database), TTL, cookie settings.

### 13 — Scalability configuration (self-hosted)
- **Database connection pooling**: driver and pool size configured in — document file path and values
- **Nginx role**: reverse proxy, load balancer (if multi-server), static asset serving, gzip
- **Process supervisor**: Supervisor / systemd / pm2 — configuration file path, managed processes (app worker, queue worker, cron trigger)
- **Shared resources on multi-server**: session store (Redis address), file uploads (NFS path or shared mount), cache (Redis address)
- **Horizontal scaling readiness**: list any known blockers to adding a second app server (e.g. local session files — must migrate to Redis first)

### 14 — Code size limits
Document the enforced limits in this project (from linting/CI config if present):
- Max function/method length: 30 lines (flag at 25, block at 30)
- Max class length: 200 lines
- Max file length: 300 lines (templates exempt)
- Max cyclomatic complexity: 10 per function
- Lint tool and config file path

### 15 — Extension gaps and refactor debt
List every gap found during the scan — code that violates the extension architecture:
| Gap | Location (actual file:line) | Severity | Recommended fix |
|---|---|---|---|
| Repository does not extend BaseRepository | `{actual file}` | Medium | Extend BaseRepository; extract duplicated pagination logic |
| Direct `$.ajax` call in page script | `{actual file}:{line}` | Medium | Route through BaseAjax |
| Direct file write in service | `{actual file}:{line}` | High | Route through StorageService |

Quality bar: a new developer knows exactly where to put any new class, how to extend any existing one, and what wrappers to call for any infrastructure operation — without asking anyone.

---

## ADMINLTE.md
**Purpose:** The complete reference for AdminLTE-based UI projects — installation, folder structure, CSS override strategy, component catalog, plugin management, layout rules, and responsive contracts.
Generated **only when AdminLTE is detected** during the TrainDocs scan. Write "Not applicable — AdminLTE not detected in this project." at top if absent.

> **Extraction rule:** Read actual installed files — `package.json`, `bower.json`, `adminlte/dist/`, or CDN link in base template. Extract exact version, layout class names actually used in the project, and the real custom CSS file structure.
>
> **Non-negotiable architecture rule (document this first):** AdminLTE core files are never modified. All customisation flows through CSS custom properties and a single override file. No raw values appear outside the token file. This document is the single source of truth for how AdminLTE is used in this project.

Required sections:

### 1 — Installation and version
- AdminLTE version (extract from `package.json`, `bower.json`, or CDN link)
- Bootstrap version (AdminLTE 3.x → Bootstrap 4; AdminLTE 4.x → Bootstrap 5)
- Installation method: npm, bower, CDN, or downloaded into `assets/`
- Exact distribution folder path in this project (e.g. `public/adminlte/dist/`)
- Base HTML template file location (the master layout all pages extend)

### 2 — Folder structure
Document the complete asset folder structure used in this project:
```
assets/ (or public/ — use the actual path)
├── adminlte/           ← AdminLTE distribution — NEVER EDIT
│   └── dist/
│       ├── css/
│       └── js/
├── plugins/            ← Third-party plugin assets — NEVER EDIT
│   ├── datatables/
│   ├── select2/
│   └── flatpickr/
├── css/
│   ├── variables.css   ← Bootstrap + project CSS custom properties (loaded FIRST)
│   └── custom.css      ← All project overrides (loaded LAST)
├── js/
│   └── app.js          ← Project JS — plugin init and page-independent logic
└── img/
    └── ...             ← All images; img-fluid applied at component level
```

Rule: the `adminlte/` and `plugins/` folders are read-only. A developer must never edit any file inside them. Updates happen by replacing the entire folder with a new version.

### 3 — Stylesheet load order
The order below is mandatory. Any deviation causes visual regressions.
1. `assets/css/variables.css` — Bootstrap CSS custom property overrides + project token declarations
2. Bootstrap CSS (`bootstrap.min.css`)
3. AdminLTE CSS (`adminlte.min.css`)
4. Plugin CSS files (one per plugin, in the approved catalogue order)
5. `assets/css/custom.css` — all project-specific overrides and additions

Rule: custom.css is always last. Nothing loads after it.

### 4 — JavaScript load order
1. jQuery (`jquery.min.js`)
2. Bootstrap bundle JS (`bootstrap.bundle.min.js`)
3. AdminLTE JS (`adminlte.min.js`)
4. Plugin JS files (in approved catalogue order)
5. `assets/js/app.js` — project-level initialisations

Rule: jQuery must appear exactly once per page. AdminLTE JS depends on jQuery being in scope first. Never defer AdminLTE JS — it must execute synchronously to bind sidebar and widget behaviours.

### 5 — CSS custom property system (token file: `assets/css/variables.css`)
Three layers — document every token actually defined in this project:

**Layer 1 — Bootstrap variable overrides** (before Bootstrap loads, overrides its defaults):
| Token | Project value | Purpose |
|---|---|---|
| `--bs-primary` | e.g. `#3498db` | Primary brand colour (Bootstrap uses this for `.bg-primary`, `.btn-primary`, etc.) |
| `--bs-secondary` | e.g. `#6c757d` | Secondary colour |
| `--bs-success` | e.g. `#28a745` | Success state |
| `--bs-danger` | e.g. `#dc3545` | Error / destructive state |
| `--bs-warning` | e.g. `#ffc107` | Warning state |
| `--bs-info` | e.g. `#17a2b8` | Info / neutral accent |
| `--bs-body-bg` | e.g. `#f4f6f9` | Page background (AdminLTE default is `#f4f6f9`) |
| `--bs-body-color` | e.g. `#212529` | Default body text colour |
| `--bs-font-sans-serif` | e.g. `'Source Sans 3', system-ui, sans-serif` | Body font |
| `--bs-font-monospace` | e.g. `'Courier New', monospace` | Monospace font |

**Layer 2 — AdminLTE variable overrides** (any AdminLTE-specific custom properties found):
List any `--adminlte-*` or `--alt-*` variables used to customise the sidebar skin, header height, etc.

**Layer 3 — Project semantic aliases** (project-specific, built on top of layers 1 and 2):
| Token | References | Semantic purpose |
|---|---|---|
| `--color-primary` | `var(--bs-primary)` | Primary interactive colour |
| `--color-surface` | `var(--bs-body-bg)` | Page background |
| `--color-surface-card` | `#ffffff` | Card background |
| `--color-border` | `#dee2e6` | Default border (Bootstrap's default) |
| `--color-text-primary` | `var(--bs-body-color)` | Body text |
| `--color-text-secondary` | `#6c757d` | Secondary / helper text |
| `--color-text-muted` | `var(--bs-secondary)` | Muted text |
| `--sidebar-bg` | e.g. `#343a40` | Sidebar background (skin-dependent) |
| `--sidebar-text` | e.g. `#c2c7d0` | Sidebar text and icon colour |
| `--sidebar-active-bg` | `var(--bs-primary)` | Active nav item background |
| `--navbar-bg` | `#ffffff` | Top navbar background |
| `--content-padding` | `1.5rem` | Content wrapper inner padding |

Rule: all custom.css references use Layer 3 tokens only. Layer 1 and Layer 2 tokens are allowed in custom.css only when extending Bootstrap or AdminLTE utilities directly.

### 6 — Colour system and skin
AdminLTE has pre-built skin combinations. Document which skin this project uses:

**Sidebar skin class** (applied to `<aside class="main-sidebar ...">`:
- `sidebar-dark-primary` / `sidebar-dark-navy` / `sidebar-dark-olive` / etc. (dark sidebar)
- `sidebar-light-primary` / `sidebar-light-white` / etc. (light sidebar)

**Navbar class** (applied to `<nav class="main-header navbar ...">`:
- `navbar-white navbar-light` (white header)
- `navbar-dark bg-primary` (coloured header)

Document the exact classes used in the base layout template. These must never be changed without a documented design decision.

Status colour usage rule — map Bootstrap semantic colours to their only permitted use in this project:
| Colour | Bootstrap class | AdminLTE usage | This project uses it for |
|---|---|---|---|
| Primary | `text-primary`, `bg-primary`, `btn-primary` | Active state, primary CTA | [document] |
| Secondary | `text-secondary`, `btn-secondary` | Secondary CTA, helper text | [document] |
| Success | `text-success`, `bg-success`, `btn-success` | Positive states, approval | [document] |
| Danger | `text-danger`, `bg-danger`, `btn-danger` | Errors, destructive actions | [document] |
| Warning | `text-warning`, `bg-warning` | Caution, pending states | [document] |
| Info | `text-info`, `bg-info` | Informational, neutral accent | [document] |
| Dark | `text-dark`, `bg-dark` | Strong emphasis, code | [document] |
| Muted | `text-muted` | Help text, timestamps, labels | [document] |

### 7 — Typography
Bootstrap 5 / AdminLTE typography system used in this project:
| Element | Class / token | Size | Weight | Line height | Usage |
|---|---|---|---|---|---|
| Display | `.display-1` – `.display-6` | 5rem – 2.5rem | 300 | 1.2 | Hero headings |
| H1 | `h1` or `.h1` | 2.5rem | 500 | 1.2 | Page titles |
| H2 | `h2` or `.h2` | 2rem | 500 | 1.2 | Section headings |
| H3 | `h3` or `.h3` | 1.75rem | 500 | 1.2 | Card headings, widget titles |
| H4 | `h4` or `.h4` | 1.5rem | 500 | 1.2 | Sub-section headings |
| H5 | `h5` or `.h5` | 1.25rem | 500 | 1.2 | Minor headings |
| H6 | `h6` or `.h6` | 1rem | 500 | 1.2 | Sidebar section labels |
| Body | `body` | 1rem | 400 | 1.5 | Default body text |
| Small / Secondary | `.small` / `small` | 0.875rem | 400 | 1.4 | Secondary text, help text |
| Label | `label` | 0.875rem | 400 | 1.5 | Form labels |
| Caption / Muted | `.text-muted .small` | 0.8125rem | 400 | 1.4 | Timestamps, captions |
| Sidebar item | `.nav-link` in sidebar | 0.9rem | 400 | 1.5 | Navigation labels |
| Badge | `.badge` | 0.75em | 600 | 1 | Status indicators |
| Button | `.btn` | 1rem | 400 | 1.5 | Default button |
| Button SM | `.btn-sm` | 0.875rem | 400 | 1.5 | Small button |
| Button LG | `.btn-lg` | 1.25rem | 400 | 1.5 | Large button |
| Code | `code` | 0.875em | 400 | 1.5 | Inline code |

Font loading: document the actual font name, source (Google Fonts / local), and the `<link>` or `@import` location.

### 8 — Layout system
AdminLTE's mandatory page skeleton — every page must match this structure exactly:

```
<body class="hold-transition [sidebar-skin] layout-[variant]">
  <div class="wrapper">

    <!-- Header -->
    <nav class="main-header navbar navbar-expand [navbar-classes]">
      <div class="container-fluid"> ... </div>
    </nav>

    <!-- Sidebar -->
    <aside class="main-sidebar [sidebar-skin] elevation-4">
      <a href="/" class="brand-link"> ... </a>
      <div class="sidebar">
        <div class="user-panel"> ... </div>
        <nav class="mt-2">
          <ul class="nav nav-pills nav-sidebar flex-column" ...> ... </ul>
        </nav>
      </div>
    </aside>

    <!-- Content Wrapper -->
    <div class="content-wrapper">
      <div class="content-header"> ... </div>
      <section class="content">
        <div class="container-fluid"> ... </div>
      </section>
    </div>

    <!-- Footer -->
    <footer class="main-footer">
      <div class="float-right d-none d-sm-block"> ... </div>
      ...
    </footer>

  </div>
</body>
```

**Layout variant** (applied to `<body>`): document which variant this project uses:
- Default (push sidebar): no extra class
- `layout-fixed`: header and sidebar fixed, only content scrolls
- `layout-boxed`: content has a max-width, centered
- `layout-navbar-fixed`: fixed navbar only
- `layout-footer-fixed`: fixed footer only
- `sidebar-mini`: sidebar collapses to icon-only, not off-canvas

### 9 — Header / Navbar anatomy
Document each section of the header as implemented in this project:
- **Left section**: sidebar toggle button (`<a class="nav-link" data-widget="pushmenu">`) + brand/logo + breadcrumb (if header-breadcrumb layout)
- **Right section**: document each dropdown present: notifications bell (mark-all-read URL), messages dropdown, user profile dropdown (logout URL, settings link, profile link)
- **Search bar**: present/absent; if present — endpoint it submits to and what it searches
- Navbar height token: `--adminlte-navbar-height` or Bootstrap equivalent; document the actual value

### 10 — Sidebar anatomy
- **Brand link**: logo image path, alt text, brand text
- **User panel**: avatar image, username display, online status badge — document where user data comes from (session, API call)
- **Navigation tree**: document all top-level nav items, icons (FontAwesome class), URL, and which items have sub-menus; document the active-state class (`active`) and how it is set dynamically
- **Sidebar behaviour**:
  - Expands/collapses: via `data-widget="pushmenu"` on the toggle button — never re-implement
  - Collapsed width: 4.6rem (icon-only, `sidebar-mini` layout); sidebar hides off-canvas on xs/sm
  - Active nav item: AdminLTE adds `active` class + `menu-open` to parent on current route — document how the server-side template sets this
  - Sub-menu expand: `nav-item has-treeview` — the `menu-open` class controls expand state
  - Sidebar scroll: `os-host` custom scrollbar (OverlayScrollbars) if the plugin is included

### 11 — Content area anatomy
Every content page follows this structure inside `<section class="content">`:
- **Page header**: `<div class="content-header">` containing page title (`<h1>`) and breadcrumb (`<ol class="breadcrumb">`)
- **Content container**: `<div class="container-fluid">` — all cards and page content inside this
- **Grid**: Bootstrap 12-column grid. Standard page layout patterns:
  | Layout | Classes | Use case |
  |---|---|---|
  | Full width | `col-12` | Wide tables, dashboards |
  | Two halves | `col-md-6` | Side-by-side panels |
  | One-third / two-thirds | `col-md-4` / `col-md-8` | List + detail |
  | Three columns | `col-md-4` each | KPI stat boxes |
  | Four columns | `col-md-3` or `col-xl-3` | Dashboard cards |

### 12 — Card system (primary content container)
Every content block is a card. No custom box wrappers.

**Standard card:**
```html
<!-- structural reference — not for copy-paste -->
<div class="card [card-variant] [card-outline]">
  <div class="card-header">
    <h3 class="card-title">Title</h3>
    <div class="card-tools">
      <!-- collapse, fullscreen, close buttons here -->
    </div>
  </div>
  <div class="card-body">...</div>
  <div class="card-footer">...</div>
</div>
```

**Card colour variants**: `card-primary`, `card-secondary`, `card-success`, `card-danger`, `card-warning`, `card-info`, `card-dark` — use sparingly and consistently (document which context each variant is used for in this project).
**Outline variant**: add `card-outline` for border-header instead of filled — document contexts where outline is preferred.
**Collapsible cards**: add `data-card-widget="collapse"` button in `card-tools` — uses AdminLTE's built-in collapse, not Bootstrap collapse.
**Loading overlay**: `<div class="overlay"><div class="fas fa-2x fa-sync fa-spin"></div></div>` inside `.card-body` — used for async card content loading.
**Card with tab**: use Bootstrap tabs inside `card-body`, not AdminLTE's tab widget.

### 13 — Widget components
Document usage rules for each AdminLTE widget used in this project:

**Small Box** (KPI metric widget — top of dashboard):
- Structure: `small-box bg-[colour]`; contains a metric value, label, link, and icon
- Rule: metric value must always come from a data source — never hardcode test values
- Icon: FontAwesome icon in `.icon` section; must be semantically related to the metric
- Link: "More info" link routes to the detail view for that metric

**Info Box** (secondary metric widget):
- Structure: `info-box` with `info-box-icon bg-[colour]` and `info-box-content`
- Rule: use for supporting metrics, not primary KPIs (use small-box for primary KPIs)

**Progress Bar** (inside cards or info boxes):
- Always use Bootstrap's `progress` component
- Progress value must be set via CSS custom property: `style="width: [value]%"` on `.progress-bar` — this is the one permitted use of runtime inline style
- Must include `aria-valuenow`, `aria-valuemin`, `aria-valuemax` attributes

**Timeline** (activity feed):
- Use AdminLTE's `timeline` component. Do not build a custom timeline list.
- Most recent items at top. Timestamps relative (e.g. "3 hours ago") for items within 7 days, absolute for older items.

### 14 — Form system
AdminLTE uses Bootstrap forms. These rules apply to every form in the project:

**Form layout classes:**
- `form-group` (Bootstrap 4) or `mb-3` (Bootstrap 5): wraps label + control + feedback
- `form-control`: on all text inputs, textareas, selects
- `form-check` / `form-check-input` / `form-check-label`: checkboxes and radios
- `form-switch`: toggles (Bootstrap 5 only)
- `input-group`: for inputs with addons (icons, prefixes, append buttons)

**Form size variants**: `form-control-sm` / `form-control-lg` — use consistently; document which size is the project default.

**Validation states:**
- Valid: `is-valid` class on input + `valid-feedback` div below
- Invalid: `is-invalid` class on input + `invalid-feedback` div below
- Server-side validation errors must be applied by adding `is-invalid` on the relevant input and populating `invalid-feedback` with the error message
- Do not use `alert` boxes for field-level validation errors — use inline feedback only

**Select2 integration**: every `<select>` with more than 2 options must be enhanced with Select2. Initialise in `app.js` or page-specific JS, never inline.

**Date / datetime inputs**: always use Flatpickr (or project-approved equivalent). `<input type="date">` is not permitted.

**File upload**: use Bootstrap's file input component. For drag-drop uploads, use the project-approved library (document which one in ADMINLTE.md).

**Colour picker**: use the project-approved colour picker plugin. The input must be a `text` input enhanced by the plugin. The raw hex value is stored as user data and displayed in the plugin's UI — this is the only context where a hex string appears as a data value rather than a design token.

**Form card pattern**: every standalone form goes inside a `card` with a descriptive `card-title`. Inline forms (search, quick filters) go inside `input-group` within the relevant panel.

### 15 — Table system (DataTables)
All data tables use DataTables. No raw `<table>` elements render without DataTables enhancement.

**Standard DataTables configuration** (from `app.js` — document the actual values):
- `serverSide: true` for any table that may exceed 500 rows
- `processing: true` always enabled (shows loader overlay)
- `responsive: true` always enabled — uses responsive column hiding, never overflows viewport
- `pageLength:` project default (e.g. 25)
- `dom:` string — document the exact DOM positioning of filter, info, pagination
- `language:` object — document any overridden labels (empty table message, loading message)
- `columnDefs:` — document any global column defaults (e.g. orderable: false for action columns)

**Table structure rule**: every table must be inside `<div class="table-responsive">`. Even with DataTables responsive plugin active, the wrapper prevents flash of overflow before JS loads.

**Action columns**: the last column contains row actions. Use `btn-xs btn-[colour]` buttons or icon-only buttons with `title` tooltips. Maximum 3 actions visible; additional actions go in a dropdown.

### 16 — Modal patterns
All confirmation dialogs, detail views, and form popups use Bootstrap modals.

**Standard confirmation modal structure**: title = "noun + action" ("Delete User?"), body = consequence statement, footer = cancel button (`.btn-default` / `.btn-secondary`) + confirm button (`.btn-danger` for destructive actions, `.btn-primary` for confirmations).

**Modal sizes**: `.modal-sm` (300px) for simple confirmations; default (500px) for standard forms; `.modal-lg` (800px) for complex forms or detail views; `.modal-xl` (1140px) for full-detail panels.

**Dynamic modals**: modals loaded via AJAX must show a loading spinner inside `.modal-body` while fetching, then replace it with the loaded content. Error state: show an error message inside `.modal-body` and disable the confirm button.

**Responsive modals**: all modals must be scrollable on mobile using `.modal-dialog-scrollable`. No modal content overflows the viewport.

### 17 — Approved plugin catalogue
Document every plugin in use, in load order:

| Plugin | Version | CSS file | JS file | Purpose | Requires |
|---|---|---|---|---|---|
| OverlayScrollbars | x.x.x | `overlayScrollbars.min.css` | `jquery.overlayScrollbars.min.js` | Custom sidebar scrollbar | jQuery |
| Select2 | x.x.x | `select2.min.css` | `select2.full.min.js` | Enhanced select boxes | jQuery |
| Flatpickr | x.x.x | `flatpickr.min.css` | `flatpickr.min.js` | Date/datetime picker | None |
| DataTables | x.x.x | `dataTables.bootstrap4/5.min.css` | `jquery.dataTables.min.js`, `dataTables.bootstrap4/5.min.js` | Data table management | jQuery |
| DataTables Responsive | x.x.x | `responsive.bootstrap4/5.min.css` | `dataTables.responsive.min.js`, `responsive.bootstrap4/5.min.js` | Responsive columns | DataTables |
| Chart.js | x.x.x | — | `chart.min.js` | Charts and graphs | None |
| SummerNote | x.x.x | `summernote-bs4/5.min.css` | `summernote-bs4/5.min.js` | Rich text editor | jQuery, Bootstrap JS |
| Toastr | x.x.x | `toastr.min.css` | `toastr.min.js` | Toast notifications | jQuery |

**Adding a new plugin:** (1) confirm it is not covered by an existing approved plugin; (2) check bundle size — if minified JS > 50KB, requires team approval; (3) verify it supports the project's Bootstrap version; (4) add to the catalogue table above in load order; (5) update the load order documentation in section 3 and 4.

### 18 — Toast and notification patterns
- All user-facing success/error/warning messages use Toastr (or the project-approved toast library — document which)
- Toast positions and durations: `success` (top-right, 3s), `error` (top-right, 5s, not auto-dismiss on errors requiring action), `warning` (top-right, 4s), `info` (top-right, 3s)
- Toastr initialisation options documented in `app.js` — not repeated per-page
- **Never** use `window.alert()` for any user message
- Notification bell in the navbar: badge count must reflect real unread count from the server; "Mark all as read" clears the badge

### 19 — Page templates
Document all page templates available in this project. For each:
| Template | File path | Layout variant | Purpose |
|---|---|---|---|
| Dashboard | `views/dashboard.html` | layout-fixed | Main KPI overview |
| List page | `views/layouts/list.html` | layout-fixed | DataTable with search/filter |
| Create / Edit form | `views/layouts/form.html` | layout-fixed | Single record form |
| Detail view | `views/layouts/detail.html` | layout-fixed | Read-only record detail |
| Auth / Login | `views/auth/login.html` | No sidebar | Full-page login |
| Error 403 / 404 / 500 | `views/errors/*.html` | No sidebar | Error pages |

### 20 — Responsive behaviour matrix
Every UI element has defined behaviour at every breakpoint. This is the non-negotiable contract.

| Element | xs (<576px) | sm (≥576px) | md (≥768px) | lg (≥992px) | xl (≥1200px) |
|---|---|---|---|---|---|
| Sidebar | Off-canvas, hidden | Off-canvas, hidden | Off-canvas, hidden | Visible, full width | Visible, full width |
| Sidebar mini | Off-canvas | Off-canvas | Off-canvas | Icon-only (4.6rem) | Icon-only (4.6rem) |
| Content width | 100% | 100% | 100% | 100% minus sidebar | 100% minus sidebar |
| Header search | Hidden or icon-only | Hidden or icon-only | Visible | Visible | Visible |
| Card columns | 1 column (`col-12`) | 1 column | 2 columns (`col-md-6`) | 2–3 columns | 3–4 columns |
| DataTable | Responsive hidden cols | Responsive hidden cols | All visible (small screens may scroll) | All visible | All visible |
| Modals | Bottom-sheet or full-screen | Centred, full width | Centred, 500px | Centred, 500px | Centred, 500px |
| Forms | Single column | Single column | Two column (`col-md-6`) | Two column | Two column |
| Navbar items | Collapsed behind toggler | Partial | Full | Full | Full |
| Admin breadcrumb | Single line, wraps | Single line | Full path visible | Full path | Full path |

Hard rule: verify every row in this table before any frontend PR is merged. A broken breakpoint is a Critical defect.

### 21 — Extending the system
**Adding a new page:** (1) choose the closest page template; (2) extend the base layout; (3) add the nav item in the sidebar template; (4) register the route; (5) apply the correct `active` class logic to the sidebar; (6) verify responsive behaviour at all breakpoints.

**Adding a new widget/component:** (1) check if AdminLTE already provides it; (2) if yes, use it as-is; (3) if no, build a custom component using Bootstrap classes and project tokens only — no new CSS framework classes; (4) document the component in this section under "Custom components."

**Custom components** (document each one the project adds):
| Component name | Location | Purpose | Bootstrap classes used | Custom CSS class |
|---|---|---|---|---|
| — | — | — | — | — |

**Changing the skin/theme:** change the skin class on `<body>` and the navbar class on `<nav>`. Update the sidebar token values in `variables.css`. Do not change any file inside `adminlte/dist/`.

Quality bar: a new developer can build any page, configure any component, and add any plugin by reading this document alone — no research required.

---

## INFRASTRUCTURE.md
**Purpose:** Self-hosted server architecture — every service, its configuration, and how it is operated. Required reading before touching the production server.
Write "Not applicable" only if the project is fully managed PaaS with no server access.

> **Extraction rule:** Read `nginx.conf` / `nginx/sites-available/`, supervisor config files (`/etc/supervisor/conf.d/`), `docker-compose.yml`, `.env.example`, README deployment notes, `Procfile` (if present). If no server config is committed, document what the agent can infer from the stack and flag all gaps.

Required sections:

### 1 — Server architecture overview
- Server inventory: every server role (web, queue worker, scheduler, database, cache) — can be co-located on one server or split
- Network topology: which services communicate with which; what is exposed to internet vs private only
- Diagram:
  ```
  Internet → Nginx (port 80/443) → App server (localhost:XXXX)
                                 → Static files (direct serve)
  App server → Database (localhost/private)
  App server → Redis (localhost/private)
  Queue worker → Database/Redis queue
  Cron trigger → Queue (dispatches jobs)
  ```

### 2 — Nginx configuration
- Server block: domain, HTTP→HTTPS redirect, SSL cert paths
- Proxy: upstream address (`127.0.0.1:PORT`), proxy headers (X-Forwarded-For, X-Real-IP)
- Static file serving: what paths are served directly (assets, public), what goes to the app
- Gzip: enabled, MIME types, compression level
- Rate limiting: zones defined, which locations they apply to
- Security headers (HSTS, X-Frame-Options, X-Content-Type-Options, CSP, Referrer-Policy) — exact values
- Connection settings: `worker_processes`, `worker_connections`, `keepalive_timeout`
- Config file path on server

### 3 — Application server
- Process manager: PHP-FPM / PM2 / Gunicorn / Puma / equivalent
- Config file path
- Worker count: actual configured value and the formula used (e.g. `CPU × 2 + 1`)
- Memory limit per worker
- Timeout: max request execution time
- Restart policy: on crash, on memory limit exceeded

### 4 — Process supervisor
- Tool: Supervisor / systemd / PM2 (document which)
- Managed processes: app server, queue worker(s), cron trigger
- Config file path for each managed process
- Commands: start, stop, restart, reload config, view status, view logs

### 5 — Queue workers
- Number of worker processes per queue channel
- Start command for each worker
- Memory limit per worker (workers must restart after N MB to prevent memory leaks)
- Timeout: max job execution time before worker is killed and job fails

### 6 — Redis
- Role in this project: session store / cache / queue (all that apply)
- Persistence: RDB snapshot interval; AOF enabled/disabled
- `maxmemory` setting and `maxmemory-policy` (e.g. `allkeys-lru` for cache, `noeviction` for queue)
- Auth: password protected (yes/no)
- Binding: `127.0.0.1` only — never exposed to internet
- Config file path

### 7 — Database server
- Engine and version
- Key config values: `max_connections`, buffer pool size, slow query log threshold and file path
- Application database user: minimum privileges only (no GRANT, no DROP, no superuser)
- Backup user: read-only user used for dumps
- Binding: localhost or private network — never exposed to internet
- Config file path

### 8 — SSL/TLS
- Certificate provider: Let's Encrypt (certbot) / paid CA / self-signed
- Certificate paths on server
- Auto-renewal: certbot timer or cron entry — exact schedule and test command (`--dry-run`)
- TLS minimum version: 1.2 minimum, 1.3 preferred
- HTTPS redirect: configured in Nginx

### 9 — Firewall
- Tool: UFW / iptables / firewalld / cloud security group
- Open to internet: 22 (SSH), 80 (HTTP), 443 (HTTPS) — all others blocked
- SSH access: restricted to specific IPs if possible (document)
- Internal-only: database port, Redis port, app server port (6379, 3306/5432, 8000/9000 etc.)

### 10 — File system layout
- Application root on server: exact path
- Shared directories (persist across deploys via symlinks): `storage/`, `logs/`
- `.env` location, permissions (`640`), owner (app user)
- Log file locations: application log, Nginx access/error log, supervisor logs, queue worker logs

### 11 — Health check endpoint
- URL: `GET /health` (or whatever the project uses)
- What it checks: DB ping, Redis ping, queue worker process running
- Response: `{ "status": "ok", "checks": { "db": "ok", "redis": "ok" }, "uptime": NNN }`
- HTTP 200 if all checks pass; HTTP 503 if any fail

### 12 — Service management commands
Exact commands to manage each service:
| Action | Command |
|---|---|
| Restart app server | `sudo supervisorctl restart app-worker:*` (or equivalent) |
| Restart queue workers | `sudo supervisorctl restart queue-worker:*` |
| Reload Nginx config | `sudo nginx -t && sudo nginx -s reload` |
| Check Redis status | `redis-cli ping` |
| Check DB connections | DB-specific query or tool |
| Tail app error log | `tail -f /path/to/app.log` |
| Enable maintenance mode | framework/app command |
| Disable maintenance mode | framework/app command |

Quality bar: any team member can operate the server — start, stop, restart any component, and diagnose a failure — using only this document.

---

## BACKUP_RECOVERY.md
**Purpose:** How data is protected and how to recover from failure. For a self-hosted system with no automatic cloud backups, this document defines the backup schedule, storage, and tested recovery procedures.

> **Extraction rule:** Check for backup scripts in `scripts/`, `bin/`, or crontab. Read `.env.example` for DB credentials shape. Note which data directories need backing up.

Required sections:

### 1 — Backup scope
| Data | Backed up? | Backup method | Recovery impact if lost |
|---|---|---|---|
| Database | Yes | pg_dump / mysqldump / equivalent | Complete data loss |
| Uploaded files (`storage/uploads/`) | Yes | rsync / tar | Loss of user-uploaded assets |
| Application code | No — in git | — | Redeploy from git tag |
| `.env` / secrets | Yes (encrypted, separately) | Encrypted archive | App cannot start |
| Redis queue (in-flight jobs) | No | — | Jobs in queue at time of failure lost |
| SSL certificates | Yes | Included with server backup | Replace via certbot re-issue |

### 2 — Database backup
- Script path: exact file (e.g. `scripts/backup-db.sh`)
- Schedule: daily at HH:MM UTC via cron or systemd timer — exact cron expression
- Output: compressed dump file (e.g. `/backup/db/YYYY-MM-DD.sql.gz`)
- Retention: keep last N daily backups on server
- Off-server copy: rsync to secondary server or encrypted transfer to offsite storage (document destination)
- Backup database user: read-only user — never root or app user
- Manual trigger command: exact command

### 3 — File backup
- What: `storage/uploads/` and `storage/exports/` (exclude `storage/temp/`)
- Tool and command: rsync / tar / restic — exact command
- Schedule: daily (document cron entry)
- Destination: offsite copy location
- Retention: last N days

### 4 — Backup verification
- Test frequency: at minimum monthly
- Test procedure: restore latest backup to a test database, run row count queries on key tables
- Last verified: document date of last successful test restore
- Verification script: path (or "manual" if no script)

### 5 — Secrets and certificate backup
- `.env` file: encrypted archive, stored separately from code backups
- SSL certificates: certbot-managed (re-issuable from Let's Encrypt) or archived with server backup
- Encryption method for secret archive: GPG / openssl enc / password-protected zip (document which)

### 6 — Recovery procedures

**Scenario A — Accidental data deletion or DB corruption:**
1. Stop application server (prevent further writes)
2. Identify the last clean backup file
3. Drop and recreate the database
4. Restore: exact restore command with flags
5. Verify: row count queries on critical tables
6. Restart application server
7. Confirm health check passes

**Scenario B — Full server failure (restore to new server):**
1. Provision new server (document OS version and minimum specs)
2. Install stack: document provisioning script path or step list
3. Restore `.env` from encrypted backup
4. Clone application code from git at the last production tag
5. Restore database from latest backup
6. Restore file storage from latest backup
7. Configure Nginx, supervisor, Redis, certbot
8. Run database migrations (if any since last backup)
9. Update DNS to new server IP
10. Verify health check endpoint

**Scenario C — Single file restoration:**
1. Identify file path and approximate date of loss
2. Extract from file backup archive
3. Place at correct storage path, fix permissions

### 7 — RPO and RTO targets
- **RPO (Recovery Point Objective):** how much data loss is acceptable — e.g. "up to 24 hours" (daily backup)
- **RTO (Recovery Time Objective):** target time to restore service — e.g. "4 hours for full server restore"
- Responsibility: who executes the restore, who approves the decision to restore

### 8 — Backup monitoring
- How to verify backups ran: log entry, cron notification, file size check
- Alert on failure: who is notified, how (email / monitoring alert)
- Check: backup file age must not exceed RPO threshold

Quality bar: any team member can execute a full server restore using only this document and the backup files, without access to the original developer.

---

## OBSERVABILITY.md
**Purpose:** How the application's health is monitored in production — health checks, uptime monitoring, metrics, log management, and alerting for a self-hosted environment.

> **Extraction rule:** Check for `/health`, `/ping`, `/status` routes. Check `nginx.conf` for access log format. Check for monitoring config files (prometheus.yml, uptime-kuma config, supervisor logs). Check ERROR_HANDLING.md for log format.

Required sections:

### 1 — Health check endpoints
- URL: `GET /health` (or project equivalent)
- What it checks: database connectivity, Redis connectivity, queue worker running
- Success response (HTTP 200):
  ```json
  { "status": "ok", "checks": { "db": "ok", "redis": "ok", "queue": "ok" }, "uptime_seconds": 12345 }
  ```
- Failure response (HTTP 503): same shape with failing check marked `"error"`
- Used by: uptime monitoring tool, Nginx upstream health check (if load-balanced)

### 2 — Uptime monitoring
- Tool: UptimeRobot / Uptime Kuma (self-hosted) / Nagios / none (document which)
- Monitored URLs: health endpoint, login page, any critical public endpoints
- Check interval: every N minutes
- Alert recipients: who gets notified and how (email, Teams/Slack webhook)
- Escalation: if primary alert goes unacknowledged for N minutes, who is escalated to

### 3 — Application metrics
| Metric | How measured | Alert threshold | Alert channel |
|---|---|---|---|
| HTTP 5xx error rate | Nginx access log (`status >= 500`) | > 1% in 5min | Ops email/webhook |
| Average response time | Nginx `$request_time` | p95 > 2s sustained | Ops email/webhook |
| Queue depth | DB/Redis query | > 500 pending jobs | Ops email/webhook |
| Failed jobs count | `failed_jobs` table new rows | Any new row | Ops email/webhook |
| Disk usage | OS `df` | > 80% on any volume | Ops email |
| Memory usage | OS `free` | > 85% for 5+ min | Ops email |
| DB connection count | DB query | > 80% of `max_connections` | Ops email |
| Queue worker process | Supervisor status | Worker not running | Ops email/webhook |

### 4 — Self-hosted metrics stack
Document what is deployed (if anything):
- **Prometheus + Grafana**: installation paths, exporters running (node_exporter, nginx_exporter, db_exporter), dashboard URLs, data retention
- **Netdata**: installation path, alert config
- **None (log-based only)**: document what log parsing scripts or manual checks are used instead

### 5 — Log management
| Log | Path on server | Rotation | Retention |
|---|---|---|---|
| Application error log | [actual path] | Daily | 30 days |
| Application access log | [actual path] | Daily | 14 days |
| Nginx access log | `/var/log/nginx/access.log` | Daily | 14 days |
| Nginx error log | `/var/log/nginx/error.log` | Daily | 30 days |
| Queue worker log | [actual path] | Daily | 7 days |
| Supervisor log | `/var/log/supervisor/*.log` | Daily | 7 days |

Log search: command to search logs (`grep`, `zgrep` for rotated files, or log aggregation tool).

### 6 — Error alerting
- **Tool used**: self-hosted Sentry / log-watcher script / exception mailer / none (document which is deployed)
- **Trigger**: any new `ERROR` level log entry in production (or Sentry event)
- **Alert channel**: email to ops / Slack webhook / Teams webhook (document)
- **Runbook**: when an error alert fires → tail the error log → identify the exception class → check OBSERVABILITY.md §9 for response steps

### 7 — Database observability
- Slow query log: enabled (yes/no), threshold, file path
- Active connection check: command to see current vs max connections
- Disk space for data directory: `df -h /var/lib/postgresql/` or equivalent
- Replication lag: if replica configured, how to check lag

### 8 — Queue observability
- Check queue depth: exact command or query
- Check queue worker status: `supervisorctl status` or equivalent
- Inspect failed jobs: query or command to list failed jobs with their error messages
- Retry a failed job: exact command
- Clear old failed jobs: command (or scheduled job — see SCHEDULER.md)

### 9 — Alert response runbook
| Alert | First response | If not resolved in 10min |
|---|---|---|
| Health check failing | SSH → check supervisor status → check app error log | Restart app server; if no fix → rollback last deploy |
| High 5xx error rate | Tail error log, identify error class | Check ERROR_HANDLING.md incident runbook |
| Disk > 80% | `du -sh /var/log/*` and `/storage/*` | Delete old rotated logs; run cleanup job; escalate if still high |
| Queue depth spike | `supervisorctl status` → check workers running | Restart queue workers; check for stuck/slow jobs |
| New failed jobs | Query `failed_jobs` table | Investigate error; retry or fix bug; clear after 30 days |
| DB connections near max | Check active queries | Identify long-running queries; consider connection pool tuning |

Quality bar: any team member can identify that the application is failing, determine the root cause, and take first-response action using only this document.

---

## CONFIGURATION_MANAGEMENT.md
**Purpose:** How application configuration is managed — every environment variable, per-environment differences, secrets handling, and startup validation. Zero guesswork for anyone configuring a new environment.

> **Extraction rule:** Read `.env.example`. Read framework config files (`config/`, `src/config/`). Read `ONBOARDING.md` if it contains setup steps. Extract every env var referenced in the codebase.

Required sections:

### 1 — Configuration hierarchy
How config is resolved (highest wins):
1. OS environment variables (set by server, CI, or container)
2. `.env` file values (on server — never committed)
3. Framework config file defaults
4. Application code defaults (only for non-sensitive safe values)

### 2 — Complete environment variable catalog
Every variable used in the application:

| Variable | Purpose | Required | Default | Example / Source |
|---|---|---|---|---|
| `APP_ENV` | Environment name | Yes | — | `production` / `staging` / `local` |
| `APP_KEY` | Encryption key | Yes | — | Generate: framework keygen command |
| `APP_DEBUG` | Debug mode (never true in prod) | Yes | `false` | `false` |
| `APP_URL` | Application base URL | Yes | — | `https://app.example.com` |
| `DB_HOST` | Database hostname | Yes | `127.0.0.1` | `127.0.0.1` |
| `DB_PORT` | Database port | Yes | `3306`/`5432` | Depends on engine |
| `DB_DATABASE` | Database name | Yes | — | From DBA |
| `DB_USERNAME` | Database user | Yes | — | From DBA |
| `DB_PASSWORD` | Database password | Yes | — | From DBA |
| `REDIS_HOST` | Redis hostname | Yes | `127.0.0.1` | `127.0.0.1` |
| `REDIS_PORT` | Redis port | Yes | `6379` | `6379` |
| `REDIS_PASSWORD` | Redis auth | If configured | `null` | From ops |
| `QUEUE_CONNECTION` | Queue driver | Yes | `database` | `redis` (prod), `database` (staging) |
| `SESSION_DRIVER` | Session store | Yes | `file` | `redis` (prod), `database` (staging) |
| `SESSION_LIFETIME` | Session TTL (minutes) | Yes | `120` | `120` |
| `CACHE_DRIVER` | Cache driver | Yes | `file` | `redis` (prod) |
| `MAIL_HOST` | SMTP server | Yes | — | `smtp.domain.com` |
| `MAIL_PORT` | SMTP port | Yes | `587` | `587` |
| `MAIL_USERNAME` | SMTP user | Yes | — | Mail admin |
| `MAIL_PASSWORD` | SMTP password | Yes | — | Mail admin |
| `MAIL_FROM_ADDRESS` | Default sender address | Yes | — | `noreply@domain.com` |
| `LOG_CHANNEL` | Log channel | Yes | `daily` | `daily` |
| `LOG_LEVEL` | Minimum log level | Yes | `error` | `error` (prod), `debug` (local) |

Document every additional variable found in the actual codebase — the above is a template.

### 3 — Per-environment differences
| Variable | Local | Staging | Production |
|---|---|---|---|
| `APP_DEBUG` | `true` | `false` | `false` |
| `LOG_LEVEL` | `debug` | `warning` | `error` |
| `QUEUE_CONNECTION` | `sync` | `database` | `redis` |
| `SESSION_DRIVER` | `file` | `database` | `redis` |
| `CACHE_DRIVER` | `array` | `redis` | `redis` |
| `MAIL_HOST` | Mailtrap/MailHog | Test SMTP | Production SMTP |

### 4 — Config validation on startup
- Where: application validates required variables at boot — not at first use
- What happens if a required variable is missing: application refuses to start, clear error message listing the missing variable
- Tool: framework config validation, custom startup check, or explicit documentation if absent
- `.env.example`: committed to git, contains all keys with placeholder values — kept in sync with actual `.env`

### 5 — Secrets management
- All secrets live in the `.env` file on the server (never in git, never in config files)
- `.env` permissions: `chmod 640` — readable by app user and root only (never 777 or world-readable)
- Who has production `.env` access: document roles, not personal names
- New server setup: how `.env` is populated on a new server (manual copy over SSH, encrypted transfer — never git)
- Secret rotation: when a secret changes → update `.env` on server → restart application → verify health check
- Leaked secret procedure: rotate immediately, update `.env`, check logs for unauthorised use, rotate session keys

### 6 — Framework config files
- Config directory: exact path (e.g. `config/`, `src/config/`)
- Config files and what they control: list each file and its purpose
- Rule: config files define structure and defaults; runtime values always come from env vars
- Changes to config files require a code deploy

Quality bar: a new developer can configure any environment from scratch using only this document and the `.env.example` file.

---

## SCHEDULER.md
**Purpose:** Complete catalog of every scheduled task — what runs, when, what it does, estimated duration, and failure behaviour. Required for ops to maintain the system without reading source code.

> **Extraction rule:** Read the application's central scheduler file (e.g. `app/Console/Kernel.php`, `src/scheduler.ts`, `crontab`, `Procfile`). Read the jobs directory. Document every scheduled entry found.

Required sections:

### 1 — Scheduler architecture
- How the scheduler is invoked: single cron entry every minute / systemd timer / supervisor process
- Cron entry on server (exact line in crontab or systemd unit file)
- Central scheduler file: exact path in the codebase — all jobs registered here
- Timezone: what timezone the scheduler runs in (must be consistent with server timezone)
- Overlap prevention: if a job is still running when the next trigger fires, what happens (skip / queue / run anyway)

### 2 — Complete job catalog
Every scheduled task in the application:

| Job | Class/function path | Schedule | Description | Est. duration | Runs as | On failure |
|---|---|---|---|---|---|---|
| `CleanTempFiles` | [actual path] | Daily 03:00 | Delete temp files in `storage/temp/` older than 24h | < 30s | Sync | Log + continue |
| `GenerateDailyStats` | [actual path] | Daily 00:05 | Aggregate previous day stats into summary tables | ~5 min | Async job | Alert ops |
| `PruneAuditLogs` | [actual path] | Weekly Sun 01:00 | Delete audit logs older than retention period | ~1 min | Sync | Log + alert |
| `PruneFailedJobs` | [actual path] | Daily 02:00 | Delete failed job records older than 30 days | < 10s | Sync | Log |
| `SendScheduledNotifications` | [actual path] | Every 5 min | Send queued notification emails | Variable | Async job | Retry × 3 |

Replace example rows with actual jobs found in the codebase. If no scheduled tasks exist: note explicitly.

### 3 — Job failure handling
- Jobs that fail silently: list which jobs swallow errors and why
- Jobs that alert ops on failure: list which jobs trigger a notification
- Retry behaviour: which jobs retry automatically, how many times, what backoff
- Manual re-run: command to run a specific job manually outside the scheduler
- Stuck job detection: if a job runs longer than 2× its estimated duration, how is it detected

### 4 — Job monitoring
- Last-run tracking: how to see when a job last executed (log query or status table)
- Duration tracking: how to detect if a job is taking longer than expected
- Lock mechanism: how overlap is prevented for long-running jobs (DB advisory lock, file lock, or none)

### 5 — Adding a new scheduled task
1. Create the job class in the jobs directory following extension patterns (see EXTENSION_PATTERNS.md)
2. Add it to the central scheduler file with the cron schedule
3. Add it to the Job catalog table in this document
4. Define failure behaviour: sync (log-only) or async (queue with retry + alert)
5. Set resource limits: memory limit, timeout
6. Test with manual run command before merging
7. Monitor first scheduled run in production

Quality bar: an ops engineer knows exactly what is running on the server at any given time — no scheduled task is undocumented.

---

## Document update triggers

| Trigger event | Documents to regenerate |
|---|---|
| New dependency added / removed | `STACK.md`, `ONBOARDING.md` |
| New enum added or changed (`app/Enums/`) | `LOCALISATION.md` — enum catalog + missing items |
| New constant class added or changed (`app/Constants/`) | `LOCALISATION.md` — constants catalog |
| Locale file changed (`lang/`, `locales/`, `assets/js/locales/`) | `LOCALISATION.md` — locale structure |
| New Request DTO added or changed | `DTO_STANDARDS.md` — request catalog |
| New Response DTO added or changed | `DTO_STANDARDS.md` — response catalog |
| `BaseApiController` response builder changed | `DTO_STANDARDS.md` — envelope shape |
| Role or permission definition changed | `RBAC.md` — role definitions + permission catalog |
| `RolePermissionSeeder` changed | `RBAC.md` — role→permission mapping |
| Auth middleware changed | `RBAC.md` — guard placement |
| `User::can()` implementation changed | `RBAC.md` — can() implementation |
| Base class added or changed (`app/Core/`, `app/Foundation/`) | `EXTENSION_PATTERNS.md`, `ARCHITECTURE.md` |
| New trait added or changed | `EXTENSION_PATTERNS.md` |
| Infrastructure wrapper changed (StorageService, CacheService, etc.) | `EXTENSION_PATTERNS.md` |
| Frontend base module changed (`assets/js/core/`) | `EXTENSION_PATTERNS.md`, `FRONTEND.md` |
| New repository/service/controller added not extending base | `EXTENSION_PATTERNS.md` — refactor debt section |
| Queue/cache/mail/storage driver config changed | `EXTENSION_PATTERNS.md`, `ARCHITECTURE.md` |
| Framework version major bump | `STACK.md`, `DECISIONS.md`, affected layer doc |
| Lint / formatter config changed | `STANDARDS.md` |
| Design token changed | `DESIGN_SYSTEM.md`, `UI_UX_STANDARDS.md`, `ADMINLTE.md` (if AdminLTE project) |
| Database schema migration | `DB_STANDARDS.md` |
| New API endpoint pattern introduced | `API_STANDARDS.md`, `BACKEND.md`, `PATTERNS.md` |
| New frontend component pattern | `FRONTEND.md`, `PATTERNS.md`, `DESIGN_SYSTEM.md`, `ADMINLTE.md` (if AdminLTE project) |
| AdminLTE version upgrade | `ADMINLTE.md`, `DESIGN_SYSTEM.md`, `STACK.md` |
| AdminLTE plugin added or removed | `ADMINLTE.md` — plugin catalogue section |
| AdminLTE skin / colour changed | `ADMINLTE.md`, `DESIGN_SYSTEM.md`, `fe/STYLING_MICRO_STANDARDS.md` |
| New custom component added | `ADMINLTE.md` — custom components section |
| Sidebar nav item added / removed | `ADMINLTE.md` — sidebar anatomy section |
| New UX interaction pattern introduced | `UI_UX_STANDARDS.md`, `FRONTEND.md` |
| Auth / security model changed | `SECURITY.md`, `BACKEND.md` |
| New test approach adopted | `TESTING.md` |
| CI/CD pipeline changed | `DEPLOYMENT.md`, `WORKFLOWS.md` |
| New environment added | `DEPLOYMENT.md`, `ONBOARDING.md`, `CONFIGURATION_MANAGEMENT.md` |
| Significant folder restructure | `ARCHITECTURE.md`, `PATTERNS.md`, `STANDARDS.md` |
| New error handling pattern | `ERROR_HANDLING.md`, `BACKEND.md`, `UI_UX_STANDARDS.md` |
| Performance budget revised | `PERFORMANCE.md` |
| New major architectural decision | `DECISIONS.md`, `ARCHITECTURE.md` |
| New team member onboarding reveals gaps | `ONBOARDING.md`, `GLOSSARY.md` |
| Code review finds recurring pattern | `PATTERNS.md`, `RULES.md` |
| Nginx config changed | `INFRASTRUCTURE.md`, `SECURITY.md` |
| Process supervisor config changed | `INFRASTRUCTURE.md` |
| Redis config changed | `INFRASTRUCTURE.md`, `EXTENSION_PATTERNS.md` |
| Database server config changed | `INFRASTRUCTURE.md`, `PERFORMANCE.md` |
| New scheduled job added or changed | `SCHEDULER.md`, `EXTENSION_PATTERNS.md` |
| Backup script changed | `BACKUP_RECOVERY.md` |
| Backup schedule or destination changed | `BACKUP_RECOVERY.md` |
| Health check endpoint added or changed | `OBSERVABILITY.md`, `INFRASTRUCTURE.md` |
| Uptime monitoring config changed | `OBSERVABILITY.md` |
| Error alerting config changed | `OBSERVABILITY.md`, `ERROR_HANDLING.md` |
| `.env.example` variables changed | `CONFIGURATION_MANAGEMENT.md`, `ONBOARDING.md` |
| Secret rotation procedure changed | `CONFIGURATION_MANAGEMENT.md`, `SECURITY.md` |
| SSL certificate setup or renewal changed | `INFRASTRUCTURE.md`, `SECURITY.md` |
| Firewall rules changed | `INFRASTRUCTURE.md`, `SECURITY.md` |
