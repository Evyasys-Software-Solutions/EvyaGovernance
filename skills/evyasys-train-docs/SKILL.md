---
name: evyasys-train-docs
description: Use this skill to scan the entire project and generate comprehensive quality-gate documentation into .evyasys/docs/. Produces up to 37 documents covering architecture, extension hierarchy, localisation/enums/constants, DTOs and request-response standards, RBAC and authentication, base classes, infrastructure wrappers, patterns, testing, security, self-hosted infrastructure (Nginx, process supervisor, Redis, DB server, SSL, firewall), backup and recovery (scripts, RPO/RTO, recovery scenarios), observability (health checks, uptime monitoring, metrics, alerting runbook), configuration management (env vars, secrets, per-environment differences), scheduled tasks (job catalog, failure handling), deployment, design system, UI/UX standards, AdminLTE template rules (auto-detected), styling tokens, hook rules, dependency governance, unit testing standards, and backend micro-contracts. All new development must follow these documents — they are loaded by /evyasys:StartDev at Step 0 before any technical opinion is formed. Triggered by `/evyasys:TrainDocs`.
trigger: /evyasys:TrainDocs
---

# Skill: evyasys-train-docs

## What it scans

- **Tech stack**: `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Dockerfile*`
- **Source structure**: all `src/`, `app/`, `lib/`, `components/`, `pages/`, `api/`, `services/`, `models/` trees
- **Tooling config**: ESLint, Prettier, Jest/Vitest, Playwright, Tailwind, Prisma, TypeScript
- **CI/CD**: GitHub Actions workflows, Azure Pipelines, Jenkinsfile
- **AdminLTE** (auto-detected): `adminlte/dist/`, `assets/css/variables.css`, `assets/css/custom.css`, `assets/js/app.js`, base layout template, sidebar template, plugin directory
- **Extension architecture**: core/foundation directories (`app/Core/`, `src/core/`, `lib/base/`, or equivalent), `app/Exceptions/`, `assets/js/core/`, infrastructure wrappers (StorageService, CacheService, MailerService, QueueService, Logger), all repositories/services/controllers (extension compliance check)
- **Localisation + constants**: `lang/`, `locales/`, `resources/lang/`, `i18n/`, enum directories (`app/Enums/`, `src/enums/`, or equivalent), constant directories (`app/Constants/`, `src/constants/`, or equivalent), `assets/js/constants/`, `assets/js/locales/`, hardcoded string/magic number scan across sampled files
- **DTOs**: request/input directories (`{src}/requests/`, `{src}/dtos/`, `{src}/schemas/`, or equivalent), response/resource directories, `BaseApiController` response builders, raw-value boundary violation scan
- **RBAC**: role and permission enum/constant files, role-permission seed script or fixture, auth guard/middleware directories, `user.can()` or equivalent implementation, route/endpoint middleware coverage check, RBAC table migrations
- **Infrastructure**: `nginx.conf`, `nginx/sites-available/*`, Supervisor config (`/etc/supervisor/conf.d/*`), PM2 config (`ecosystem.config.js`), systemd service files, `Procfile`, `docker-compose.yml`
- **Configuration**: `.env.example`, `.env.staging`, `.env.production` (names only — never content), framework config directory
- **Scheduler**: central scheduler file (e.g. `app/Console/Kernel.php`, `src/scheduler.js`, `crontab`, or equivalent), jobs directory, cron config
- **Backup**: `scripts/backup*`, `bin/backup*`, any backup shell scripts in the project root or ops directory
- **Health checks**: routes/endpoints matching `/health`, `/ping`, `/status`, `/healthz`
- **Code sampling**: 3–5 representative files per layer (components, routes, services, data, tests, utils)
- **Existing docs**: `README.md`, `CONTRIBUTING.md`, `docs/`

## What it produces

All documents written to `.evyasys/docs/`:

