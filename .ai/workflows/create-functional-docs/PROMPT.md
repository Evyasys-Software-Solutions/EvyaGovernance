# Prompt: /evyasys:CreateFunctionalDocs [ModuleName | --all | --update ModuleName]

You are the Business Analyst / Functional Documentation Specialist described in `AGENT.md`.

---

## Inputs

- `$ARGUMENTS` — module name, `--all`, `--update <ModuleName>`, or empty
- Project source: controllers, services, repositories, models, request DTOs, routes, views, migrations, seeders, locale/translation files, role/permission seed scripts
- Existing functional docs: `.evyasys/docs/functional/` (if any)
- Module template: `MODULE_TEMPLATE.md` from this workflow directory
- Permission reference: `.evyasys/docs/RBAC.md` (if exists)
- Locale/label reference: `.evyasys/docs/LOCALISATION.md` (if exists)

---

## Step 0 — Pre-flight

### 0a. Parse arguments and determine mode

| `$ARGUMENTS` | Mode | Action |
|---|---|---|
| Empty | Interactive | Detect modules, show list, ask which to document |
| `--all` | Batch | Generate for all detected modules |
| `ModuleName` | Single | Generate one module by name |
| `--update ModuleName` | Update | Update existing doc, extending without removing valid content |

### 0b. Detect business modules

Scan the codebase to identify business modules. Use this detection order:

1. **Controllers directory** — group by resource name (e.g. `UserController` → `UserManagement`, `OrderController` → `Orders`)
2. **Services directory** — group by domain (e.g. `BillingService` → `Billing`)
3. **Routes file** — identify route groups (e.g. `Route::prefix('reports')` → `Reports`)
4. **Views directory** — group top-level sections (e.g. `views/products/` → `Products`)

Deduplicate across directories. Merge related names (e.g. `User` + `UserManagement` → `UserManagement`).

Show the detected module list and ask the user to confirm or modify before proceeding (skip confirmation in `--all` mode).

### 0c. Check existing docs

Check `.evyasys/docs/functional/` for existing files.

- `--update` mode: read the existing doc and treat it as a baseline — only add or correct, never remove valid content.
- Generate mode: if a doc already exists for this module, warn and ask: "A doc for [ModuleName] already exists. Overwrite or update?"

---

## Step 1 — Module source scan (for each module being documented)

Read all code related to the module. Cover every layer:

| Layer | What to read | What to extract |
|---|---|---|
| Routes | Route definitions for this module | All endpoints and their HTTP methods, middleware groups applied (auth, role, permission guards) |
| Controller(s) | Every action method | What user-triggerable actions exist; which actions are gated by middleware or policy checks |
| Request DTOs / Form Requests | Validation rules | Every field, its validation rules (required, type, max, unique, etc.), and the rule's error message if documented |
| Service(s) | Business logic methods | Business rules, calculations, decisions, state transitions, automatic triggers (emails, events, notifications) |
| Repository / Model | Scopes, relationships | Ownership scopes (e.g. `whereUserId`), soft delete, relevant model relationships |
| Role/permission seed script | Role→permission mapping | Which roles have which permissions for this module |
| Locale/translation files | Error messages, labels | Actual user-visible messages for validation errors and action outcomes |
| Migrations | Table schema | All fields with their types, nullable/required, defaults, foreign keys |
| Notification/event classes | Events emitted | What triggers a notification/event and what it contains |

> Do not summarise the code. Extract the specific facts that will go into the functional doc:
> - Exact validation rules
> - Exact role/permission names
> - Exact user-visible error messages (from locale files when available)
> - Exact state machine transitions
> - Exact trigger conditions for notifications

---

## Step 2 — Generate the functional document

Fill `MODULE_TEMPLATE.md` section by section using only the evidence from Step 1.

### Quality rules for every section

| Rule | Description |
|---|---|
| No code references | Never name classes, methods, or file paths |
| Specific values | Exact role names, exact field names, exact error messages — no generic placeholders |
| Evidence-based | Every claim traces back to code found in Step 1 |
| Self-contained | Each section must be readable in isolation without context from other sections |
| Not applicable | If a section has no evidence (e.g. module has no workflows), write `> Not applicable — [reason].` |
| Scenarios | Every business logic rule must include at least one concrete scenario |

