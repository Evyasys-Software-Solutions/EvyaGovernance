"""Shared layered config loader for Evyasys (Python mirror of config.js).

Resolution order (highest priority first):
    1. process env vars
    2. ~/.evyasys/credentials               (per-user, secrets — encrypted)
    3. <project>/.evyasys/project.yaml      (per-project, in repo)
    4. plugin defaults (.ai/manifest.yaml)

Supported PM tools:   local | devops | jira | github
Supported notify tools: none | teams | slack | whatsapp | email

Default mode is LIVE. Set EVYASYS_DRY_RUN=1 to preview.
"""
from __future__ import annotations

import os
import re
import subprocess
import sys
from pathlib import Path
from typing import Any


def _read_simple_yaml(path: Path) -> dict:
    """Tiny YAML reader (top-level + 1 level of indent). Avoids a yaml dep."""
    if not path.is_file():
        return {}
    root: dict[str, Any] = {}
    current: str | None = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = re.sub(r"\s+#.*$", "", raw).rstrip()
        line = re.sub(r"^\s*#.*$", "", line)
        if not line.strip():
            continue
        indented = bool(re.match(r"^\s+", line))
        m = re.match(r"^\s*([A-Za-z0-9_\-.]+)\s*:\s*(.*)$", line)
        if not m:
            continue
        key, val = m.group(1), m.group(2)
        if val.startswith('"') and val.endswith('"'):
            val = val[1:-1]
        elif val.startswith("'") and val.endswith("'"):
            val = val[1:-1]
        if not indented:
            current = key
            root[key] = {} if val == "" else val
        elif current and isinstance(root.get(current), dict):
            root[current][key] = val
    return root


def _read_env_file(path: Path) -> dict:
    out: dict[str, str] = {}
    if not path.is_file():
        return out
    for line in path.read_text(encoding="utf-8").splitlines():
        m = re.match(r"^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$", line)
        if not m:
            continue
        v = m.group(2)
        if (v.startswith('"') and v.endswith('"')) or (v.startswith("'") and v.endswith("'")):
            v = v[1:-1]
        out[m.group(1)] = v
    return out


def _decrypt(encoded: str) -> str:
    """Delegate decryption to the Node.js encrypt.js module via a subprocess call."""
    if not encoded or ":" not in encoded:
        return encoded
    # Fast path: if it doesn't look like our ivHex:ciphertextHex format, return as-is.
    colon = encoded.index(":")
    iv_hex = encoded[:colon]
    if len(iv_hex) != 32:
        return encoded
    try:
        script = Path(__file__).resolve().parent / "_decrypt_helper.js"
        if not script.is_file():
            return encoded
        result = subprocess.run(
            ["node", str(script), encoded],
            capture_output=True, text=True, timeout=5,
        )
        return result.stdout.strip() if result.returncode == 0 else encoded
    except Exception:
        return encoded


def _read_user_creds(path: Path) -> dict:
    raw = _read_env_file(path)
    return {k: _decrypt(v) for k, v in raw.items()}


def find_plugin_root(start: Path) -> Path:
    cur = start
    while cur != cur.parent:
        if (cur / ".claude-plugin" / "plugin.json").is_file():
            return cur
        cur = cur.parent
    return start


def user_creds_path() -> Path:
    return Path.home() / ".evyasys" / "credentials"


