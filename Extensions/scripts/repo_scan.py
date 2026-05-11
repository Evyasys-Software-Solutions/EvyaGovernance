"""Lightweight repo scanner used by the EvyaFlow context loader.

Goals: cheap, dependency-free, useful summary for the agent. Deliberately
*not* a full AST analyzer — just enough signal to inform the BA/dev about
what already exists.

Usage:
    python repo_scan.py --summary
    python repo_scan.py --hint "feature words"
    python repo_scan.py --story EVYA-1042 --diff

Outputs JSON to stdout.
"""
from __future__ import annotations

import argparse
import json
import os
import re
import subprocess
from collections import Counter
from pathlib import Path

# File types we treat as "code"
CODE_EXTS = {
    ".py", ".js", ".jsx", ".ts", ".tsx", ".java", ".kt", ".go", ".rb",
    ".rs", ".cs", ".cpp", ".c", ".h", ".hpp", ".swift", ".php", ".scala",
}
SKIP_DIRS = {".git", "node_modules", "dist", "build", "venv", ".venv", "__pycache__", ".next", "out"}


def walk(root: Path):
    for d, dirs, files in os.walk(root):
        dirs[:] = [x for x in dirs if x not in SKIP_DIRS and not x.startswith(".")]
        for f in files:
            yield Path(d) / f


def summarize_codebase(root: Path) -> dict:
    by_ext = Counter()
    file_count = 0
    total_lines = 0
    biggest = []
    for p in walk(root):
        if p.suffix.lower() not in CODE_EXTS:
            continue
        try:
            n = sum(1 for _ in p.open("r", encoding="utf-8", errors="ignore"))
        except OSError:
            continue
        file_count += 1
        total_lines += n
        by_ext[p.suffix.lower()] += 1
        biggest.append((n, str(p.relative_to(root))))
    biggest.sort(reverse=True)
    return {
        "fileCount": file_count,
        "totalLines": total_lines,
        "byExtension": dict(by_ext.most_common()),
        "largestFiles": [{"lines": n, "path": p} for n, p in biggest[:10]],
    }


def find_hints(root: Path, hint: str, limit: int = 25) -> list[dict]:
    if not hint:
        return []
    hits = []
    pattern = re.compile(re.escape(hint), re.IGNORECASE)
    for p in walk(root):
        if p.suffix.lower() not in CODE_EXTS:
            continue
        try:
            with p.open("r", encoding="utf-8", errors="ignore") as f:
                for i, line in enumerate(f, 1):
                    if pattern.search(line):
                        hits.append({"path": str(p.relative_to(root)), "line": i, "snippet": line.strip()[:200]})
                        if len(hits) >= limit:
                            return hits
        except OSError:
            continue
    return hits


def git_diff_summary(root: Path, story: str | None) -> dict:
    try:
        # Best effort — if not a git repo or git missing, return empty.
        out = subprocess.check_output(
            ["git", "-C", str(root), "status", "--porcelain"],
            stderr=subprocess.DEVNULL, timeout=5,
        ).decode("utf-8", errors="ignore")
    except (subprocess.SubprocessError, FileNotFoundError):
        return {"available": False}
    files = [l[3:] for l in out.splitlines() if l.strip()]
    return {"available": True, "story": story, "modifiedFiles": files[:50]}


def main() -> None:
    p = argparse.ArgumentParser(prog="repo_scan.py")
    p.add_argument("--root", default=os.getcwd())
    p.add_argument("--summary", action="store_true")
    p.add_argument("--hint", default="")
    p.add_argument("--story", default=None)
    p.add_argument("--diff", action="store_true")
    args = p.parse_args()

    root = Path(args.root)
    out: dict = {"root": str(root)}
    if args.summary or not (args.hint or args.diff):
        out["summary"] = summarize_codebase(root)
    if args.hint:
        out["hints"] = find_hints(root, args.hint)
    if args.diff:
        out["diff"] = git_diff_summary(root, args.story)
    print(json.dumps(out, indent=2))


if __name__ == "__main__":
    main()
