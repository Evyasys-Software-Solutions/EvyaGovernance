# Rules: Extension Architecture, DRY, and Wrappers

Applies to every project. These rules govern how code is structured for large-scale
maintainability, minimum duplication, and safe extension without complexity.

Every rule uses "must" or "never" — no ambiguity. Violations block merge.

---

## Core principle

The system grows by extension, not by modification.
Every shared concern lives in one place. Every third-party dependency is wrapped.
New features add files; they never copy-paste into existing ones.

---

## DRY (Do Not Repeat Yourself) rules

- **Never** copy a block of logic from one file to another. If logic is needed in two places, extract it first and reference it from both.
- Any validation rule, query fragment, response shape, error message, or business calculation that appears in 2+ places must be extracted to a shared module before the second use is merged.
- Any CSS class combination applied identically in 3+ places must become a named utility class or component — never repeated inline.
- Any frontend JS initialization pattern (plugin config, event binding, AJAX setup) repeated in 2+ page files must become a base module method.
- Any ORM/query pattern (filter, scope, join, order) repeated in 2+ repository methods must become a named scope, query builder method, or repository base method.
- If two service methods share setup or teardown steps (open connection, begin transaction, log call), that shared block must be in the base service — not duplicated per method.
- If a route handler validates the same fields as another route handler, the validation rule set must be a named schema or rule class — not repeated per handler.

---

## Wrapper rules

All third-party library calls must go through a project wrapper. Business logic never imports a vendor library directly.

- **Never** call a third-party storage library directly from a service or controller. Route all file operations through a `StorageService` or equivalent wrapper that exposes a project-defined interface.
- **Never** call a third-party mailer library directly from a service or controller. Route all email operations through a `MailerService` wrapper.
- **Never** call a third-party cache library directly from a service. Route all cache reads and writes through a `CacheService` wrapper that exposes `get`, `set`, `forget`, `remember`, and `tags` methods.
- **Never** call a third-party queue library directly from a service. Route all job dispatching through a `QueueService` or `JobDispatcher` wrapper.
- **Never** call a logging library directly in business logic. Use the project's `Logger` wrapper that enforces log level rules and structured format from `ERROR_HANDLING.md`.
- Frontend: **never** call jQuery's `$.ajax` or the native `fetch` API directly from page scripts. All HTTP calls go through the project's `BaseAjax` module which handles CSRF tokens, error handling, loading states, and toast feedback.
- Frontend: **never** initialise Select2, Flatpickr, DataTables, Toastr, or any approved plugin directly in page scripts. Use the project's wrapper modules (`Select2Wrapper`, `DatePickerWrapper`, `BaseTable`, `Toast`) which apply the project's standard configuration.
- Frontend: **never** use `window.alert()`, `window.confirm()`, or `window.prompt()` directly. Route through the project's `Modal.confirm()` or `Toast.error()` wrappers.

**Why wrappers:** swapping a vendor library (e.g. replacing Toastr with a different toast library) must touch exactly one file — the wrapper. Business logic and page scripts must require zero changes.

---

## Backend extension hierarchy

Every layer has a base class or module. Feature classes extend the base — they do not reimplement what the base already provides.
Exact file paths depend on the project's language and framework — document in `EXTENSION_PATTERNS.md`.

### Base Repository
- Must exist in the project's core infrastructure directory (e.g. `app/Core/`, `src/core/`, `lib/base/`).
- Must provide at minimum: `find(id)`, `findAll(filters, pagination)`, `create(data)`, `update(id, data)`, `delete(id)`, `softDelete(id)` (if soft-delete is used), `paginate(query, perPage)`, `search(term, fields)`.
- All entity repositories must extend or mixin the base repository. **Never** reimplement pagination, soft-delete checking, or timestamp handling in a feature repository — override only the parts that differ.
- Base repository must accept an optional transaction context parameter on all write methods — it never opens its own transactions.

### Base Service
- Must exist in the project's core infrastructure directory.
- Must provide: transaction wrapping helper, standardised validation helper (calls the validation library and throws a consistent domain exception), and logging hooks (log entry and exit for major state transitions).
- All feature services must extend or compose the base service. **Never** open database transactions in a feature service method — use the base service's transaction wrapper.
- Base service must not contain any feature-specific business logic.

### Base Controller / Base API Controller
- Must exist in the project's core infrastructure directory.
- The base API controller must provide: `success(data, message, status)`, `error(message, code, status)`, `paginated(data, meta)`, `validationError(errors)` response builder methods.
- All controllers must extend or use the appropriate base. **Never** build a JSON response object manually in a feature controller — always use the base response methods.
- Base controller must provide the standard auth guard check as a single method call — not reimplemented per controller.

