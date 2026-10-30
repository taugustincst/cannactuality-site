#!/usr/bin/env python3
"""Scaffold a new CannActuality research brief.

Usage:
    python3 tools/new_brief.py SLUG "Title" "Category" "One-line summary" [--date YYYY-MM-DD]

What it does (offline, idempotent):
  1. Renders tools/brief-template.html into briefs/<slug>.html, filling the
     title/category/summary/date placeholders. Refuses to overwrite an
     existing brief file.
  2. Inserts an index entry at the top of the brief list in research.html
     (newest first, right after the BEGIN BRIEF LIST marker). If the slug is
     already listed, the entry is not duplicated.
  3. Validates that every internal (relative) link in every HTML file in the
     site resolves to a real file, and reports any that do not.

The body of the brief is written by the researcher after scaffolding —
this tool handles structure, indexing, and link hygiene only.
"""

import argparse
import datetime
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TEMPLATE = ROOT / "tools" / "brief-template.html"
RESEARCH = ROOT / "research.html"
BRIEFS_DIR = ROOT / "briefs"
BEGIN_MARKER = "<!-- BEGIN BRIEF LIST -->"
END_MARKER = "<!-- END BRIEF LIST -->"

INDEX_ENTRY = """      <div class="brief-row">
        <span class="tag">{category}</span>
        <h3><a href="briefs/{slug}.html">{title}</a></h3>
        <p>{summary}</p>
        <p class="brief-meta">{date_long} · {category} · CannActuality Research Desk</p>
      </div>
"""


def fail(msg):
    print(f"error: {msg}", file=sys.stderr)
    sys.exit(1)


def render_brief(slug, title, category, summary, date):
    target = BRIEFS_DIR / f"{slug}.html"
    if target.exists():
        print(f"brief already exists, not overwriting: {target}")
        return False
    text = TEMPLATE.read_text(encoding="utf-8")
    # Split off the trailing index-entry comment so it isn't copied into the brief.
    text = text.split("<!-- INDEX ENTRY")[0].rstrip() + "\n"
    replacements = {
        "{{TITLE}}": title,
        "{{CATEGORY}}": category,
        "{{SUMMARY}}": summary,
        "{{SLUG}}": slug,
        "{{DATE_LONG}}": date.strftime("%B %-d, %Y") if sys.platform != "win32" else date.strftime("%B %d, %Y"),
        "{{DATE_ISO}}": date.isoformat(),
    }
    for key, value in replacements.items():
        text = text.replace(key, value)
    target.write_text(text, encoding="utf-8")
    print(f"created brief: {target}")
    return True


def insert_index_entry(slug, title, category, summary, date):
    html = RESEARCH.read_text(encoding="utf-8")
    if f"briefs/{slug}.html" in html:
        print("index entry already present, skipping insert (idempotent)")
        return
    if BEGIN_MARKER not in html or END_MARKER not in html:
        fail(f"brief-list markers not found in {RESEARCH}")
    entry = INDEX_ENTRY.format(
        slug=slug,
        title=title,
        category=category,
        summary=summary,
        date_long=date.strftime("%B %-d, %Y") if sys.platform != "win32" else date.strftime("%B %d, %Y"),
    )
    html = html.replace(BEGIN_MARKER + "\n", BEGIN_MARKER + "\n" + entry, 1)
    RESEARCH.write_text(html, encoding="utf-8")
    print(f"inserted index entry at top of {RESEARCH}")


HREF_RE = re.compile(r'(?:href|src)="([^"#]+)(?:#[^"]*)?"')


def validate_links():
    """Check every relative href/src in every .html file resolves to a file."""
    broken = []
    html_files = sorted(ROOT.rglob("*.html"))
    for page in html_files:
        if "tools" in page.relative_to(ROOT).parts and page.name == "brief-template.html":
            continue  # template placeholders are not real links
        for match in HREF_RE.finditer(page.read_text(encoding="utf-8")):
            url = match.group(1).strip()
            if not url or url.startswith(("http://", "https://", "mailto:", "tel:", "data:", "//")):
                continue
            target = (page.parent / url).resolve()
            if not target.exists():
                broken.append(f"{page.relative_to(ROOT)}: {url}")
    if broken:
        print("BROKEN INTERNAL LINKS:")
        for item in broken:
            print(f"  - {item}")
        return False
    print(f"link validation OK ({len(html_files)} html files checked)")
    return True


def main():
    parser = argparse.ArgumentParser(description="Scaffold a new CannActuality brief.")
    parser.add_argument("slug", help="URL slug, e.g. minor-cannabinoids-2026")
    parser.add_argument("title", help="Brief title")
    parser.add_argument("category", help="e.g. Consumer Trends, Category Deep-Dive, Regulatory Watch")
    parser.add_argument("summary", help="One-line summary used in meta description and the index entry")
    parser.add_argument("--date", help="Publication date YYYY-MM-DD (default: today)")
    args = parser.parse_args()

    if not re.fullmatch(r"[a-z0-9][a-z0-9\-]*", args.slug):
        fail("slug must be lowercase letters, digits, and hyphens")
    date = datetime.date.today()
    if args.date:
        try:
            date = datetime.date.fromisoformat(args.date)
        except ValueError:
            fail("--date must be YYYY-MM-DD")

    render_brief(args.slug, args.title, args.category, args.summary, date)
    insert_index_entry(args.slug, args.title, args.category, args.summary, date)
    if not validate_links():
        sys.exit(2)
    print("done. Next: write the brief body in briefs/%s.html, then commit and push." % args.slug)


if __name__ == "__main__":
    main()
