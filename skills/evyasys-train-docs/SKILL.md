---
name: evyasys-train-docs
description: Use this skill to scan the entire project and generate comprehensive quality-gate documentation into .evyasys/docs/. Produces 25 documents covering architecture, standards, patterns, testing, security, deployment, design system, UI/UX standards, styling tokens, hook rules, dependency governance, complete unit testing standards, and backend micro-contracts. All new development must follow these documents — they are loaded by /evyasys:StartDev at Step 0 before any technical opinion is formed. Triggered by `/evyasys:TrainDocs`.
trigger: /evyasys:TrainDocs
---

# Skill: evyasys-train-docs

## What it scans

- **Tech stack**: `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`, `go.mod`, `Dockerfile*`
- **Source structure**: all `src/`, `app/`, `lib/`, `components/`, `pages/`, `api/`, `services/`, `models/` trees
- **Tooling config**: ESLint, Prettier, Jest/Vitest, Playwright, Tailwind, Prisma, TypeScript
- **CI/CD**: GitHub Actions workflows, Azure Pipelines, Jenkinsfile
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
| `PATTERNS.md` | Approved design patterns with canonical examples from this project |
| `FRONTEND.md` | Component structure, state, routing, styling, assets, accessibility |
| `BACKEND.md` | API layer, services, middleware, auth flow, logging, config |
| `DB_STANDARDS.md` | Schema conventions, migrations, query patterns, indexes |
| `API_STANDARDS.md` | API contracts, versioning, request/response format, error codes |
| `TESTING.md` | Test strategy, coverage requirements, naming, mocking, commands |
| `SECURITY.md` | Auth/authz model, input validation, secrets, OWASP requirements |
| `DESIGN_SYSTEM.md` | UI tokens, component library, typography, colour, breakpoints |
| `UI_UX_STANDARDS.md` | Loading/error/empty states, forms, toast patterns, keyboard nav, accessibility baseline |
| `WORKFLOWS.md` | Branching, commit format, PR process, merge strategy, release |
| `DEPLOYMENT.md` | Environments, CI/CD stages, secrets, rollback, health checks |
| `ERROR_HANDLING.md` | Error taxonomy, log levels, user-facing messages, tracing |
| `DECISIONS.md` | Architecture Decision Records (ADRs) for every major tech choice |
| `PERFORMANCE.md` | Performance budgets, hot paths, caching, profiling, anti-patterns |
| `ONBOARDING.md` | New dev guide — from `git clone` to first PR in one hour |
| `GLOSSARY.md` | Domain and technical terms specific to this project |
| `fe/STYLING_MICRO_STANDARDS.md` | Complete token catalogue, icon size matrix, spacing anatomy, 7 CSS architecture rules |
| `fe/HOOKS_DEEP_RULES.md` | 8-rule hook contract, useEffect rules, memoization decision trees, anti-patterns, testing |
| `fe/DEPENDENCIES_WORKFLOW.md` | Approved libraries, new-dep checklist, bundle limits, feature workflow, review contract |
| `UNIT_TESTING_COMPLETE.md` | Coverage requirements, FE + BE test patterns, factories, MSW mocking, naming rules |
| `be/MICRO_STANDARDS_BE.md` | Controller/Service/Repository micro-contract, error flow, logging rules, transaction ownership |
| `INDEX.md` | Navigation hub — generated automatically by the hook |

## Quality bar

Every document must contain **actual project findings** — no placeholder text.
A developer opening any document must immediately understand what to do.
Documents are loaded by `/evyasys:StartDev` before any brainstorm is generated.