| Document | Purpose |
|---|---|
| `ARCHITECTURE.md` | System structure, layers, component map, data flow, anti-patterns |
| `STACK.md` | Full technology inventory with versions and justifications |
| `RULES.md` | Non-negotiable coding rules — violations block merge |
| `STANDARDS.md` | Code style, naming, formatting, file organisation |
| `LOCALISATION.md` | Locale file structure (backend + frontend), enum catalog with label/values/options completeness, constants catalog, frontend constant modules, hardcoded string and magic number refactor debt |
| `PATTERNS.md` | Approved design patterns with canonical examples from this project |
| `EXTENSION_PATTERNS.md` | Full extension hierarchy (base classes, traits, wrappers), frontend base modules, plugin wrapper catalog, non-cloud infrastructure wrappers, cache/queue/storage conventions, scalability config, refactor debt list |
| `DTO_STANDARDS.md` | Request DTO catalog (fields, validation, casting), Response DTO catalog (exposed/hidden fields), API envelope shapes (success/error/paginated), web response patterns, pagination standards, DTO boundary violation debt |
| `RBAC.md` | Authentication mechanism, complete role definitions, full permission catalog with role mapping, guard placement (middleware/service/view), User::can() implementation, audit log schema, RBAC data model, frontend permission integration, security checklist |
| `FRONTEND.md` | Component structure, state, routing, styling, assets, accessibility |
| `BACKEND.md` | API layer, services, middleware, auth flow, logging, config |
| `DB_STANDARDS.md` | Schema conventions, migrations, query patterns, indexes |
| `API_STANDARDS.md` | API contracts, versioning, request/response format, error codes |
| `TESTING.md` | Test strategy, coverage requirements, naming, mocking, commands |
| `SECURITY.md` | Auth/authz model, input validation, HTTP security headers (HSTS, CSP, X-Frame-Options with exact values), server hardening (SSH, firewall, file permissions, DB privileges), OWASP requirements |
| `DESIGN_SYSTEM.md` | UI tokens, component library, typography, colour, breakpoints |
| `UI_UX_STANDARDS.md` | Loading/error/empty states, forms, toast patterns, keyboard nav, accessibility baseline |
| `ADMINLTE.md` *(if detected)* | AdminLTE version, folder structure, load order, CSS token system, layout skeleton, sidebar, navbar, card system, widget catalog, plugin catalog, responsive matrix, page templates |
| `WORKFLOWS.md` | Branching, commit format, PR process, merge strategy, release |
| `DEPLOYMENT.md` | Self-hosted deploy process (step-by-step), zero-downtime strategy, pre/post-deploy checklists, maintenance mode, rollback procedure |
| `ERROR_HANDLING.md` | Error taxonomy (with HTTP status codes), exception hierarchy, log format (JSON fields), error alerting (tool/threshold/channel/on-call), incident runbook cross-reference |
| `DECISIONS.md` | Architecture Decision Records (ADRs) for every major tech choice |
| `PERFORMANCE.md` | Performance budgets, hot paths, caching, self-hosted server tuning (worker count formula, Nginx tuning, PostgreSQL/MySQL config values), load testing, anti-patterns |
| `ONBOARDING.md` | New dev guide — from `git clone` to first PR in one hour |
| `GLOSSARY.md` | Domain and technical terms specific to this project |
| `fe/STYLING_MICRO_STANDARDS.md` | Complete token catalogue, icon size matrix, spacing anatomy, 7 CSS architecture rules |
| `fe/HOOKS_DEEP_RULES.md` | 8-rule hook contract, useEffect rules, memoization decision trees, anti-patterns, testing |
| `fe/DEPENDENCIES_WORKFLOW.md` | Approved libraries, new-dep checklist, bundle limits, feature workflow, review contract |
| `UNIT_TESTING_COMPLETE.md` | Coverage requirements, FE + BE test patterns, factories, MSW mocking, naming rules |
| `be/MICRO_STANDARDS_BE.md` | Controller/Service/Repository micro-contract, error flow, logging rules, transaction ownership |
| `INFRASTRUCTURE.md` | Self-hosted server architecture, Nginx config (server block, proxy, gzip, rate limiting, security headers), process supervisor (Supervisor/PM2/systemd), application server worker config, Redis (persistence, maxmemory, auth), database server config, SSL/TLS (cert paths, auto-renewal), firewall (open ports, SSH restriction), filesystem layout, health check endpoint, service management commands |
| `BACKUP_RECOVERY.md` | Backup scope table (DB, files, code, .env, Redis, SSL certs), database backup script (path, schedule, retention, off-server copy), file backup, backup verification procedure, secrets/cert backup, recovery scenarios (DB corruption, full server restore with 10-step procedure, single file restoration), RPO and RTO targets, backup monitoring and alerting |
| `OBSERVABILITY.md` | Health check endpoints (URL, checks performed, HTTP 200/503 response format), uptime monitoring (tool, interval, alert recipients), application metrics table (7 metrics with thresholds and alert channels), self-hosted metrics stack (Prometheus+Grafana / Netdata / none), log management table (paths, rotation, retention), error alerting config, database and queue observability, alert response runbook (6 alert types with first response and escalation) |
| `CONFIGURATION_MANAGEMENT.md` | Configuration hierarchy (OS env → .env → framework config → code defaults), complete env var catalog (variable, purpose, required, default, example — all vars from .env.example), per-environment differences table (local/staging/production), config validation on startup (missing var behaviour, .env.example sync rule), secrets management (.env permissions, access, rotation, leaked-secret procedure), framework config files directory |
| `SCHEDULER.md` | Scheduler architecture (how invoked, cron entry, central file path, timezone, overlap prevention), complete job catalog (job, path, schedule, description, estimated duration, sync/async, on failure), job failure handling (silent vs alerting, retry policy, manual re-run), job monitoring (last-run tracking, duration, lock mechanism), adding a new scheduled task (7-step procedure) |
| `INDEX.md` | Navigation hub — generated automatically by the hook |

## Quality bar

Every document must contain **actual project findings** — no placeholder text.
A developer opening any document must immediately understand what to do.
Documents are loaded by `/evyasys:StartDev` before any brainstorm is generated.
