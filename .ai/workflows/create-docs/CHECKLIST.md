# TrainDocs Checklist

## Phase 1 — Scan completeness

- [ ] `package.json` (or equivalent manifest) read — full dependency list and scripts extracted
- [ ] TypeScript / compiler config read (if present)
- [ ] Linting config read (if present)
- [ ] Formatter config read (if present)
- [ ] Test framework config read (if present)
- [ ] E2E test config read (if present — Playwright, Cypress, etc.)
- [ ] Database schema / ORM config read (if present)
- [ ] CI/CD pipeline config read (if present)
- [ ] Container config read (if present — `docker-compose.yml`, `Dockerfile`)
- [ ] `README.md` and `CONTRIBUTING.md` read
- [ ] Design system config read: `tailwind.config.*` / `globals.css` / `src/tokens/**` (if present)
- [ ] Component library detected and representative files sampled (`src/components/ui/**` or equivalent)
- [ ] Storybook stories read for documented variants (if present — `*.stories.*`)
- [ ] i18n / locale config and locale files read (if present)
- [ ] At least 3 representative source files sampled per layer found in the project
- [ ] `.env.example` read — all environment variables extracted
- [ ] Nginx config read (if present — `nginx.conf`, `nginx/sites-available/*`)
- [ ] Process supervisor config read (if present — Supervisor, PM2, systemd service files)
- [ ] Central scheduler / cron config read (scheduler file, crontab, systemd timer)
- [ ] Backup scripts read (if present — `scripts/backup*`, `bin/backup*`)
- [ ] Health check route scanned — look for `/health`, `/ping`, `/status` endpoints

## Phase 2 — Analysis quality

- [ ] Architecture pattern named specifically (not "unknown" or "standard MVC")
- [ ] All naming conventions identified per file type (components, services, tests, etc.)
- [ ] Design patterns found in code listed by name and example location
- [ ] Gaps, inconsistencies, and risks identified and documented in the relevant files
- [ ] Technology inventory is complete — no framework or tool left unnamed
- [ ] Design token values extracted: actual colour hex values, spacing scale values, breakpoints — not library defaults
- [ ] Component library identified by detection signals (shadcn/ui, MUI, Chakra, Ant Design, Radix, AdminLTE, custom)
- [ ] UX patterns detected: loading states, toast/notification library, form library, state management, error boundaries, empty states
- [ ] Infrastructure state documented: Nginx config values, worker counts, Redis config, DB server config (or flagged as not found)
- [ ] All environment variables catalogued from `.env.example`
- [ ] All scheduled jobs catalogued with cron expressions and failure behaviours
- [ ] Backup procedure documented (or flagged as critical gap if absent)
- [ ] Health check endpoint documented (or flagged as gap)

## Phase 3 — Document quality (check every document)

For each of the 37 documents generated:
- [ ] No placeholder text (`[TODO]`, `[TBD]`, `<insert here>`)
- [ ] Every rule or convention has a concrete example from this project (real file path, real value, real command)
- [ ] Sections with no evidence are explicitly marked "Not applicable — [specific reason]"
- [ ] Cross-references to related documents are included where relevant
- [ ] Document is specific to this project — not generic internet advice
- [ ] Self-hosted constraint respected: no cloud-specific services assumed (no S3, no RDS, no SQS unless detected)

## Phase 4 — Specific document checks

### Core layer docs
- [ ] **STACK.md** — every framework and tool listed with exact version numbers
- [ ] **ARCHITECTURE.md** — pattern named, layer boundaries defined, ASCII folder tree with real directory names, anti-patterns listed
- [ ] **RULES.md** — every rule uses "must" / "never" — no "consider" or "prefer"
- [ ] **STANDARDS.md** — naming rules match actual file names found in the scan
- [ ] **PATTERNS.md** — every pattern has a canonical example referencing a real file path
- [ ] **EXTENSION_PATTERNS.md** — base class hierarchy documented with actual file paths; all wrappers listed; refactor debt items named
- [ ] **LOCALISATION.md** — enum catalog complete with label/values completeness; constants catalog lists all modules found; hardcoded violations flagged
- [ ] **DTO_STANDARDS.md** — request DTO catalog and response DTO catalog populated with actual class names; API envelope shapes shown with real JSON
- [ ] **RBAC.md** — complete role definitions and permission catalog from actual code; guard placement documented per layer; can() implementation described
- [ ] **CONFIGURATION_MANAGEMENT.md** — every env var from `.env.example` documented; per-environment table shows actual differences; secrets policy stated

