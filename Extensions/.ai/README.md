# EvyaFlow AI Control Plane

This `.ai` folder is the shared, Git-backed operating layer for AI-assisted delivery.
Everything in here is versioned alongside your code and travels with it through PRs.

## Goals

- Keep project context in Git — no hidden config, no per-machine state
- Keep prompts and rules versioned so the whole team works from the same playbook
- Make workflows reusable across projects — drop `.evyasys/` into any repo and go
- Keep the AI agent optional, not foundational — the markdown files drive any compatible runtime
- Support future CLI/agent switching without starting over

## Core principles

- Git is the source of truth
- AI drafts, validates, and summarizes — humans confirm before any board action
- Business stories stay free of technical implementation details
- Every workflow has a clear input, output, and quality gate

## Active commands

| Trigger | Role | What it does |
|---|---|---|
| `/EvyaCreateStory` | BA / PO | Draft a business story from projec