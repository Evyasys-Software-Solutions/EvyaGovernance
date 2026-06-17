# Rules: Localisation and Constants

Applies to every project. Zero hardcoded text. Zero magic values.
Every rule uses "must" or "never" — no ambiguity. Violations block merge.

---

## Core principle

Every string a human reads and every value a machine compares must have a name.
Names live in one place — locale files for text, enum/constant modules for values.
Changing any label, message, or business value is a one-file change, never a codebase hunt.

---

## Localisation rules (no hardcoded text)

- **Never** write a user-facing string as a string literal anywhere outside a locale file.
  Forbidden in: controllers, services, repositories, views/templates, JS page scripts, email templates, API response builders, exception messages, validation rules, toast calls, modal titles, table column headers, breadcrumb labels, page titles, sidebar labels, button text, empty-state messages, confirmation dialog text.
- **Never** concatenate strings to form a user-facing message. Use locale parameter substitution provided by your framework or i18n library — never string concatenation.
- **Never** hardcode a date or time format string in business logic or a view. Date formats come from a named constant module: `DateFormat.DISPLAY`, `DateFormat.API`, `DateFormat.DATETIME_DISPLAY`.
- **Never** hardcode a currency symbol, decimal separator, or thousands separator. Number and currency formatting goes through a `FormatterService` wrapper that reads locale config.
- All validation error messages must use locale keys — the validation library's message file is the only valid location for validation message text.
- All email subjects and email body paragraphs must be in locale files. The mailer wrapper resolves them before sending.
- All frontend user-facing text (button labels, column headers, placeholder text, empty state messages, error banners, toast messages, modal titles, breadcrumb labels) must be loaded from a locale JSON file (`assets/js/locales/en.json` or equivalent), not written as string literals in JS or HTML templates.
- Sidebar nav item labels must come from locale — not hardcoded in the sidebar template.

### Locale file organisation (backend)
All locale files live in the project's locale directory (e.g. `lang/`, `locales/`, `resources/lang/`, `i18n/` — use the actual path found in this project):

| File | Namespace prefix | Purpose | Example key |
|---|---|---|---|
| `messages{.ext}` | `messages.` | General success/info/status messages | `messages.record_created` |
| `errors{.ext}` | `errors.` | Error messages keyed by ErrorCode constant | `errors.not_found` |
| `validation{.ext}` | `validation.` | All field validation messages | `validation.required` |
| `ui{.ext}` | `ui.` | Button labels, column headers, page titles, breadcrumbs, empty states, placeholders | `ui.button_save` |
| `emails{.ext}` | `emails.` | Email subjects and body paragraphs | `emails.welcome_subject` |
| `notifications{.ext}` | `notifications.` | Toast/notification messages | `notifications.save_success` |
| `{domain}{.ext}` | `{domain}.` | Entity-specific labels (status labels, field labels) | `orders.status_pending` |

Key naming convention: `{file_prefix}.{key}` — e.g. `ui.button_save`, `errors.not_found`, `messages.record_created`.
Keys must be `snake_case`. Never use dots inside a key segment — dots are the separator between namespace and key.

### Locale file organisation (frontend)
- One JSON file per locale: `assets/js/locales/en.json` (or equivalent)
- Loaded once at application init — stored in a `Lang` singleton available globally
- Structure mirrors the backend: `ui.*`, `errors.*`, `messages.*`, `notifications.*`
- Frontend JS accesses strings via `Lang.get('ui.button_save')` — never via a raw string literal
- All locale strings shared between backend and frontend must stay in sync — the frontend JSON and the backend locale file for `ui.*` must contain the same keys

---

## Enum rules

- **Never** compare against a raw string or integer that represents a named state.
  Forbidden: `user.status === 'active'`, `order.type === 1`.
  Required: `user.status === UserStatus.ACTIVE`, `order.type === OrderType.STANDARD`.
- Every column in the database that stores a finite set of values must have a corresponding enum or constant module in the project's enum directory (e.g. `app/Enums/`, `src/enums/`, `app/constants/enums/` — use the actual project path).
- Every enum must expose a `label()` method or equivalent that returns the locale key for display — never the raw enum value. Display names live in locale files.
- Every enum must expose a `values()` static method or equivalent returning all valid values — used for validation rules and select option lists.
- Every enum used in a `<select>` or radio group is populated from `EnumName.options()` which returns `[{ value, label }, ...]` — never a hardcoded option array in a view.
- **Never** store enum display labels in the enum class/module itself. The enum holds the value; the locale file holds the label.

