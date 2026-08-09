---
name: evyasys-create-functional-docs
description: Use this skill to generate plain-language functional documentation for each business module in the project. Documents are stored in .evyasys/docs/functional/ and describe WHAT each module does — entities it owns, who can access it, validation rules, actions users can take, business logic and decision rules, multi-step workflows, error scenarios, and integration points. Structured for RAG retrieval so each section can be independently retrieved and used to answer end-user chat queries about system behaviour. Triggered by `/evyasys:CreateFunctionalDocs`.
trigger: /evyasys:CreateFunctionalDocs
---

# Skill: evyasys-create-functional-docs

## Purpose

Produces functional reference documentation for each business module — written for non-technical
readers and optimised for RAG (Retrieval-Augmented Generation) retrieval.

Technical docs (ARCHITECTURE.md, PATTERNS.md, etc.) describe HOW the system is built.
Functional docs describe WHAT it does — in plain language, by module.

## What it scans (per module)

- Routes and middleware — to extract actions and permission gates
- Controllers — to list user-triggerable operations
- Request DTOs / Form Requests — to document validation rules and error messages
- Services — to extract business logic, calculations, state transitions, and notification triggers
- Repositories and Models — to identify ownership scopes and entity relationships
- Role/permission seed scripts — to map roles to permissions per module
- Locale/translation files — to capture the exact error messages users see
- Database migrations — to document entity fields and statuses
- Notification and event classes — to document integration points and triggers

## What it produces

All documents written to `.evyasys/docs/functional/`:

| Document | Content |
|---|---|
| `functional/{ModuleName}.md` | Full functional reference for the module |
| `functional/INDEX.md` | Navigation hub — module list with 1-line descriptions |

## Document structure (per module)

Each document uses `MODULE_TEMPLATE.md` and covers:

| Section | What it answers |
|---|---|
| Module Overview | What problem does this module solve and who uses it? |
| Entities | What data does this module own? What status values exist? |
| Access & Permissions | Which roles can view / create / edit / delete? What restrictions apply? |
| Validations | What rules must be satisfied? What error does the user see when a rule fails? |
| Actions | What can users do, who can do it, and what is the outcome? |
| Business Logic | What decisions does the system make? What are the rules and example scenarios? |
| Workflows | What multi-step processes exist? Who acts at each step? |
| Error Scenarios | What can go wrong and what does the user see? |
| Integration Points | What other modules or external services does this module connect to? |
| Glossary | Domain terms specific to this module |

## Usage

| Command | Effect |
|---|---|
| `/evyasys:CreateFunctionalDocs` | Detect modules, prompt to select, generate chosen |
| `/evyasys:CreateFunctionalDocs --all` | Generate docs for all detected modules |
| `/evyasys:CreateFunctionalDocs UserManagement` | Generate for one module by name |
| `/evyasys:CreateFunctionalDocs --update UserManagement` | Extend existing doc — never removes valid content |

## RAG optimisation

Every section is self-contained:
- No section requires reading another to make sense
- Every rule is a complete sentence with specific values
- Every business logic rule has a concrete scenario example
- No class names, method names, or file paths in the output