### Quality and testing
- [ ] **TESTING.md** — exact commands to run each test type included
- [ ] **SECURITY.md** — auth mechanism documented; HTTP security headers listed with actual values; server hardening rules stated
- [ ] **ERROR_HANDLING.md** — error taxonomy complete; log format specified with all JSON fields; alerting mechanism documented
- [ ] **PERFORMANCE.md** — performance budgets stated; application server worker formula applied; database server config values documented; anti-patterns listed

### UI / design
- [ ] **DESIGN_SYSTEM.md** — actual token values extracted; component library named with variants from real component files; consistent with UI_UX_STANDARDS.md
- [ ] **UI_UX_STANDARDS.md** — loading/error/empty states documented from actual patterns; tokens used match DESIGN_SYSTEM.md
- [ ] **ADMINLTE.md** — if detected: version confirmed, layout variant documented, all 21 sections populated; if not detected: marked "Not applicable"

### Operations (self-hosted — critical)
- [ ] **INFRASTRUCTURE.md** — Nginx server block documented (or baseline spec if no config found); process supervisor config documented; Redis and DB config documented; health check endpoint documented; service management commands listed
- [ ] **SCHEDULER.md** — every scheduled job listed in the catalog with cron expression, description, estimated duration, and failure behaviour; if none exist: stated explicitly
- [ ] **BACKUP_RECOVERY.md** — database backup script path, schedule, and retention documented; file backup documented; at least one recovery scenario (Scenario A) written with exact commands; RPO and RTO stated
- [ ] **OBSERVABILITY.md** — health check URL documented; uptime monitoring tool named (or gap flagged); metrics table shows alert thresholds; log paths listed; runbook §9 populated
- [ ] **DEPLOYMENT.md** — self-hosted deploy process documented step-by-step; zero-downtime strategy documented; pre/post-deploy checklists provided; rollback procedure documented

### Knowledge and onboarding
- [ ] **WORKFLOWS.md** — branch naming convention documented with real examples; commit format documented; PR process documented
- [ ] **DECISIONS.md** — at least one ADR per major technology choice identified
- [ ] **ONBOARDING.md** — setup steps complete from `git clone` to running app; env var table included; common problems section populated
- [ ] **GLOSSARY.md** — at least 10 domain-specific terms with definitions
- [ ] **DB_STANDARDS.md** — real table/column naming from the schema (if DB exists)
- [ ] **API_STANDARDS.md** — real endpoint structure and real response format documented

### Supplementary micro-level docs
- [ ] **fe/STYLING_MICRO_STANDARDS.md** — token file path identified; complete token catalogue; all CSS architecture rules stated. If no frontend: marked Not applicable.
- [ ] **fe/HOOKS_DEEP_RULES.md** — all 8 hook contract rules; useEffect rules; memoization decision tree. If no React frontend: marked Not applicable.
- [ ] **fe/DEPENDENCIES_WORKFLOW.md** — approved library table from `package.json`; new-dep checklist; bundle size limits. If no frontend: marked Not applicable.
- [ ] **UNIT_TESTING_COMPLETE.md** — coverage thresholds from test config; test structure from real test files; factory pattern for a real entity
- [ ] **be/MICRO_STANDARDS_BE.md** — controller/service/repository contracts with ✅ correct and ❌ wrong examples; transaction ownership rule. If no backend: marked Not applicable.

## Phase 5 — Output format

- [ ] Every document wrapped with `<!-- EVYADOC: FILENAME.md -->` delimiter
- [ ] All 37 documents present in the output (or explicitly marked Not applicable with reason)
- [ ] Documents generated in the order specified in PROMPT.md (STACK.md first, operations cluster together)
- [ ] Preview summary table shown to user before confirmation
- [ ] Self-hosted infrastructure documents (INFRASTRUCTURE.md, BACKUP_RECOVERY.md, OBSERVABILITY.md, SCHEDULER.md) are NOT marked "Not applicable" unless the project is confirmed PaaS
