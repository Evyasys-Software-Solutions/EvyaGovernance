> Not applicable — this project has no user authentication or role-based access control layer. It is a developer CLI plugin that runs as the OS user. Access to PM tools (Azure DevOps, JIRA, GitHub) and notification channels (Teams, Slack) is controlled by the credentials each developer configures in `~/.evyasys/credentials` via `/evyasys:Setup`. Permission scoping is managed at the PM tool level (PAT scopes, JIRA API token permissions, GitHub token scopes) — not within this plugin.
>
> Required PAT/token scopes per integration:
> - **Azure DevOps PAT**: Work Items (Read & Write)
> - **JIRA API token**: Project-level permissions for issue create/update/transition
> - **GitHub personal access token**: `repo` + `project`
