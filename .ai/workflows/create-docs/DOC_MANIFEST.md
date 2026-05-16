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

Quality bar: copy-pasteable for a "tech stack" slide. Every tool named, no missing dependencies.

---

## ARCHITECTURE.md
**Purpose:** Single source of truth for system structure. Orients every developer before they write a line.

Required sections:
- **System overview** — what the system does in 2–3 sentences (business, not technical)
- **Architecture pattern** — name it: Layered, Hexagonal, Event-driven, MVC, Feature-sliced, Monorepo, Microservices
- **Component map** — table or ASCII diagram of all major modules and their relationships
- **Layer boundaries** — what each layer owns; what it must NOT import or know about
- **Data flow** — how data moves through the system (read path and write path separately)
- **Key design decisions** — 2–3 decisions that shaped this architecture (link to DECISIONS.md)
- **What NOT to do** — specific anti-patterns that violate this architecture, with examples

Quality bar: a new developer can sketch the system on a whiteboard after reading this.

---

## RULES.md
**Purpose:** The non-negotiable list. Every rule uses "must" or "never" — no ambiguity.

Required sections:
- **Architecture rules** — layer crossing rules, import rules, specific to layers found in this project
- **Never do** — hard prohibitions with the reason why (1 line each)
- **Always do** — hard requirements with the reason why (1 line each)
- **Data rules** — how data may and may not be accessed, validated, exposed
- **Security rules** — minimum security requirements (cross-reference SECURITY.md)
- **Review rules** — what a reviewer must check before approving a PR

Quality bar: a linter or reviewer can verify every rule mechanically. No "prefer" or "consider".

---

## STANDARDS.md
**Purpose:** How code looks. Enforces visual and structural consistency across the entire codebase.

