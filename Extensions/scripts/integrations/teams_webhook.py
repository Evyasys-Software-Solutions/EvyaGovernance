"""Microsoft Teams incoming-webhook integration (Python mirror of teams_webhook.js).

Reads webhook from .evyasys/project.yaml (per-project) or env. Default mode is LIVE.

Usage:
    python teams_webhook.py story-created --id EVYA-id [--file PATH]
    python teams_webhook.py dev-kickoff   --id EVYA-id
    python teams_webhook.py dev-finished  --id EVYA-id
    python teams_webhook.py qa-started    --id EVYA-id
    python teams_webhook.py qa-finished   --id EVYA-id
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from lib.evyasys_config import load_config  # noqa: E402


def _build_card(*, title: str, summary: str, sections: list[dict], link: str | None = None) -> dict:
    card: dict[str, Any] = {
        "contentType": "application/vnd.microsoft.teams.card.o365connector",
        "content": {
            "@type": "MessageCard",
            "@context": "http://schema.org/extensions",
            "summary": summary, "title": title, "sections": sections,
        },
    }
    if link:
        card["content"]["potentialAction"] = [{
            "@type": "OpenUri", "name": "Open in Azure DevOps",
            "targets": [{"os": "default", "uri": link}],
        }]
    return card


def _post(card: dict) -> Any:
    cfg = load_config()
    if cfg["dry_run"]:
        print("[evyasys:dry-run] Teams card payload:\n" + json.dumps(card, indent=2))
        return {"dryRun": True}
    if not cfg["teams"]["webhook"]:
        raise RuntimeError("No Teams webhook configured (.evyasys/project.yaml#teams.webhook).")
    try:
        import requests  # type: ignore
    except ImportError as e:
        raise RuntimeError("Install requests: pip install requests") from e
    resp = requests.post(cfg["teams"]["webhook"], headers={"Content-Type": "application/json"}, data=json.dumps(card))
    resp.raise_for_status()
    return {"ok": True}


def _snippet(text: str, max_len: int = 600) -> str:
    return text if len(text) <= max_len else text[:max_len] + "…"


def story_created(*, story_id: str, file: str | None) -> Any:
    md = Path(file).read_text(encoding="utf-8") if file else ""
    return _post(_build_card(
        title=f"New Story Created: {story_id}",
        summary=f"New Story {story_id}",
        sections=[{"title": "Draft", "text": _snippet(md)}],
    ))


def dev_kickoff(*, story_id: str) -> Any:
    return _post(_build_card(title=f"Dev kicked off: {story_id}", summary=f"Dev started {story_id}",
                             sections=[{"title": "Status", "text": "In Progress"}]))


def dev_finished(*, story_id: str) -> Any:
    return _post(_build_card(title=f"Dev complete → Ready for QA: {story_id}", summary=f"Dev complete {story_id}",
                             sections=[{"title": "Status", "text": "Ready for QA"}]))


def qa_started(*, story_id: str) -> Any:
    return _post(_build_card(title=f"QA started: {story_id}", summary=f"QA started {story_id}",
                             sections=[{"title": "Status", "text": "In QA"}]))


def qa_finished(*, story_id: str) -> Any:
    return _post(_build_card(title=f"Released: {story_id}", summary=f"Released {story_id}",
                             sections=[{"title": "Status", "text": "Done"}]))


def main() -> None:
    p = argparse.ArgumentParser(prog="teams_webhook.py")
    sub = p.add_subparsers(dest="cmd", required=True)
    sc = sub.add_parser("story-created"); sc.add_argument("--id", required=True); sc.add_argument("--file", default=None)
    for name in ("dev-kickoff", "dev-finished", "qa-started", "qa-finished"):
        s = sub.add_parser(name); s.add_argument("--id", required=True)

    args = p.parse_args()
    cmd = args.cmd.replace("-", "_")
    fn = globals().get(cmd)
    if not fn:
        p.error(f"Unknown command: {args.cmd}"); return
    kwargs: dict[str, Any] = {"story_id": args.id}
    if args.cmd == "story-created":
        kwargs["file"] = args.file
    print(json.dumps(fn(**kwargs), indent=2, default=str))


if __name__ == "__main__":
    main()
