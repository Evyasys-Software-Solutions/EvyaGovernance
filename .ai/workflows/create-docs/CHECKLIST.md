# TrainDocs Checklist

## Phase 1 — Scan completeness

- [ ] `package.json` (or equivalent) read — full dependency list and scripts extracted
- [ ] TypeScript / compiler config read (if present)
- [ ] Linting config read (if present)
- [ ] Formatter config read (if present)
- [ ] Test framework config read (if present)
- [ ] E2E test config read (if present — Playwright, Cypress, etc.)
- [ ] Database schema / ORM config read (if present)
- [ ] CI/CD pipeline config read (if present)
- [ ] Container config read (if present)
- [ ] `README.md` and `CONTRIBUTING.md` read
- [ ] Design system config read: `tailwind.config.*` / `globals.css` / `src/tokens/**` (if present)
- [ ] Component library detected and representative files sampled (`src/components/ui/**` or equivalent)
- [ ] Storybook stories read for documented variants (if present — `*.stories.*`)
- [ ] i18n config and locale files read (if present)
- [ ] At least 3 representative source files sampled per layer found in the project

## Phase 2 — Analysis quality

- [ ] Architecture pattern named specifically (not "unknown" or "standard MVC")
- [ ] All naming conventions identified per file type (components, services, tests, etc.)
- [ ] Design patterns found in code listed by name and example location
- [ ] Gaps, inconsistencies, and risks identified and documented in the relevant files
- [ ] Technology inventory is complete — no framework or tool left unnamed
- [ ] Design token values extracted: actual colour hex values, spacing scale values, breakpoints — not library defaults
- [ ] Component library identified by detection signals (shadcn/ui, MUI, Chakra, Ant Design, Radix, custom)
- [ ] UX patterns detected: loading states, toast/notification library, form library, state management, error boundaries, empty states

## Phase 3 — Document quality (check every document)

For each of the 25 documents generated:
- [ ] No placeholder text (`[TODO]`, `[TBD]`, `<insert here>`)
- [ ] Every rule or convention has a concrete example from this project
- [ ] Sections with no evidence are explicitly marked "Not applicable — [reason]"
- [ ] Cross-references to related documents are included where relevant
- [ ] Document is specific to this project — not generic internet advice

## Phase 4 — Specific document checks

- [ ] **STACK.md** — every framework and tool listed with exact version numbers
- [ ] **ARCHITECTURE.md** — pattern named, layer boundaries defined, ASCII folder tree with real directory names, anti-patterns listed
- [ ] **RULES.md** — every rule uses "must" / "never" — no "consider" or "prefer"
- [ ] **STANDARDS.md** — naming rules match actual file names found in the scan
- [ ] **PATTERNS.md** — every pattern has a canonical example referencing a real file path
- [ ] **TESTING.md** — exact commands to run each test type included
- [ ] **SECURITY.md** — actual auth mechanism used in this project named and documented
- [ ] **DB_STANDARDS.md** — real table/column naming from the schema (if DB exists)
- [ ] **API_STANDARDS.md** — real endpoint structure and real response format documented
- [ ] **DECISIONS.md** — at least one ADR per major technology choice identified
- [ ] **ONBOARDING.md** — setup steps are complete from `git clone` to running app
- [ ] **GLOSSARY.md** — at least 10 domain-specific terms with definitions
- [ ] **DEPLOYMENT.md** — real environments named, real pipeline stages documented
- [ ] **ERROR_HANDLING.md** — real error categories and log format from the codebase
- [ ] **PERFORMANCE.md** — real performance budgets documented; hot paths named; anti-patterns listed
- [ ] **DESIGN_SYSTEM.md** — actual token values extracted (hex colours, px/rem spacing, not generic descriptions); component library named with variants listed from real component files; consistent with what UI_UX_STANDARDS.md will reference
- [ ] **UI_UX_STANDARDS.md** — loading/error/empty states documented from actual patterns in the codebase; toast and form libraries named specifically; tokens used match DESIGN_SYSTEM.md; consistent with ERROR_HANDLING.md error categories
- [ ] **fe/STYLING_MICRO_STANDARDS.md** — token file path identified; complete colour/typography/spacing/z-index/motion token catalogue extracted from real config; icon size matrix covers all UI contexts; spacing anatomy table covers all component relationships; all 7 CSS architecture rules stated; dark mode coverage documented if applicable. If no frontend layer: marked Not applicable.
- [ ] **fe/HOOKS_DEEP_RULES.md** — all 8 hook contract rules documented with examples from real codebase; useEffect rules include when-to-use and when-not-to-use with examples; memoization decision tree documented (measure first rule); data fetching patterns reference the project's actual library; banned anti-patterns listed with code examples. If no React frontend: marked Not applicable.
- [ ] **fe/DEPENDENCIES_WORKFLOW.md** — approved library table extracted from actual `package.json`; 6-question checklist documented; banned patterns listed; bundle size limits documented; feature workflow steps match project conventions; review contract protocol stated. If no frontend layer: marked Not applicable.
- [ ] **UNIT_TESTING_COMPLETE.md** — coverage table uses actual thresholds from test config (or flags gap); test file structure matches real test files found in codebase; FE and BE examples reference real entity names from the project; factory pattern documented for a real entity; MSW handler structure shown
- [ ] **be/MICRO_STANDARDS_BE.md** — controller/service/repository contracts each documented with ✅ correct and ❌ wrong code examples from real patterns in the codebase; error flow cross-references ERROR_HANDLING.md; logging micro-rules state what each layer logs (and never logs); transaction ownership rule stated. If no backend layer: marked Not applicable.

## Phase 5 — Output format

- [ ] Every document wrapped with `<!-- EVYADOC: FILENAME.md -->` delimiter
- [ ] All 25 documents present in the output (or explicitly skipped with Not applicable)
- [ ] Documents generated in the order specified in PROMPT.md (STACK.md first)
- [ ] Preview summary table shown to user before confirmation
