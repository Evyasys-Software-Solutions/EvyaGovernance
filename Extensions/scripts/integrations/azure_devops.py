"""Azure DevOps integration (Python mirror of azure_devops.js).

Reads layered config: env > ~/.evyasys/credentials > .evyasys/project.yaml.
Default mode is LIVE. Set EVYASYS_DRY_RUN=1 to preview.

Usage:
    python azure_devops.py create-story    --file PATH [--id EVYA-id]
    python azure_devops.py create-subtasks --story EVYA-id --file PATH
    python azure_devops.py set-state       --id EVYA-id --state STATE
    python azure_devops.py get-work-item   --id EVYA-id
"""
from __future__ import annotations

import argparse
import base64
import json
import sys
import urllib.parse
from pathlib import Path
from typing import Any

# Local import (this file lives in scripts/integrations/, lib/ is a sibling)
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib.evyasys_config import load_config  # noqa: E402


def _ado_url(cfg: dict, suffix: str) -> str:
    org = urllib.parse.quote(cfg["azure"]["org"], safe="")
    project = urllib.parse.quote(cfg["azure"]["project"], safe="")
    return f"https://dev.azure.com/{org}/{project}/_apis/wit/{suffix}"


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
        raise RuntimeError("No PAT available. Run scripts/login.sh (or login.ps1).")

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


def _parse_story(file: Path) -> dict:
    md = file.read_text(encoding="utf-8")
    title = "Untitled"
    for line in md.splitlines():
        if line.startswith("# "):
            title = line[2:].strip()
            break
    return {"title": title, "description": md}


def create_story(*, story_id: str | None, file: str) -> Any:
    cfg = load_config()
    parsed = _parse_story(Path(file))
    title = f"{story_id}: {parsed['title']}" if story_id else parsed["title"]
    patch = [
        {"op": "add", "path": "/fields/System.Title", "value": title},
        {"op": "add", "path": "/fields/System.Description", "value": parsed["description"]},
    ]
    return _request(cfg, "workitems/$User%20Story?api-version=7.1", method="POST", body=patch)


def create_subtasks(*, story_id: str, file: str) -> Any:
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
        patch = [
            {"op": "add", "path": "/fields/System.Title", "value": f"{story_id}: {title_line}"},
            {"op": "add", "path": "/fields/System.Description", "value": section.strip()},
        ]
        results.append(_request(cfg, "workitems/$Task?api-version=7.1", method="POST", body=patch))
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
    cs = sub.add_parser("create-story"); cs.add_argument("--file", required=True); cs.add_argument("--id", default=None)
    csub = sub.add_parser("create-subtasks"); csub.add_argument("--story", required=True); csub.add_argument("--file", required=True)
    ss = sub.add_parser("set-state"); ss.add_argument("--id", required=True); ss.add_argument("--state", required=True)
    gw = sub.add_parser("get-work-item"); gw.add_argument("--id", required=True)
    args = p.parse_args()

    if args.cmd == "create-story":      out = create_story(story_id=args.id, file=args.file)
    elif args.cmd == "create-subtasks": out = create_subtasks(story_id=args.story, file=args.file)
    elif args.cmd == "set-state":       out = set_state(story_id=args.id, state=args.state)
    elif args.cmd == "get-work-item":   out = get_work_item(story_id=args.id)
    else:
        p.error(f"Unknown command: {args.cmd}"); return
    print(json.dumps(out, indent=2, default=str))


if __name__ == "__main__":
    main()
