# Create-Functional-Docs Checklist

## Before running the scan
- [ ] Argument parsed correctly: single module name / `--all` / `--update <name>` / empty (interactive)
- [ ] `.evyasys/docs/functional/` checked for existing files
- [ ] For `--update` mode: existing doc read and treated as baseline

## Module detection (interactive / --all mode)
- [ ] Controllers directory scanned and grouped by resource name
- [ ] Services directory scanned and grouped by domain
- [ ] Routes file inspected for route groups
- [ ] Views directory sampled for section grouping
- [ ] Duplicate names merged (e.g. User + UserManagement)
- [ ] User confirmed detected module list before generation (skip in `--all`)

## Per-module source scan (must complete before drafting)
- [ ] Routes read — endpoints listed, middleware chains identified
- [ ] Controllers read — every action method captured
- [ ] Request DTOs / Form Requests read — every validation rule extracted
- [ ] Services read — business logic, calculations, state transitions extracted
- [ ] Repositories/Models read — ownership scopes and relationships noted
- [ ] Role/permission seed script read — role→permission mapping captured
- [ ] Locale/translation files read — actual user-visible messages extracted
- [ ] Migrations read — entity fields, types, defaults documented
- [ ] Notification/event classes read — triggers and payloads captured

## Content quality (before showing preview)
- [ ] Every section is self-contained — readable without any other section
- [ ] No class names, method names, or file paths anywhere in the output
- [ ] No generic placeholders — every role name, field name, error message is real
- [ ] Every business logic rule has at least one concrete scenario example
- [ ] Every workflow step names who acts (role or system) and the outcome
- [ ] Sections with no evidence marked `> Not applicable — [reason].`
- [ ] Module Overview reads as a standalone summary (works in isolation for RAG retrieval)

## Preview and confirm
- [ ] Summary table shown covering: Entities, Roles, Validation count, Action count, Business logic areas, Workflow count, Error scenarios, Integration count
- [ ] User confirmed before hook writes files

## Output format
- [ ] Each module wrapped in `<!-- EVYAFUNCDOC: ModuleName.md -->` delimiter
- [ ] Index manifest `<!-- EVYAFUNCDOCINDEX [...] -->` appended once at the end
- [ ] Every module in the manifest has: name, file, summary (1 sentence)

## Update-mode extras (`--update ModuleName`)
- [ ] Existing document content preserved unless code definitively contradicts it
- [ ] No rule removed unless code stopped enforcing it
- [ ] No section coverage reduced compared to previous version
- [ ] `> Updated: YYYY-MM-DD` note added to any section that was modified