### Trait and mixin catalog
Use traits, mixins, or composable behaviours for cross-cutting concerns that many models or classes share. Each must do exactly one thing:
- `Timestampable` — manages `created_at`, `updated_at` automatically
- `SoftDeletable` — manages `deleted_at`; applies default "not deleted" scope to all queries
- `Auditable` — writes create/update/delete events to an audit log table
- `Searchable` — provides a `search(term)` scope using the project's approved full-text search approach
- `Cacheable` — provides `cached(key, ttl, callback)` and `invalidateCache(key)` on the model level
- **Never** put business logic inside a trait or mixin. These are infrastructure behaviour only.

### Exception hierarchy
- A base `AppException` (or equivalent) must exist, extending the language/framework's base exception class.
- Domain exceptions extend `AppException`: `ValidationException`, `AuthorisationException`, `NotFoundException`, `ConflictException`, `ExternalServiceException`.
- **Never** throw a raw untyped error from business logic — throw a typed domain exception.
- **Never** catch all exceptions without rethrowing or specifically handling — use typed catches.

---

## Frontend extension hierarchy (AdminLTE / JS context)

Every page module is built on base modules. Base modules encapsulate all plugin initialisation and standard behaviour.

### BaseTable (DataTables wrapper)
- Must exist at `assets/js/core/BaseTable.js` (or equivalent).
- Must expose: `init(selector, config)`, `reload()`, `destroy()`, `getSelected()`, `addRow(data)`, `removeRow(id)`.
- `init` merges the provided config with the project's standard DataTables config (from `ADMINLTE.md`) before passing to DataTables. Page scripts only pass delta config — they never repeat global settings.
- **Never** initialise DataTables directly in a page script. Always call `BaseTable.init()`.

### BaseForm (form handling wrapper)
- Must exist at `assets/js/core/BaseForm.js`.
- Must handle: form serialisation, client-side validation display, submit button loading state (disabled + spinner), AJAX form submission via `BaseAjax`, success/error feedback via `Toast`, and field-level error rendering from server response.
- **Never** write custom form submit handling in a page script. Extend `BaseForm` and override only the `onSuccess` and `onError` hooks.

### BaseModal (modal wrapper)
- Must exist at `assets/js/core/BaseModal.js`.
- Must handle: show/hide lifecycle, loading state while fetching modal content via AJAX, error state if fetch fails, confirm/cancel pattern, focus management (moves focus in on open, returns on close).
- **Never** write Bootstrap modal event handlers directly in a page script. Use `BaseModal.show(url, options)` and `BaseModal.confirm(title, body, onConfirm)`.

### BaseAjax (HTTP wrapper)
- Must exist at `assets/js/core/BaseAjax.js`.
- Must handle: CSRF token injection, JSON content-type, global error handling (401 → redirect to login, 403 → permission toast, 500 → error toast, network failure → network error toast), request loading state on a configurable element, and response envelope unwrapping.
- **Never** call `$.ajax`, `$.get`, `$.post`, or `fetch` directly in page scripts. Always call `BaseAjax.get(url, options)`, `BaseAjax.post(url, data, options)`, etc.

### Page module pattern
- Every page must export a module object with exactly three methods: `init()`, `bind()`, `destroy()`.
- `init()` — reads DOM state and initialises components (called once on page load)
- `bind()` — attaches event listeners (called after init)
- `destroy()` — removes event listeners and cleans up (called on SPA navigation or page teardown)
- **Never** write script-level code outside a page module. All page logic lives inside `init()`, `bind()`, or `destroy()`.
- Page modules **never** import from other page modules. Shared logic belongs in a base module or utility.

### Plugin wrapper catalog
Each approved plugin has exactly one wrapper in `assets/js/core/plugins/`:
- `Select2Wrapper.js` — `init(selector, options)`, `setValue(selector, value)`, `getValue(selector)`, `destroy(selector)`
- `DatePickerWrapper.js` — `init(selector, options)`, `getValue(selector)`, `setValue(selector, date)`, `destroy(selector)`
- `ToastWrapper.js` — `success(msg, title)`, `error(msg, title)`, `warning(msg, title)`, `info(msg, title)` (wraps Toastr with project defaults)
- `ChartWrapper.js` — `init(canvasId, type, data, options)`, `update(canvasId, newData)`, `destroy(canvasId)`

---

## Non-cloud infrastructure rules

This project runs on self-hosted infrastructure. No cloud provider SDKs are used.
Infrastructure concerns are handled by local services and wrappers.

### File storage
- All file read/write operations go through a `StorageService` wrapper that abstracts the filesystem path and naming conventions.
- File paths follow the pattern: `storage/{type}/{YYYY}/{MM}/{uuid}.{ext}` — never store files with user-supplied names directly.
- **Never** store absolute paths in the database. Store relative paths from the storage root only.
- The `StorageService` must enforce: file size limit (from project config), allowed MIME types (from project config), and quarantine check for uploads.
- Temporary uploaded files must be cleaned up within 24 hours by the scheduled cleanup job — not in request processing.
- **Never** serve files directly through the web server from the upload directory. Route through a controller that enforces access control.

