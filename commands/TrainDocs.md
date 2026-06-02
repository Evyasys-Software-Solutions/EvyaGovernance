---
description: Scan the entire project and generate 20 comprehensive quality-gate documents into .evyasys/docs/ — covering architecture, standards, patterns, testing, security, deployment, design system, UI/UX standards, and more. All new development must follow these documents. Use --retrain to update only docs affected by recent code changes.
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
argument-hint: [--update | --update <filename> | --retrain]
skill: evyasys-train-docs
---

You are running **/evyasys:TrainDocs $ARGUMENTS**.

## Step 0 — Pre-flight
0a. Check `.evyasys/docs/` for existing files:
    - No docs → proceed with full generation (all 20 documents).
    - Docs exist and `$ARGUMENTS` is empty → ask: "Docs already exist. Regenerate all, update specific, retrain, or abort?"
    - `$ARGUMENTS` is `--update` → confirm: "Regenerate all 20 documents?"
    - `$ARGUMENTS` is `--update <filename>` → confirm: "Regenerate `.evyasys/docs/<filename>` only?"
    - `$ARGUMENTS` is `--retrain` → switch to retrain mode (see PROMPT.md Step 0-R):
      read last generation date from INDEX.md, detect changed areas via git log, regenerate only affected docs.
0b. Read `CLAUDE.md` from project root if present. Carry its content into ARCHITECTURE.md and RULES.md.
0c. Load `.ai/workflows/create-docs/AGENT.md`, `PROMPT.md`, and `DOC_MANIFEST.md`.

## Phase 1 — Project scan (complete before writing any document)
1. **Tech stack**: read `package.json`, `requirements.txt`, `pyproject.toml`, `Cargo.toml`,
   `go.mod`, `pom.xml`, `tsconfig.json`, `docker-compose.yml`, `Dockerfile*`.
2. **Source structure**: Glob `src/**`, `app/**`, `lib/**`, `components/**`, `pages/**`,
   `api/**`, `services/**`, `models/**`, `repositories/**` — map folder layout and naming.
3. **Tooling**: read `.eslintrc*`, `.prettierrc*`, `.editorconfig`, `jest.config.*`,
   `vitest.config.*`, `playwright.config.*`, `tailwind.config.*`, `prisma/schema.prisma`.
4. **CI/CD**: read `.github/workflows/**`, `azure-pipelines.yml`, `Jenkinsfile`.
5. **Code sampling**: read 3–5 representative source files per layer to infer patterns, naming, and conventions.
6. **Existing docs**: read `README.md`, `CONTRIBUTING.md`, any files under `docs/`.

## Phase 2 — Generate all documents
Following `DOC_MANIFEST.md`, generate all 20 documents (or only affected docs in `--retrain` mode) using **actual project findings**.
No placeholder text. Every rule must have a concrete example from this project.
Wrap each document with `<!-- EVYADOC: FILENAME.md -->` so the hook can parse and write them.

## Phase 3 — Preview and confirm
Show a summary table (document name + 1-line description of what was found and documented).
Wait for explicit user confirmation before the hook writes anything to disk.

Output: 20 documents + `INDEX.md` written to `.evyasys/docs/`.