### Mandatory enum catalog
Every project must define at minimum:
| Enum | Purpose | Values |
|---|---|---|
| `UserStatus` | User account state | ACTIVE, INACTIVE, SUSPENDED, PENDING_VERIFICATION |
| `UserRole` | User role names | Names match the role table — document actual roles |
| `Permission` | All permission identifiers | All permissions in `{resource}:{action}` format |
| `QueueName` | Queue channel names | DEFAULT, EMAILS, REPORTS, NOTIFICATIONS, EXPORTS |
| `ErrorCode` | API error codes | VALIDATION_FAILED, NOT_FOUND, FORBIDDEN, CONFLICT, SERVER_ERROR, EXTERNAL_FAILURE |
| `HttpStatus` | HTTP status codes | Use framework built-in or define: 200, 201, 400, 401, 403, 404, 409, 422, 500 |

Domain-specific enums (add for every entity that has status or type columns):
`OrderStatus`, `PaymentStatus`, `ReportStatus`, `NotificationType`, `AuditAction`, etc.

---

## Constant rules

- **Never** write a magic number or magic string as a literal in business logic.
  Forbidden: `query.limit(25)`, `cache.set(key, data, 900)`, `storage.path('uploads/')`.
  Required: `query.limit(PaginationConst.DEFAULT_PER_PAGE)`, `cache.set(key, data, CacheTtl.MEDIUM)`, `storage.path(StorageConst.UPLOAD_PATH)`.
- All configuration-driven values that appear in code must be named constants — even if they appear only once. A named constant is self-documenting; a literal is not.
- Constants are grouped by concern into dedicated constant modules or files in the project's constants directory (e.g. `app/Constants/`, `src/constants/`, `lib/constants/` — use the actual project path).
- **Never** use language-global defines or unscoped variables for project constants. Use properly scoped constants: class constants, module-level `const` exports, frozen objects, or enums depending on the project's language.

### Mandatory constant catalog
| Module | Contains |
|---|---|
| `PaginationConst` | `DEFAULT_PER_PAGE = 25`, `MAX_PER_PAGE = 100` |
| `CacheTtl` | `SHORT = 300` (5m), `MEDIUM = 900` (15m), `LONG = 3600` (1h), `DAY = 86400`, `WEEK = 604800` |
| `CachePrefix` | `USER`, `STATS`, `CONFIG`, `PERMISSIONS` — all cache key prefixes |
| `StorageConst` | `UPLOAD_PATH`, `EXPORT_PATH`, `TEMP_PATH`, `MAX_FILE_SIZE`, `ALLOWED_MIME_TYPES` |
| `DateFormat` | `DISPLAY`, `API`, `DATETIME_DISPLAY`, `DATETIME_API` — named format strings |
| `QueueTimeout` | `SHORT = 30`, `MEDIUM = 120`, `LONG = 300`, `REPORT = 600` (seconds) |
| `RetryCount` | `DEFAULT = 3`, `EMAILS = 5`, `REPORTS = 1` |
| `AuditAction` | `CREATE`, `UPDATE`, `DELETE`, `LOGIN`, `LOGOUT`, `EXPORT` |

Frontend constants (in `assets/js/constants/` or equivalent):
| Module | Contains |
|---|---|
| `Status.js` | Mirrors backend status enums — used for conditional rendering |
| `Permission.js` | All permission strings — used to check `window.authUser.permissions` |
| `Routes.js` | All named route patterns as constants — never hardcode URL paths in JS |
| `Events.js` | All custom JS event names — never hardcode event name strings in addEventListener calls |
| `CacheTtl.js` | Frontend cache durations (for local storage / session storage TTL logic) |

---

## Quality gate

A PR that introduces a hardcoded string, magic number, or raw status comparison is blocked.
ReviewDev loads this rules file automatically for every PR.
Every hardcoded user-facing string is flagged **Critical**.
Every magic number or magic status string is flagged **Important**.
Every enum without a `label()` + locale key connection is flagged **Important**.