def load_config() -> dict:
    plugin_root = find_plugin_root(Path(__file__).resolve())
    repo_root = Path(os.environ.get("EVYASYS_REPO_ROOT") or os.environ.get("EVYA_REPO_ROOT") or os.getcwd())

    manifest     = _read_simple_yaml(plugin_root / ".ai" / "manifest.yaml")
    project_file = repo_root / ".evyasys" / "project.yaml"
    project      = _read_simple_yaml(project_file)
    user_creds   = _read_user_creds(user_creds_path())

    dry_raw = os.environ.get("EVYASYS_DRY_RUN", os.environ.get("EVYA_DRY_RUN"))
    if dry_raw is None:
        dry_run = bool((manifest.get("mode") or {}).get("dry_run") == "true")
    else:
        dry_run = dry_raw == "1"

    # PM tool — backward compat
    ado = project.get("azure_devops") or {}
    pm_tool_raw = (
        os.environ.get("EVYASYS_PM_TOOL")
        or project.get("pm_tool")
        or ("devops" if (ado.get("org") or ado.get("project")) else "local")
    )
    pm_tool = pm_tool_raw.lower()

    # Notification tool — backward compat
    teams_section = project.get("teams") or {}
    notify_tool_raw = (
        os.environ.get("EVYASYS_NOTIFY_TOOL")
        or project.get("notification_tool")
        or ("teams" if (teams_section.get("webhook") or os.environ.get("TEAMS_WEBHOOK") or user_creds.get("TEAMS_WEBHOOK")) else "none")
    )
    notification_tool = notify_tool_raw.lower()

    azure = {
        "org":     os.environ.get("AZURE_ORG", "")     or user_creds.get("AZURE_ORG", "")     or ado.get("org", ""),
        "project": os.environ.get("AZURE_PROJECT", "") or user_creds.get("AZURE_PROJECT", "") or ado.get("project", ""),
        "pat":     os.environ.get("AZURE_PAT", "")     or user_creds.get("AZURE_PAT", ""),
    }

    teams = {
        "webhook": os.environ.get("TEAMS_WEBHOOK", "")
                or teams_section.get("webhook", "")
                or user_creds.get("TEAMS_WEBHOOK", ""),
    }

    jira_section = project.get("jira") or {}
    jira = {
        "domain":      os.environ.get("JIRA_DOMAIN", "")      or jira_section.get("domain", ""),
        "project_key": os.environ.get("JIRA_PROJECT_KEY", "") or jira_section.get("project_key", ""),
        "email":       os.environ.get("JIRA_EMAIL", "")       or user_creds.get("JIRA_EMAIL", ""),
        "api_token":   os.environ.get("JIRA_API_TOKEN", "")   or user_creds.get("JIRA_API_TOKEN", ""),
    }

    gh_section = project.get("github") or {}
    github = {
        "owner":          os.environ.get("GITHUB_OWNER", "")          or gh_section.get("owner", ""),
        "repo":           os.environ.get("GITHUB_REPO", "")           or gh_section.get("repo", ""),
        "project_number": os.environ.get("GITHUB_PROJECT_NUMBER", "") or gh_section.get("project_number", ""),
        "token":          os.environ.get("GITHUB_TOKEN", "")          or user_creds.get("GITHUB_TOKEN", ""),
    }

    slack_section = project.get("slack") or {}
    slack = {
        "webhook": os.environ.get("SLACK_WEBHOOK", "")
                or slack_section.get("webhook", "")
                or user_creds.get("SLACK_WEBHOOK", ""),
    }

    wa_section = project.get("whatsapp") or {}
    whatsapp = {
        "account_sid": os.environ.get("TWILIO_ACCOUNT_SID", "") or user_creds.get("TWILIO_ACCOUNT_SID", ""),
        "auth_token":  os.environ.get("TWILIO_AUTH_TOKEN", "")  or user_creds.get("TWILIO_AUTH_TOKEN", ""),
        "from":        os.environ.get("WHATSAPP_FROM", "")      or wa_section.get("from", ""),
        "to":          os.environ.get("WHATSAPP_TO", "")        or wa_section.get("to", ""),
    }

    em_section = project.get("email") or {}
    email = {
        "smtp_host":     os.environ.get("EMAIL_SMTP_HOST", "")     or em_section.get("smtp_host", ""),
        "smtp_port":     os.environ.get("EMAIL_SMTP_PORT", "")     or em_section.get("smtp_port", "587"),
        "smtp_user":     os.environ.get("EMAIL_SMTP_USER", "")     or user_creds.get("EMAIL_SMTP_USER", ""),
        "smtp_password": os.environ.get("EMAIL_SMTP_PASSWORD", "") or user_creds.get("EMAIL_SMTP_PASSWORD", ""),
        "from":          os.environ.get("EMAIL_FROM", "")          or em_section.get("from", ""),
        "to":            os.environ.get("EMAIL_TO", "")            or em_section.get("to", ""),
    }

    wit = project.get("work_item_types") or {}
    return {
        "plugin_root": str(plugin_root),
        "repo_root":   str(repo_root),
        "dry_run":     dry_run,
        "pm_tool":     pm_tool,
        "notification_tool": notification_tool,
        "project": {
            "name":           project.get("name", ""),
            "story_id_prefix": (project.get("story") or {}).get("id_prefix", "EVYA"),
            "raw":            project,
            "file":           str(project_file),
        },
        "azure":    azure,
        "teams":    teams,
        "jira":     jira,
        "github":   github,
        "slack":    slack,
        "whatsapp": whatsapp,
        "email":    email,
        "work_item_types": {
            "epic":  os.environ.get("ADO_TYPE_EPIC")  or wit.get("epic")  or "Epic",
            "story": os.environ.get("ADO_TYPE_STORY") or wit.get("story") or "User Story",
            "task":  os.environ.get("ADO_TYPE_TASK")  or wit.get("task")  or "Task",
        },
        "user_creds_file": str(user_creds_path()),
    }
