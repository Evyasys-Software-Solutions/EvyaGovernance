"""Shared layered config loader for Evyasys (Python).

Resolution order (highest priority first):
    1. process env vars
    2. ~/.evyasys/credentials               (per-user, secrets — PAT)
    3. <project>/.evyasys/project.yaml      (per-project, in repo)
    4. plugin defaults (.ai/manifest.yaml)

Default mode is LIVE. Set EVYASYS_DRY_RUN=1 to preview.
"""
from __future__ import annotations

import os
import re
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

    manifest = _read_simple_yaml(plugin_root / ".ai" / "manifest.yaml")
    project_file = repo_root / ".evyasys" / "project.yaml"
    project = _read_simple_yaml(project_file)
    user_creds = _read_env_file(user_creds_path())

    dry_raw = os.environ.get("EVYASYS_DRY_RUN", os.environ.get("EVYA_DRY_RUN"))
    if dry_raw is None:
        dry_run = bool((manifest.get("mode") or {}).get("dry_run") == "true")
    else:
        dry_run = dry_raw == "1"

    azure = {
        "org": os.environ.get("AZURE_ORG", "") or (project.get("azure_devops") or {}).get("org", ""),
        "project": os.environ.get("AZURE_PROJECT", "") or (project.get("azure_devops") or {}).get("project", ""),
        "pat": os.environ.get("AZURE_PAT", "") or user_creds.get("AZURE_PAT", ""),
    }
    teams = {"webhook": os.environ.get("TEAMS_WEBHOOK", "") or (project.get("teams") or {}).get("webhook", "")}

    return {
        "plugin_root": str(plugin_root),
        "repo_root": str(repo_root),
        "dry_run": dry_run,
        "project": {
            "name": project.get("name", ""),
            "story_id_prefix": (project.get("story") or {}).get("id_prefix", "EVYA"),
            "raw": project,
            "file": str(project_file),
        },
        "azure": azure,
        "teams": teams,
        "user_creds_file": str(user_creds_path()),
    }