### Caching (local Redis or file cache)
- Cache key naming convention: `{entity}:{id}:{variant}` or `{feature}:{scope}:{hash}` — never arbitrary strings.
- Cache TTL values must come from project config constants — never hardcoded integers in call sites.
- All cache write operations use the `CacheService.remember(key, ttl, callback)` pattern — never manual get-check-set.
- Cache invalidation must be triggered from the service layer — never from the controller or view layer.
- **Never** cache user-specific data under a shared key. Cache keys must include user ID where data is user-scoped.
- Session storage: must use Redis (local) or database sessions — never file sessions in a multi-server setup.

### Email (local SMTP)
- All email is sent through the `MailerService` wrapper. **Never** call the mail library directly.
- Email sending must be queued — never sent synchronously in the request cycle. Use the queue system.
- Email templates must live in the project's email template directory. **Never** build HTML email strings in a service or controller.
- **Never** log email content — log only the recipient, template name, and send status (success/failure).

### Queue (database or Redis queue — no cloud queue)
- All background work is dispatched through the `QueueService.dispatch(JobClass, payload)` method.
- Job classes must extend `BaseJob` (or equivalent) which provides: retry count (from project config), timeout (from project config), failure logging, and dead-letter handling.
- **Never** dispatch a job from the controller. Job dispatch belongs in the service layer only.
- Job payloads must contain only primitive values or IDs — never full model objects (they may be stale by the time the job runs).
- Failed jobs must be written to a `failed_jobs` table (or equivalent) with the full exception and payload — never silently dropped.
- The queue worker must be managed by a process supervisor (Supervisor, systemd, pm2, or equivalent) — never run as a cron task directly.

### Background jobs / scheduled tasks
- All cron-based scheduled tasks are defined in one central scheduler file — never added directly to the system crontab per feature.
- Each scheduled task must be idempotent — running it twice must produce the same result as running it once.
- Scheduled task execution must be logged: start time, duration, outcome (success/failure), records processed.
- **Never** run a long-running task synchronously in the cron entry. The cron fires a job dispatch; the actual work runs in the queue worker.

### Logging (file-based)
- Log files must be rotated daily. Maximum log retention: defined in project config (not hardcoded).
- Log format must be structured JSON (not plain text) so logs can be parsed programmatically.
- Log levels: `debug` — development only; `info` — major state transitions; `warn` — non-critical failures; `error` — exceptions and failures that need action. **Never** log PII (passwords, tokens, card numbers, national IDs).
- Each log entry must include: timestamp (ISO 8601), level, request ID (if in request context), user ID (if authenticated), message, and context object.
- **Never** use debugging dump functions (`console.log`, `var_dump`, `print_r`, `puts`, `dd`, `dump`, or language-equivalent) in production code. Use the project's Logger wrapper.

---

## Scalability rules (self-hosted, no cloud)

- Database queries on tables expected to exceed 10,000 rows must have an index on every filter, join, and order-by column.
- **Never** load all records into memory for a bulk operation. Use cursor-based pagination or chunked processing.
- Any page or API endpoint that reads a large dataset must support pagination — no unbounded list responses.
- Read-heavy data that changes infrequently must be cached. Cache miss must not cause a noticeable delay (sub-200ms cache hit is the target).
- If the application runs on multiple servers: session storage must be Redis (shared), file uploads must go to a shared filesystem or must be immediately stored in the database/shared NFS mount.
- A reverse proxy (Nginx, Caddy, or equivalent) must be the entry point for all HTTP traffic — the application server must never be exposed directly.
- Long-running operations (report generation, bulk exports, bulk imports) must always run as background jobs — **never** during an HTTP request.
- Database connection pooling must be configured. **Never** open a new database connection per request without pooling.

---

## Code size and complexity rules

- A single function/method must not exceed 30 lines. If it does, extract sub-tasks into private methods.
- A single class/module must not exceed 200 lines. If it does, split responsibilities across multiple classes.
- A single file must not exceed 300 lines. Views and templates are exempt.
- Cyclomatic complexity must not exceed 10 per function/method. Simplify with early returns, strategy pattern, or extracted methods.
- **Never** add a parameter to a function to handle a special case — extract the special case to its own function instead.
- **Never** use a flag parameter (e.g. `isAdmin`, `isDraft`) to change the core behaviour of a function. Split into two functions.

---

## Quality gate

A PR that adds new logic must demonstrate extension — not duplication.
The ReviewDev step loads `EXTENSION_PATTERNS.md` and this rules file for every PR.
Any new class that does not extend the appropriate base class is flagged **Important**.
Any direct third-party library call outside a wrapper is flagged **Important**.
Any method exceeding 30 lines is flagged **Important**.
Any non-cloud infrastructure call (file write, cache write, email send, job dispatch) that bypasses its wrapper is flagged **Critical**.
