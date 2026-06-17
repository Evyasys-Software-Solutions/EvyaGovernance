> Not applicable as a server backup document — this project has no database and no persistent server state.
>
> **Data durability model**: All project artefacts (stories, epics, release notes, reference docs, memory, config) are stored as markdown and JSON files inside `.evyasys/` in the project's git repository and committed to version control. Git is the backup and recovery mechanism.
>
> **Recovery procedure**: If `.evyasys/board/` content is lost, run `git checkout HEAD -- .evyasys/` to restore. If the PM tool diverges from local state, `.evyasys/.ado-map.json` provides the Evyasys ID ↔ PM tool ID mapping needed to reconcile.
>
> **`~/.evyasys/credentials`** is the only state outside git. If lost, run `/evyasys:Setup` to re-enter and re-encrypt credentials. There is no recovery for the encrypted credential file itself — re-entry is the recovery.
