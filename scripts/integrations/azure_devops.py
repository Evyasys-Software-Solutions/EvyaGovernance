"""Azure DevOps integration (Python mirror of azure_devops.js).

Reads layered config: env > ~/.evyasys/credentials > .evyasys/project.yaml.
Default mode is LIVE. Set EVYASYS_DRY_RUN=1 to preview.

Usage:
    python azure_devops.py create-stories  --file PATH [--id EVYA-id]
    python azure_devops.py create-subtasks --story EVYA-id --file PATH [--story-ado-id NUM]
    python azure_devops.py set-state       --id EVYA-id --state STATE
    python azure_devops.py get-work-item   --id EVYA-id
"""
from __future__ import annotations

import argparse
import base64
import json
import re
import sys
import urllib.parse
from pathlib import Path
from typing import Any

# Local import (this file lives in scripts/integrations/, lib/ is a sibling)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib.evyasys_config import load_config  # noqa: E402
from lib.markdown_to_html import markdown_to_html  # noqa: E402


def _ado_url(cfg: dict, suffix: str) -> str:
    org = urllib.parse.quote(cfg["azure"]["org"], safe="")
    project = urllib.parse.quote(cfg["azure"]["project"], safe="")
    return f"https://dev.azure.com/{org}/{project}/_apis/wit/{suffix}"


def _wit_type_url(type_name: str) -> str:
    return f"workitems/${urllib.parse.quote(type_name, safe='')}?api-version=7.1"


def _request(cfg: dict, suffix: str, *, method: str = "GET", body: Any = None) -> Any:
    url = _ado_url(cfg, suffix)
    if cfg["dry_run"]:
        print(f"[evyasys:dry-run] ADO {method} {url}")
        if body is not None:
            print(f"[evyasys:dry-run] body={json.dumps(body, indent=2)}")
        return {"dryRun": True}
    if not cfg["azure"]["org"] or not cfg["azure"]["project"]:
        raise RuntimeError("AZURE_ORG/AZURE_PROJECT not set (.evyasys/project.yaml or env).")
    if not cfg["azure"]["pat"]:
        raise RuntimeError("No PAT available. Run scripts/login.sh (macOS/Linux) or scripts/setup.ps1 (Windows).")

    try:
        import requests  # type: ignore
    except ImportError as e:
        raise RuntimeError("Install requests: pip install requests") from e

    auth = base64.b64encode(f":{cfg['azure']['pat']}".encode()).decode()
    headers = {
        "Authorization": f"Basic {auth}",
        "Content-Type": "application/json-patch+json",
        "Accept": "application/json",
    }
    resp = requests.request(method, url, headers=headers, json=body)
    resp.raise_for_status()
    return resp.json()


def _strip_workflow_meta(md: str) -> str:
    """Remove workflow-artifact content before posting to ADO.

    Strips metadata header lines (Key: Value pairs before the first ## section —
    Status, Epic, Priority, Module, Owner, and any future fields) and the
    ## Confirmation section. The local .md file is never modified.
    """
    lines = md.splitlines()
    first_section = next((i for i, l in enumerate(lines) if re.match(r"^##\s", l)), len(lines))
    cleaned = [
        "" if i < first_section and re.match(r"^[A-Za-z][A-Za-z ]*:\s*.+", line) else line
        for i, line in enumerate(lines)
    ]
    result = "\n".join(cleaned)
    result = re.sub(r"^##\s+Confirmation\b[\s\S]*", "", result, flags=re.IGNORECASE | re.MULTILINE)
    return result.strip()


def _parse_story(file: Path) -> dict:
    md = file.read_text(encoding="utf-8")
    title = "Untitled"
    for line in md.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            break
    return {"title": title, "description": _strip_workflow_meta(md)}


def _link_to_parent(cfg: dict, child_ado_id: int, parent_ado_id: int) -> Any:
    """Set a parent–child hierarchy link. Used for Story→Epic and Task→Story."""
    numeric_parent = "".join(ch for ch in str(parent_ado_id) if ch.isdigit())
    if not numeric_parent:
        print(f"[evyasys] Invalid parent ADO ID '{parent_ado_id}' — skipping hierarchy link.")
        return None
    parent_url = _ado_url(cfg, f"workitems/{numeric_parent}")
    patch = [{
        "op": "add",
        "path": "/relations/-",
        "value": {
            "rel": "System.LinkTypes.Hierarchy-Reverse",
            "url": parent_url,
            "attributes": {"comment": "Linked by Evyasys"},
        },
    }]
    return _request(cfg, f"workitems/{child_ado_id}?api-version=7.1", method="PATCH", body=patch)


def find_epic(*, epic_id: str) -> int | None:
    """Search ADO for an existing Epic whose title matches epic_id.
    Returns the numeric ADO work item ID, or None if not found.
    Uses WIQL so the lookup works regardless of local map state."""
    cfg = load_config()
    if cfg["dry_run"]:
        return None
    safe_epic_id  = epic_id.replace("'", "''")
    safe_project  = cfg["azure"]["project"].replace("'", "''")
    safe_type     = cfg["work_item_types"]["epic"].replace("'", "''")
    wiql = {
        "query": (
            f"SELECT [System.Id] FROM WorkItems "
            f"WHERE [System.WorkItemType] = '{safe_type}' "
            f"AND [System.Title] = '{safe_epic_id}' "
            f"AND [System.TeamProject] = '{safe_project}'"
        ),
    }
    try:
        result = _request(cfg, "wiql?api-version=7.1", method="POST", body=wiql)
        if result and result.get("workItems"):
            return result["workItems"][0]["id"]
    except Exception as e:
        print(f"[evyasys] Epic search failed (will attempt creation): {e}")
    return None


