# Rules: Authentication and RBAC (Role-Based Access Control)

Applies to every project that has user authentication. Clear, consistent, centrally maintained.
Every rule uses "must" or "never" — no ambiguity. Violations block merge.

---

## Core principle

Roles group permissions. Permissions grant access to actions on resources.
Permission checks happen in exactly one layer per check type.
The definition of who can do what lives in one place and is enforced everywhere — middleware, service, and UI — from the same source of truth.

---

## Role and permission definitions

- All roles must be defined in a `UserRole` enum or constant module. **Never** compare against a role name string literal.
- All permissions must be defined in a `Permission` enum or constant module using `{resource}:{action}` naming: `user:create`, `user:read`, `user:update`, `user:delete`, `report:export`, `settings:manage`.
- The role → permission mapping must be defined in exactly one place: a seed script, fixture file, or initialisation migration (the project's "role-permission seeder") that populates the permissions table. **Never** hardcode role-permission relationships in middleware, controllers, or config files.
- Adding a new permission requires: (1) add to the `Permission` constant/enum, (2) add locale label in the permissions locale file, (3) add to the role-permission seeder for each role that should have it, (4) add guard in the appropriate middleware/policy, (5) add visibility control in the relevant view/frontend component.
- **Never** create a permission that is not declared in the `Permission` constant/enum first.
- Role names must match between the `UserRole` enum/constant, the `roles` table, and any config file. Three sources, one set of values.

---

## Authentication rules

- Sessions must use a server-side session store (Redis or database). **Never** use file-based sessions in multi-server deployments.
- Authentication tokens (API tokens, remember-me tokens) must be stored hashed — never plain text.
- **Never** store authentication state in localStorage or sessionStorage for web applications. Use httpOnly session cookies.
- For API authentication: use Bearer tokens (stateless). Tokens must be hashed in the database. Token expiry must be enforced.
- Login attempts must be rate-limited. After N failed attempts (configurable via `AuthConst.MAX_LOGIN_ATTEMPTS`), the account must be locked for `AuthConst.LOCKOUT_MINUTES` minutes.
- Logout must invalidate the server-side session and rotate the CSRF token.
- Password reset tokens must expire after `AuthConst.PASSWORD_RESET_EXPIRY` minutes and be single-use.
- Passwords must be hashed using the framework's recommended algorithm (bcrypt minimum cost 12, or Argon2id). **Never** store or log plain-text passwords.
- Multi-factor authentication (if implemented) must be enforced via middleware — never checked ad-hoc inside a controller action.

---

## Authorisation guard placement rules

There are exactly three authorisation check points — each checks a different thing:

**1 — Route middleware (first line of defence):**
- Must check: is the user authenticated? Does the user's role have the permission required for this route group?
- Applied to: route groups or individual routes via named middleware.
- Must use: the framework's middleware mechanism — not manual checks inside the controller.
- Example (language-agnostic): apply `auth` + `can:user:read` middleware to the users list route.

**2 — Service layer (ownership and business rule checks):**
- Must check: does this authenticated user own or have access to the specific resource being acted upon?
- Applied to: any service method that operates on a resource that belongs to a specific user or organisation.
- Example (pseudocode): `if record.owner_id != actor.id AND NOT actor.can(Permission.ADMIN_ACCESS) → throw AuthorisationException`.
- **Never** skip ownership checks in the service layer because the middleware "already checked" — middleware checks role-level access; service checks resource-level access.

**3 — View / frontend layer (visibility control):**
- Must check: does the current user have the permission to see a button, link, or panel?
- Applied to: every UI element that triggers a restricted action — must be conditionally rendered based on the user's permissions.
- Must use: the same permission system as the backend (not a separate hardcoded list in the view).
- Backend templates: use the framework's template guard syntax (e.g. `@can`, `{% if user.can(...) %}`, or equivalent).
- Frontend (JS): `window.authUser.permissions` is injected server-side; `Permission.USER_CREATE` constant is checked in JS.

**Never** duplicate these three checks or mix their concerns:
- Route middleware must NOT perform ownership checks (it doesn't have the record yet).
- Service layer must NOT check role-level access (that belongs in middleware).
- Views must NOT be the only place a permission is checked (views can be bypassed).

---

## Permission check implementation rules

- **Never** check the user's role directly in business logic using a string literal. Use the enum/constant: `user.role === UserRole.ADMIN` → always use the constant, never `user.role === 'admin'`.
- **Never** check permissions by comparing raw strings. Use the constant: `Permission.SOME_ACTION` — never `'admin'` or `'user.create'` as a literal.
- The `can()` method (or equivalent permission-check helper) on the user model/object must resolve from the loaded permission list (eager-loaded or cached) — **never** make a DB query per call. User permissions are loaded once at login and cached for `CacheTtl.MEDIUM`.
- **Never** grant a permission by role name inside a controller action. Permission resolution lives in the user model/service and the role-permission seeder.
- Super-admin bypass (if used): must be a named constant check (`UserRole.SUPER_ADMIN`) in the permission check implementation — not scattered checks across the codebase.

---

## RBAC data model rules

- The permission system must use these tables (or their equivalent, documented in `RBAC.md`):
  - `roles` — `id`, `name` (matches `UserRole` constant), `display_name` (locale key), `description`, `created_at`, `updated_at`
  - `permissions` — `id`, `name` (matches `Permission` constant, format `{resource}:{action}`), `display_name` (locale key), `group` (resource name), `created_at`
  - `role_permissions` — `role_id`, `permission_id` (pivot — source of truth for role→permission mapping)
  - `user_roles` — `user_id`, `role_id` (pivot — a user may have multiple roles)
- **Never** assign permissions directly to users. Permissions are assigned to roles; roles are assigned to users.
- **Never** hardcode role IDs or permission IDs. Always look up by name using the enum/constant value.
- The `roles` and `permissions` tables are seeded via the project's role-permission seed script. Changes to role-permission assignments require a new seed or migration — not a one-off database edit.

---

## Audit and session security rules

- Every authentication event must be written to an audit log: `LOGIN`, `LOGOUT`, `LOGIN_FAILED`, `PASSWORD_CHANGED`, `ROLE_CHANGED`, `PERMISSION_GRANTED`, `PERMISSION_REVOKED`.
- Audit log entries must include: `user_id`, `action` (from `AuditAction` enum/constant), `ip_address`, `user_agent`, `created_at`. **Never** include the password or token in an audit entry.
- Session fixation: regenerate the session ID on every successful login.
- CSRF protection: must be active on all non-GET routes. The `BaseAjax` frontend module must include the CSRF token on every AJAX request automatically.
- **Never** disable CSRF protection on an authenticated route, even temporarily.

---

## Frontend RBAC integration

- The server injects the authenticated user's resolved permission list into every authenticated page response: `window.authUser = { id, name, roles: [], permissions: [] }`. The permissions array contains `Permission` constant values (`'user:create'`, `'report:export'`, etc.).
- All frontend permission checks use the `Permission.js` constants: `window.authUser.permissions.includes(Permission.USER_CREATE)`.
- **Never** trust the frontend `window.authUser.permissions` as the sole permission check. It is a UI convenience only — the backend middleware and service layer enforce the actual access control.
- UI elements that create, update, or delete must be conditionally rendered: if the user lacks the permission, the button/link must not appear in the DOM — not just be disabled or hidden with CSS. Disabled UI can be enabled by the user via browser dev tools.
- Table action columns: render only the actions the current user is permitted to perform. An empty action column is correct — a column showing all actions regardless of permission is a **Critical** violation.

---

## AuthConst constants (mandatory)

The following constants must exist in an `AuthConst` module (exact file location depends on the project's language and structure — document in `RBAC.md`):

| Constant | Purpose | Example value |
|---|---|---|
| `MAX_LOGIN_ATTEMPTS` | Max failed logins before lockout | 5 |
| `LOCKOUT_MINUTES` | Account lockout duration | 15 |
| `PASSWORD_RESET_EXPIRY` | Reset token lifetime (minutes) | 60 |
| `SESSION_LIFETIME` | Session duration (minutes) | 120 |
| `TOKEN_EXPIRY_DAYS` | API token lifetime | 30 |
| `PASSWORD_MIN_LENGTH` | Minimum password length | 8 |
| `BCRYPT_COST` | Password hashing cost factor | 12 |

---

## Quality gate

ReviewDev loads this rules file for every PR.
A raw role string comparison (`=== 'admin'`) is flagged **Critical**.
A permission check missing from the middleware that IS present in the view only is flagged **Critical**.
A service method that accesses a resource without an ownership check is flagged **Critical**.
An action button rendered regardless of user permissions is flagged **Critical**.
A direct DB query inside the permission check that fires per call (N+1 on permissions) is flagged **Important**.
Any permission string not defined in the `Permission` constant/enum is flagged **Important**.