### Section-by-section guidance

**Module Overview** — answer: what problem does this module solve, who uses it, and what is the main thing it produces? Three sentences maximum.

**Entities** — extract from migrations and models. List every entity the module directly owns (not just references). For each: plain-language description, key fields (not all fields — just the ones that matter to a business user), and all status values if a status field exists.

**Access & Permissions** — extract from route middleware, controller policies, and role/permission seed. Build the table row-by-row. For special restrictions (own records only, department-scoped), write them as plain-language rules below the table.

**Validations** — extract from Request DTOs or validation rules in controllers/services. Group by the action they apply to. Use the exact error message from locale files when available; infer from the rule when not.

**Actions** — derive from controller action methods and service calls. For each action: who can do it (role from permissions), what preconditions must be true, what the system does (from service logic), and what the user/system observes as the outcome.

**Business Logic** — this is the most important section. Derive from service methods that make decisions, apply calculations, change state, or trigger events. Group related rules. For each group: describe the rule, then give at least one concrete "when X then Y" scenario.

**Workflows** — derive from multi-step service flows, state machine transitions, or approval chains. If no workflow exists, skip this section with `> Not applicable`.

**Error Scenarios** — derive from exception handling in services and controllers, from locale error messages, and from validation constraint logic. Cover: duplicate record, permission denied, missing dependency, external service failure.

**Integration Points** — derive from event emissions, notification dispatches, external API calls, and cross-module service injections.

**Glossary** — domain terms that appear in the code but might confuse a non-technical reader. Derive from model attribute names, status constants, and business logic variable names.

---

## Step 3 — Self-review

Before showing output, verify:
- [ ] No class names, method names, or file paths in the output
- [ ] Every table cell is filled — no blank `|` — or explicitly marked N/A
- [ ] Every permission restriction states the exact role name from the codebase
- [ ] Every validation rule states the exact constraint (max length as a number, not "a maximum")
- [ ] At least one scenario example per business logic rule
- [ ] Every workflow step states who acts (role or system) and what the outcome is
- [ ] Module Overview can be read in isolation and makes sense without the rest of the document

---

## Step 4 — Preview and confirm

Show a summary table:

| Section | Content documented |
|---|---|
| Entities | [list entity names and status values found] |
| Roles covered | [list exact role names from permission scan] |
| Validations | [N rules documented across M actions] |
| Actions | [N actions documented] |
| Business logic | [N rules across M logical areas] |
| Workflows | [N workflows / Not applicable] |
| Error scenarios | [N scenarios] |
| Integrations | [N integration points] |

Ask: **"Ready to write this functional doc for [ModuleName] to `.evyasys/docs/functional/`?"**
Wait for explicit confirmation.

---

## Step 5 — Output format

Wrap each module's document with the delimiter the hook uses to parse and write:

```
<!-- EVYAFUNCDOC: ModuleName.md -->
[full document content]
```

Do not include a closing delimiter. The hook splits on the opening delimiter.

Output one block per module. When generating multiple modules (`--all`), emit all blocks in a single response, one after another.

After all module blocks, append the index manifest:

```
<!-- EVYAFUNCDOCINDEX
[
  { "name": "ModuleName", "file": "ModuleName.md", "summary": "1-sentence description" },
  { "name": "AnotherModule", "file": "AnotherModule.md", "summary": "1-sentence description" }
]
-->
```

The hook uses this to build `functional/INDEX.md`.

---

## Update-mode behaviour (`--update ModuleName`)

1. Read the existing `.evyasys/docs/functional/ModuleName.md`.
2. Treat its current content as the baseline — validated by a previous scan.
3. Re-scan the module source (Step 1) for changes since last generation.
4. For each section: add new findings, correct findings that the code no longer supports, keep all findings the code still confirms.
5. Never remove a rule that the code still enforces. Never reduce the number of documented scenarios.
6. Add a `> Updated: YYYY-MM-DD — [brief note on what changed]` line at the top of each section that was modified.
