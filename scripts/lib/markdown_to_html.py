"""Lightweight Markdown → HTML converter for Azure DevOps work item descriptions.
ADO renders HTML in description fields; raw Markdown shows as symbols.
No external dependencies — stdlib re only.

Supported syntax:
  Headings h1–h4, bold/italic/bold+italic/strikethrough, unordered & ordered lists,
  checkboxes (- [ ] / - [x]), GFM pipe tables, blockquotes, horizontal rules,
  fenced code blocks, inline code, links, paragraphs.
"""
from __future__ import annotations
import re


def markdown_to_html(md: str) -> str:
    if not md or not isinstance(md, str):
        return ""

    html = md

    # ── Fenced code blocks ────────────────────────────────────────────────
    def _fence(m: re.Match) -> str:
        lang = m.group(1).strip()
        code = _escape_html(m.group(2).rstrip())
        cls = f' class="language-{_escape_attr(lang)}"' if lang else ""
        return f"<pre><code{cls}>{code}</code></pre>"

    html = re.sub(r"```([^\n]*)\n([\s\S]*?)```", _fence, html)
    html = re.sub(r"~~~([^\n]*)\n([\s\S]*?)~~~", _fence, html)

    # ── GFM pipe tables ───────────────────────────────────────────────────
    def _table(m: re.Match) -> str:
        block = m.group(1)
        rows = [r for r in block.strip().splitlines() if r.strip()]
        if len(rows) < 2:
            return m.group(0)

        def is_align(r: str) -> bool:
            return bool(re.match(r"^\|[\s:|-]+\|$", r.strip()))

        def parse_row(r: str) -> list[str]:
            return [c.strip() for c in re.sub(r"^\||\|$", "", r).split("|")]

        out = '<table border="1" cellpadding="4" cellspacing="0" style="border-collapse:collapse">'
        header_done = False
        for i, row in enumerate(rows):
            if is_align(row):
                continue
            cells = parse_row(row)
            if not header_done and i == 0:
                ths = "".join(f"<th>{_inline(c)}</th>" for c in cells)
                out += f"<thead><tr>{ths}</tr></thead><tbody>"
                header_done = True
            else:
                tds = "".join(f"<td>{_inline(c)}</td>" for c in cells)
                out += f"<tr>{tds}</tr>"
        out += "</tbody></table>"
        return "\n" + out + "\n"

    html = re.sub(r"(?:^|\n)((?:\|[^\n]+\|\s*\n)+)", _table, html)

    # ── Headings ──────────────────────────────────────────────────────────
    html = re.sub(r"^#{4}\s+(.+)$", lambda m: f"<h4>{_inline(m.group(1))}</h4>", html, flags=re.MULTILINE)
    html = re.sub(r"^#{3}\s+(.+)$", lambda m: f"<h3>{_inline(m.group(1))}</h3>", html, flags=re.MULTILINE)
    html = re.sub(r"^#{2}\s+(.+)$", lambda m: f"<h2>{_inline(m.group(1))}</h2>", html, flags=re.MULTILINE)
    html = re.sub(r"^#{1}\s+(.+)$", lambda m: f"<h1>{_inline(m.group(1))}</h1>", html, flags=re.MULTILINE)

    # ── Horizontal rules ─────────────────────────────────────────────────
    html = re.sub(r"^(?:---+|===+|\*\*\*+)\s*$", "<hr/>", html, flags=re.MULTILINE)

    # ── Blockquotes ───────────────────────────────────────────────────────
    def _blockquote(m: re.Match) -> str:
        inner = re.sub(r"^>\s?", "", m.group(1).strip(), flags=re.MULTILINE).strip()
        return f"\n<blockquote>{_inline(inner)}</blockquote>\n"

    html = re.sub(r"(?:^|\n)((?:^>\s?[^\n]*\n?)+)", _blockquote, html, flags=re.MULTILINE)

    # ── Unordered lists (checkboxes first) ───────────────────────────────
    def _ul(m: re.Match) -> str:
        items = m.group(1).strip().splitlines()
        lis = []
        for item in items:
            cb = re.match(r"^[ \t]*[-*+]\s+\[([ xX])\]\s+(.*)", item)
            if cb:
                checked = ' checked' if cb.group(1).lower() == 'x' else ''
                lis.append(f"<li><input type=\"checkbox\"{checked} disabled> {_inline(cb.group(2))}</li>")
            else:
                text = re.sub(r"^[ \t]*[-*+]\s+", "", item)
                lis.append(f"<li>{_inline(text)}</li>")
        return "\n<ul>" + "".join(lis) + "</ul>\n"

    html = re.sub(r"(?:^|\n)((?:[ \t]*[-*+]\s+.+\n?)+)", _ul, html)

    # ── Ordered lists ─────────────────────────────────────────────────────
    def _ol(m: re.Match) -> str:
        items = m.group(1).strip().splitlines()
        lis = [f"<li>{_inline(re.sub(r'^[ \t]*[0-9]+[.)]\s+', '', i))}</li>" for i in items]
        return "\n<ol>" + "".join(lis) + "</ol>\n"

    html = re.sub(r"(?:^|\n)((?:[ \t]*\d+[.)]\s+.+\n?)+)", _ol, html)

    # ── Paragraphs ────────────────────────────────────────────────────────
    block_tag_re = re.compile(r"^<(h[1-6]|ul|ol|li|table|thead|tbody|tr|th|td|blockquote|pre|hr|p)")
    parts = re.split(r"\n{2,}", html)
    result = []
    for part in parts:
        trimmed = part.strip()
        if not trimmed:
            continue
        if block_tag_re.match(trimmed):
            result.append(trimmed)
        else:
            result.append(f"<p>{_inline(trimmed.replace(chr(10), '<br/>'))}</p>")
    html = "\n".join(result)

    return html


# ── Inline transforms ─────────────────────────────────────────────────────

def _inline(text: str) -> str:
    if not text:
        return ""
    t = text

    # Inline code (before bold/italic)
    t = re.sub(r"`([^`]+)`", lambda m: f"<code>{_escape_html(m.group(1))}</code>", t)

    # Bold + italic
    t = re.sub(r"\*{3}(.+?)\*{3}", r"<strong><em>\1</em></strong>", t)
    t = re.sub(r"_{3}(.+?)_{3}", r"<strong><em>\1</em></strong>", t)

    # Bold
    t = re.sub(r"\*{2}(.+?)\*{2}", r"<strong>\1</strong>", t)
    t = re.sub(r"_{2}(.+?)_{2}", r"<strong>\1</strong>", t)

    # Italic
    t = re.sub(r"\*(.+?)\*", r"<em>\1</em>", t)
    t = re.sub(r"_(.+?)_", r"<em>\1</em>", t)

    # Strikethrough
    t = re.sub(r"~~(.+?)~~", r"<del>\1</del>", t)

    # Links
    t = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        lambda m: f'<a href="{_escape_attr(m.group(2))}">{m.group(1)}</a>',
        t,
    )

    return t


def _escape_html(s: str) -> str:
    return s.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


def _escape_attr(s: str) -> str:
    return s.replace('"', "&quot;").replace("'", "&#39;")
