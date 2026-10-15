#!/usr/bin/env python3
"""
DALA ARBA — site builder.

Single-source-of-truth for nav, footer, and scripts.
Edit the files in _partials/, then run:

    python build.py

The script walks every *.html in the project (skipping _partials/ and uploads/)
and replaces the content between marker pairs with the partial's content.

Markers expected in each page:
    <!-- nav:start -->     ... <!-- nav:end -->
    <!-- footer:start -->  ... <!-- footer:end -->
    <!-- scripts:start --> ... <!-- scripts:end -->

Markers themselves are preserved so the script is idempotent.

Usage:
    python build.py            # sync all pages
    python build.py --check    # dry-run, only report which pages would change
    python build.py --verbose  # show every replacement
    python build.py --dist     # sync + write Cloudflare Pages output to dist/
"""

import argparse
import re
import shutil
import sys
from pathlib import Path

ROOT = Path(__file__).parent.resolve()
DIST_DIR = ROOT / "dist"
PARTIALS_DIR = ROOT / "_partials"

PARTIALS = {
    "nav":     PARTIALS_DIR / "nav.html",
    "footer":  PARTIALS_DIR / "footer.html",
    "scripts": PARTIALS_DIR / "scripts.html",
}

SKIP_DIRS = {"_partials", "uploads", "node_modules", ".git", "dist"}

DIST_SKIP_DIRS = {
    "_partials", "_archive_", "uploads", "node_modules", ".git", "dist",
    "worker", "nginx", "scripts",
}
DIST_SKIP_FILES = {
    "build.py", "Dockerfile", "docker-compose.yml", ".dockerignore",
    "serve.ps1", "Запустить-сайт.bat",
}
DIST_SKIP_SUFFIXES = (".md", ".bak", ".bak2", ".bak3", ".tmp")


def load_partials():
    out = {}
    for key, path in PARTIALS.items():
        if not path.exists():
            sys.exit(f"ERROR: partial missing: {path}")
        out[key] = path.read_text(encoding="utf-8").strip()
    return out


def find_html_files():
    files = []
    for f in ROOT.rglob("*.html"):
        if any(part in SKIP_DIRS for part in f.parts):
            continue
        files.append(f)
    return sorted(files)


def render(text: str, partials: dict) -> str:
    """Replace content between <!-- key:start --> and <!-- key:end --> for each partial."""
    for key, content in partials.items():
        pattern = re.compile(
            rf"(<!-- {key}:start -->)(.*?)(<!-- {key}:end -->)",
            re.DOTALL,
        )
        replacement = rf"\1\n{content}\n\3"
        text = pattern.sub(replacement, text)
    return text


def should_skip_dist(path: Path) -> bool:
    rel = path.relative_to(ROOT)
    if any(part in DIST_SKIP_DIRS for part in rel.parts):
        return True
    if path.name in DIST_SKIP_FILES:
        return True
    if path.name.startswith(".") and path.name not in {"_headers", "_redirects"}:
        return True
    return path.suffix.lower() in DIST_SKIP_SUFFIXES


def write_dist():
    if DIST_DIR.exists():
        shutil.rmtree(DIST_DIR)
    copied = 0
    for src in ROOT.rglob("*"):
        if not src.is_file():
            continue
        if should_skip_dist(src):
            continue
        rel = src.relative_to(ROOT)
        dest = DIST_DIR / rel
        dest.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(src, dest)
        copied += 1
    print(f"  dist/ ready: {copied} files -> {DIST_DIR}")
    return copied


def main():
    ap = argparse.ArgumentParser(description="Sync nav/footer/scripts from _partials/ into all HTML pages.")
    ap.add_argument("--check",   action="store_true", help="Dry-run: only report which files would change.")
    ap.add_argument("--verbose", action="store_true", help="Print every replacement.")
    ap.add_argument("--dist",    action="store_true", help="After sync, write deployable output to dist/.")
    args = ap.parse_args()

    partials = load_partials()
    files = find_html_files()

    changed = 0
    skipped = 0
    no_marker = 0

    for f in files:
        rel = f.relative_to(ROOT).as_posix()
        text = f.read_text(encoding="utf-8")

        # Skip files that have no markers at all (raw partials, or unrelated HTML)
        if not any(f"<!-- {k}:start -->" in text for k in partials):
            no_marker += 1
            if args.verbose:
                print(f"  · no markers, skip:  {rel}")
            continue

        new_text = render(text, partials)

        if new_text == text:
            skipped += 1
            if args.verbose:
                print(f"  = unchanged:         {rel}")
            continue

        if args.check:
            print(f"  ✎ would update:      {rel}")
        else:
            f.write_text(new_text, encoding="utf-8")
            print(f"  ✓ updated:           {rel}")
        changed += 1

    print()
    print(f"Pages with markers: {len(files) - no_marker}")
    print(f"  Updated:    {changed}")
    print(f"  Unchanged:  {skipped}")
    print(f"  Skipped (no markers): {no_marker}")
    if args.check and changed:
        sys.exit(1)

    if args.dist:
        if args.check:
            print("  (skipping dist/ write in --check mode)")
        else:
            print()
            write_dist()


if __name__ == "__main__":
    main()
