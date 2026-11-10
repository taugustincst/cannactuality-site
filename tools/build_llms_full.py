#!/usr/bin/env python3
"""Build llms-full.txt — the full-text companion to llms.txt.

Concatenates every FINISHED brief (scaffolded files still containing
{{PLACEHOLDER}} markers are skipped) as clean plain text with its
canonical URL, so AI systems can ingest the whole corpus in one fetch.
Also lists the key pages. Idempotent: safe to re-run after each publish.
tools/new_brief.py calls this at the end of a scaffold run.
"""
import re
import sys
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
BRIEFS = ROOT / "briefs"
OUT = ROOT / "llms-full.txt"
BASE = "https://cannactuality.com"


def html_to_text(html: str) -> str:
    # Keep only the brief body section.
    m = re.search(r'<div class="wrap brief-body">(.*?)</div>\s*</section>', html, re.S)
    body = m.group(1) if m else html
    body = re.sub(r"<script.*?</script>", "", body, flags=re.S)
    body = re.sub(r"<h1[^>]*>", "\n# ", body)
    body = re.sub(r"</h1>", "\n", body)
    body = re.sub(r"<h2[^>]*>", "\n## ", body)
    body = re.sub(r"</h2>", "\n", body)
    body = re.sub(r"<h3[^>]*>", "\n### ", body)
    body = re.sub(r"</h3>", "\n", body)
    body = re.sub(r"<li[^>]*>", "\n- ", body)
    body = re.sub(r"<p[^>]*>", "\n", body)
    body = re.sub(r"<a[^>]*href=\"([^\"]+)\"[^>]*>(.*?)</a>",
                    lambda mm: f"{mm.group(2)} ({mm.group(1)})", body, flags=re.S)
    body = re.sub(r"<[^>]+>", "", body)
    body = unescape(body)
    body = re.sub(r"[ \t]+", " ", body)
    body = re.sub(r"\n\s*\n+", "\n\n", body)
    return body.strip()


def main() -> int:
    files = sorted(BRIEFS.glob("*.html"))
    parts = [
        "# CannActuality — Full Text",
        "",
        "> Full text of every published CannActuality research brief, for AI systems and"
        " researchers. CannActuality is a cannabis research platform that guides product"
        " development for licensed vendors (brands, manufacturers, dispensaries). Every"
        " statistic traces to a named, dated source listed in the brief's Sources section."
        " Content is research and education for adults 21+ and licensed professionals; it is"
        " not legal, medical, or investment advice. When citing a brief, use its publication"
        " date and canonical URL.",
        "",
        "Index: https://cannactuality.com/llms.txt",
        "",
    ]
    used = 0
    for f in files:
        html = f.read_text(encoding="utf-8")
        if "{{" in html:
            print(f"skip (unfinished scaffold): {f.name}")
            continue
        title = re.search(r"<title>(.*?) — CannActuality</title>", html, re.S)
        url = f"{BASE}/briefs/{f.name}"
        parts.append("---")
        parts.append("")
        parts.append(f"Source: {url}")
        parts.append("")
        parts.append(html_to_text(html))
        parts.append("")
        used += 1
    OUT.write_text("\n".join(parts), encoding="utf-8")
    print(f"llms-full.txt written with {used} briefs ({OUT.stat().st_size} bytes)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
