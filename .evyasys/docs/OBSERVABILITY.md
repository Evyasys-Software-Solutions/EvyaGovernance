> Not applicable as a server observability document — this project is a CLI plugin with no running processes to monitor.
>
> **Available diagnostic mechanisms**:
>
> **Dry-run mode** (`EVYASYS_DRY_RUN=1`): All external API calls log their intended action to stdout with the `[evyasys:dry-run]` prefix. Use this to verify what a command will do before running it for real.
>
> **Error logs**: Failed integration calls log to stderr with `[evyasys:error]` prefix via `scripts/lib/dryrun.js:runIntegration()`.
>
> **`.evyasys/.ado-map.json`**: Shows which Evyasys IDs have been synced to the PM tool (`adoId: null` = not yet synced or sync failed).
>
> **Repo scan**: `python scripts/repo_scan.py --summary` outputs file count, line count, and extension breakdown as JSON — useful for understanding the plugin's own codebase size.