def create_epic(*, epic_id: str, title: str | None = None) -> Any:
    """Create an Epic work item. Called internally by create_stories."""
    cfg = load_config()
    display = title or epic_id
    description_html = markdown_to_html(f"# {display}\n\n**Epic ID:** {epic_id}")
    patch = [
        {"op": "add", "path": "/fields/System.Title", "value": display},
        {"op": "add", "path": "/fields/System.Description", "value": description_html},
    ]
    return _request(cfg, _wit_type_url(cfg["work_item_types"]["epic"]), method="POST", body=patch)


def create_stories(*, story_id: str | None, file: str, epic_id: str | None = None) -> Any:
    """Create a User Story work item and link it to its parent Epic."""
    cfg = load_config()
    parsed = _parse_story(Path(file))
    title = f"{story_id}: {parsed['title']}" if story_id else parsed["title"]
    patch = [
        {"op": "add", "path": "/fields/System.Title", "value": title},
        {"op": "add", "path": "/fields/System.Description", "value": markdown_to_html(parsed["description"])},
    ]
    created = _request(cfg, _wit_type_url(cfg["work_item_types"]["story"]), method="POST", body=patch)
    if epic_id and created and created.get("id") and not cfg["dry_run"]:
        try:
            _link_to_parent(cfg, created["id"], epic_id)
            print(f"[evyasys] Linked story {created['id']} → epic {epic_id}")
        except Exception as e:
            print(f"[evyasys] Epic link failed (story still created): {e}")
    return created


def create_subtasks(*, story_id: str, file: str, story_ado_id: int | None = None) -> Any:
    """Create Task work items. If story_ado_id is supplied, each task is linked
    to the parent User Story using the ADO hierarchy relation."""
    cfg = load_config()
    md = Path(file).read_text(encoding="utf-8")
    parts: list[str] = []
    cur: list[str] = []
    for line in md.splitlines():
        if line.lstrip().lower().startswith("## task"):
            if cur:
                parts.append("\n".join(cur)); cur = []
        cur.append(line)
    if cur:
        parts.append("\n".join(cur))
    parts = [p for p in parts[1:] if p.strip()]

    results = []
    for section in parts:
        first = next((l for l in section.splitlines() if l.strip()), "Untitled task")
        title_line = first.split("—", 1)[-1].strip() if "—" in first else first.lstrip("# ").strip()
        content_body = "\n".join(section.splitlines()[1:]).strip()
        full_md = f"## {title_line}\n\n{content_body}"
        patch = [
            {"op": "add", "path": "/fields/System.Title", "value": f"{story_id}: {title_line}"},
            {"op": "add", "path": "/fields/System.Description", "value": markdown_to_html(full_md)},
        ]
        created = _request(cfg, _wit_type_url(cfg["work_item_types"]["task"]), method="POST", body=patch)
        if story_ado_id and created and created.get("id") and not cfg["dry_run"]:
            try:
                _link_to_parent(cfg, created["id"], story_ado_id)
                print(f"[evyasys] Linked task {created['id']} → story {story_ado_id}")
            except Exception as e:
                print(f"[evyasys] Story link failed (task still created): {e}")
        results.append(created)
    return results


def set_state(*, story_id: str, state: str) -> Any:
    cfg = load_config()
    numeric = "".join(ch for ch in story_id if ch.isdigit()) or story_id
    patch = [{"op": "add", "path": "/fields/System.State", "value": state}]
    return _request(cfg, f"workitems/{numeric}?api-version=7.1", method="PATCH", body=patch)


def get_work_item(*, story_id: str) -> Any:
    cfg = load_config()
    numeric = "".join(ch for ch in story_id if ch.isdigit()) or story_id
    return _request(cfg, f"workitems/{numeric}?api-version=7.1", method="GET")


def main() -> None:
    p = argparse.ArgumentParser(prog="azure_devops.py")
    sub = p.add_subparsers(dest="cmd", required=True)
    cs = sub.add_parser("create-stories"); cs.add_argument("--file", required=True); cs.add_argument("--id", default=None)
    csub = sub.add_parser("create-subtasks"); csub.add_argument("--story", required=True); csub.add_argument("--file", required=True); csub.add_argument("--story-ado-id", type=int, default=None)
    ss = sub.add_parser("set-state"); ss.add_argument("--id", required=True); ss.add_argument("--state", required=True)
    gw = sub.add_parser("get-work-item"); gw.add_argument("--id", required=True)
    args = p.parse_args()

    if args.cmd == "create-stories":    out = create_stories(story_id=args.id, file=args.file)
    elif args.cmd == "create-subtasks": out = create_subtasks(story_id=args.story, file=args.file, story_ado_id=args.story_ado_id)
    elif args.cmd == "set-state":       out = set_state(story_id=args.id, state=args.state)
    elif args.cmd == "get-work-item":   out = get_work_item(story_id=args.id)
    else:
        p.error(f"Unknown command: {args.cmd}"); return
    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    main()