Required sections:
- **File naming** — one rule per file type found in this project (components, services, tests, hooks, etc.)
- **Variable and function naming** — conventions per layer and language used
- **Import order** — exact order with a real example from the project
- **Formatting** — indentation, line length, quotes, semicolons (extracted from actual config, not guessed)
- **Function size** — maximum recommended lines or cyclomatic complexity
- **Comment rules** — when to comment, when not to, how to phrase them (cite the project's style)
- **Folder structure rules** — what goes where; what is forbidden at root or in specific layers

Quality bar: a code review comment can reference a specific line in this document.

---

## PATTERNS.md
**Purpose:** Approved patterns in use. Use these — do not reinvent them.

Required sections:
- One section per pattern found in the codebase
- For each pattern:
  - **Name** and **category** (creational, structural, behavioural, architectural)
  - **When to use** — specific trigger condition for this project
  - **When NOT to use** — the most common misuse seen in this codebase
  - **Canonical example** — real code path or real file location from this project
  - **Anti-pattern** — the wrong version with a concrete explanation

Quality bar: a developer can copy the canonical example and adapt it within 5 minutes.

---

## FRONTEND.md
**Purpose:** Frontend-specific rules. Write "Not applicable" at top if no frontend layer exists.

Required sections:
- **Component structure** — file layout per component, naming convention, props typing approach
- **State management** — what goes in global state vs local state vs URL state vs server state
- **Routing** — routing approach, file-based or config-based, naming, protected route pattern
- **Data fetching** — hooks/utilities used for API calls, loading states, error states, caching
- **Styling** — CSS approach, class naming (BEM, Tailwind, CSS Modules), theming, breakpoints
- **Assets** — images, fonts, icons — where they live, how to import, optimisation rules
- **Accessibility** — minimum requirements: ARIA roles, keyboard nav, colour contrast
- **Performance** — code splitting strategy, lazy loading, bundle size budget

Quality bar: a frontend developer starting a new component has all answers here without asking.

---

## BACKEND.md
**Purpose:** Backend-specific rules. Write "Not applicable" at top if no backend layer exists.

Required sections:
- **API layer** — how routes/controllers are structured (cross-reference API_STANDARDS.md)
- **Service layer** — what services own, how they communicate, dependency injection approach
- **Repository/Data layer** — data access patterns, ORM usage rules (cross-reference DB_STANDARDS.md)
- **Middleware** — what middleware is registered and in what order; which is mandatory
- **Authentication flow** — how auth is implemented end-to-end (cross-reference SECURITY.md)
- **Background jobs** — queue/job patterns used, retry strategy, failure handling
- **Configuration** — how config is loaded, env var naming convention, required vs optional
- **Logging** — what is logged, at what level, structured format (cross-reference ERROR_HANDLING.md)

Quality bar: a backend developer can add a new API endpoint without asking anyone.

---

## DB_STANDARDS.md
**Purpose:** Database rules. Write "Not applicable" at top if no database exists.

Required sections:
- **Schema conventions** — table/collection naming (snake_case, plural, etc.), column naming rules
- **Primary keys** — strategy used: UUID, ULID, serial/sequence, CUID
- **Timestamps** — `created_at`/`updated_at` presence, timezone handling, auto-update
- **Foreign keys** — naming pattern, required indexes, cascade rules
- **Migrations** — how to create a migration, naming convention, how to run in each environment
- **Query patterns** — approved ORM/query patterns, N+1 prevention rule, raw query policy
- **Indexes** — when to add, naming convention, composite index rules
- **Soft delete** — pattern used (`deleted_at`, `is_active`, `status`) or explicit statement that hard delete is used
- **Seeding** — test data seeding approach; what is seeded in each environment

Quality bar: a DBA can enforce these rules in review without reading source code.

---

## API_STANDARDS.md
**Purpose:** API contracts and conventions. The contract between frontend and backend.

Required sections:
- **API style** — REST, GraphQL, tRPC, gRPC — whichever is used (document only what exists)
- **URL conventions** — resource naming, versioning strategy, path structure with examples
- **HTTP methods** — which method for which operation (CRUD mapping)
- **Request format** — required headers, body format, authentication header
- **Response format** — success envelope shape, pagination format, metadata fields
- **Error format** — exact error object structure, HTTP status codes used, application error codes
- **Versioning strategy** — how breaking changes are handled, deprecation policy
- **Authentication** — how API auth is passed (JWT in header, API key, session cookie, etc.)

Quality bar: a new endpoint can be designed by reading only this document, with no inconsistency.

---

## TESTING.md
**Purpose:** How testing works in this project — strategy, tools, and expectations.

Required sections:
- **Test strategy** — unit / integration / e2e — which layer covers what scenarios
- **Coverage requirements** — minimum coverage percentage per layer (or explicit "no requirement")
- **File naming** — test file naming convention and where tests live (co-located or `__tests__/`)
- **Test structure** — Arrange / Act / Assert structure (or Given / When / Then)
- **Mocking rules** — what to mock, what not to mock, which mock library is used
- **Fixtures and factories** — how test data is created; factory files location
- **E2E** — tool used (Playwright, Cypress, etc.), what scenarios are covered, how to run
- **Running tests** — exact commands for unit, integration, e2e, and coverage
- **What makes a bad test** — specific anti-patterns found or to avoid in this codebase

Quality bar: a developer writing their first test in this project has all answers here.

---

## SECURITY.md
**Purpose:** Security requirements. Every rule here is a blocker in code review.

Required sections:
- **Authentication** — mechanism (JWT, session, OAuth, API key), token handling, expiry policy
- **Authorisation** — RBAC/ABAC model, where permission checks happen, middleware used
- **Input validation** — where validation happens (controller, service, schema), libraries used
- **Output encoding** — XSS prevention approach, Content-Security-Policy, content-type headers
- **Secrets management** — where secrets live, how they are loaded, what is strictly forbidden
- **Dependency hygiene** — audit process (`npm audit`, Dependabot, Snyk), update policy
- **CORS** — allowed origins, allowed methods, allowed headers, credentials flag
- **Rate limiting** — implemented where, which library, limits per endpoint type
- **Known risks** — any known vulnerabilities, TODOs, or areas needing security attention

Quality bar: a security reviewer can use this as a checklist without reading source code.

---

## DESIGN_SYSTEM.md
**Purpose:** UI consistency rules. Write "Not applicable" at top if no frontend layer exists.

Required sections:
- **Design tokens** — colours, spacing, typography — source of truth (CSS variables, Tailwind config, theme file)
- **Component library** — which components exist, where they live, how to use them, how to add new ones
- **Icons** — library used, where custom icons live, how to add a new icon
- **Typography** — font faces, scale levels, usage rules (heading hierarchy, body text, labels)
- **Colour system** — semantic colour names (primary, danger, muted, etc.), dark/light mode support
- **Spacing system** — spacing scale values, when to use which value, forbidden magic numbers
- **Breakpoints** — responsive breakpoint values and naming (sm, md, lg, xl, etc.)
- **Animation** — motion tokens, duration values, easing curves, reduced-motion rule

Quality bar: a designer and developer can collaborate using the same vocabulary with no ambiguity.

---

## WORKFLOWS.md
**Purpose:** Dev process — how work moves from a task to a merged PR.

Required sections:
- **Branch naming** — convention with real examples: `feature/`, `fix/`, `chore/`, `hotfix/`
- **Commit messages** — format, scope rules, tools (commitlint, husky), examples
- **Pull request process** — how to raise a PR, required reviewers, approval count, draft vs ready
- **Code review checklist** — what a reviewer checks (link to RULES.md)
- **Merge strategy** — squash / rebase / merge — which is used and why
- **Release process** — how releases are cut, tagged, and deployed (automated or manual)
- **Hotfix process** — emergency change process, branch from, how to deploy

Quality bar: a new joiner can raise their first PR without asking anyone.

---

## DEPLOYMENT.md
**Purpose:** How the system gets to production — and back if something goes wrong.

Required sections:
- **Environments** — all named environments (dev, staging, prod, etc.) and what differs between them
- **CI/CD pipeline** — stages in order, what each does, what triggers each stage
- **Build process** — how the app is built for each environment, build-time variables
- **Secrets in CI** — which secrets exist, where they are configured, how to rotate them
- **Deployment steps** — step-by-step for a normal deploy (automated or manual steps clearly marked)
- **Rollback procedure** — how to roll back a bad deploy, decision criteria, time budget
- **Health checks** — how to verify a deploy succeeded, what endpoints or checks are used
- **Monitoring** — what is monitored, what alerts exist, who is paged

Quality bar: an ops engineer can deploy or roll back without developer help.

---

## ERROR_HANDLING.md
**Purpose:** Consistent error strategy across the entire codebase.

Required sections:
- **Error taxonomy** — categories with names: Validation, Authentication, Authorisation, NotFound, Conflict, ExternalService, Internal
- **Error object shape** — exact fields on every error (code, message, details, traceId, httpStatus)
- **HTTP status codes** — mapping of each error category to HTTP status used in this project
- **Logging levels** — debug / info / warn / error — exact trigger condition for each
- **Log format** — structured fields (timestamp, level, traceId, userId, message, context), PII rules
- **User-facing messages** — rules for what to show vs hide from end users; default fallback message
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

## ONBOARDING.md
**Purpose:** Get a new developer productive in one hour.

Required sections:
- **Prerequisites** — software to install before cloning (OS, Node version, Docker, etc.)
- **Setup steps** — numbered, complete steps from `git clone` to `npm run dev` (or equivalent)
- **Environment variables** — table: variable name | purpose | where to get the value
- **Project structure tour** — 5-minute walk-through of where to find things
- **First PR checklist** — what to do before raising a first PR (tests, lint, docs, etc.)
- **Key contacts** — who owns what (role names, not personal — or Slack channels)
- **Common problems** — 3–5 common setup issues with their exact fix

Quality bar: a new joiner is running the app locally within one hour using only this document.

---

## PERFORMANCE.md
**Purpose:** Performance standards — prevents slow-by-design code from reaching production.

Required sections:
- **Budgets** — response time targets per API tier (p50, p95, p99), page load budget, bundle size budget
- **Database** — max query time, index requirements for queries on large tables, pagination requirements
- **Caching** — what is cached, where, TTL, invalidation strategy
- **Frontend** — Core Web Vitals targets (LCP, CLS, FID/INP), lazy-loading rules, image optimisation
- **Known hot paths** — list of endpoints or operations that are performance-sensitive (must be flagged in review)
- **Profiling** — how to profile locally (commands), which APM tool is used in production
- **Anti-patterns** — specific patterns forbidden for performance: N+1 queries, synchronous I/O in hot paths, etc.

Quality bar: a reviewer can flag a performance regression without running a benchmark.

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

## Document update triggers

Use this table when deciding which documents to regenerate after a code change.
Run `/evyasys:CreateDocs --retrain` to regenerate only the affected documents.

| Trigger event | Documents to regenerate |
|---|---|
| New dependency added / removed | `STACK.md`, `ONBOARDING.md` |
| Framework version major bump | `STACK.md`, `DECISIONS.md`, affected layer doc |
| Lint / formatter config changed | `STANDARDS.md` |
| Database schema migration | `DB_STANDARDS.md` |
| New API endpoint pattern introduced | `API_STANDARDS.md`, `BACKEND.md`, `PATTERNS.md` |
| New frontend component pattern | `FRONTEND.md`, `PATTERNS.md`, `DESIGN_SYSTEM.md` |
| Auth / security model changed | `SECURITY.md`, `BACKEND.md` |
| New test approach adopted | `TESTING.md` |
| CI/CD pipeline changed | `DEPLOYMENT.md`, `WORKFLOWS.md` |
| New environment added | `DEPLOYMENT.md`, `ONBOARDING.md` |
| Significant folder restructure | `ARCHITECTURE.md`, `PATTERNS.md`, `STANDARDS.md` |
| New error handling pattern | `ERROR_HANDLING.md`, `BACKEND.md` |
| Performance budget revised | `PERFORMANCE.md` |
| New major architectural decision | `DECISIONS.md`, `ARCHITECTURE.md` |
| New team member onboarding reveals gaps | `ONBOARDING.md`, `GLOSSARY.md` |
| Code review finds recurring pattern | `PATTERNS.md`, `RULES.md` |
