> Not applicable — this project has no database. Persistent state is stored in:
> - `.evyasys/board/**/*.md` — story and epic artefact files (git-committed markdown)
> - `.evyasys/.ado-map.json` — Evyasys ID ↔ PM tool ID mapping (git-committed JSON)
> - `.evyasys/memory/*.json` — project memory (git-committed JSON)
> - `~/.evyasys/credentials` — per-user encrypted credentials (never committed)
>
> Git is the source of truth for all project content. There is no SQL, NoSQL, ORM, or migration system.
