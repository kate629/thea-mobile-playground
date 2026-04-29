#!/usr/bin/env python3
"""
Wrap every `productUrl` field in the static occasion-guide source files
(`src/components/landing/marketing/sample*Carousels.ts`) with the Sovrn
affiliate redirect template. Idempotent: URLs that are already Sovrn-wrapped
(redirect.viglink.com or sovrn.co) are skipped.

Why this exists:
  The static occasion guides hardcode product URLs in TS source files. Unlike
  the Typesense product catalog (which has `affiliateUrl` minted by the
  on-write trigger in functions/triggers/product_enhancement_triggers.py),
  these static URLs were ORIGINALLY raw merchant links. Result: clicks on
  occasion-guide products went straight to the merchant and never registered
  in Sovrn analytics. Discovered 2026-04-29 when Sovrn dashboard showed ~8
  clicks despite hundreds of test impressions.

  This script pre-encodes them once (matching the project pattern: "we don't
  wrap live, we pre-encode"). Re-run after adding new occasion guide products
  to wrap them too — the script is idempotent.

Usage:
  python3 scripts/wrap_occasion_guide_urls.py             # dry run (default)
  python3 scripts/wrap_occasion_guide_urls.py --execute   # actually rewrite

Sovrn URL template:
  https://redirect.viglink.com?key=<KEY>&u=<urlencoded merchant URL>

  No `cuid` query param for static guide products (no Firestore product ID).
  The trigger adds `cuid=<productId>` for Typesense catalog products to
  attribute clicks to the source product; static guides don't have that
  identifier, so we just skip cuid.

Publisher key:
  Visible in any served `affiliateUrl` field of a Typesense product. Sovrn
  publisher keys are designed to be public (they appear in user-facing
  redirect URLs), so baking it into source files is fine.
"""

import argparse
import os
import re
import sys
from urllib.parse import quote

PUBLISHER_KEY = "9517d72dee2e8e6a77f8f01ced0f35f0"
SOVRN_HOST = "https://redirect.viglink.com"
GUIDE_DIR = os.path.join(
    os.path.dirname(__file__),
    "..",
    "src",
    "components",
    "landing",
    "marketing",
)


def is_already_wrapped(url: str) -> bool:
    return ("redirect.viglink.com" in url) or ("sovrn.co/" in url)


def wrap(url: str) -> str:
    """Wrap a raw merchant URL with the Sovrn redirect template."""
    if is_already_wrapped(url):
        return url
    encoded = quote(url, safe="")
    return f"{SOVRN_HOST}?key={PUBLISHER_KEY}&u={encoded}"


def process_file(path: str, execute: bool) -> dict:
    with open(path) as f:
        content = f.read()
    # Match `productUrl: '...'` — JS escape-aware (handles `\'` inside strings).
    pattern = re.compile(r"(productUrl:\s*')((?:[^'\\]|\\.)+?)(')", re.MULTILINE)
    matches = list(pattern.finditer(content))
    wrapped_count = 0
    already_count = 0
    new_content = content
    # Process in reverse so character offsets remain valid as we rewrite.
    for m in reversed(matches):
        original = m.group(2)
        # Unescape JS string escapes for inspection.
        unescaped = original.replace("\\'", "'")
        if is_already_wrapped(unescaped):
            already_count += 1
            continue
        wrapped_url = wrap(unescaped)
        # Re-escape any literal single quotes for embedding in a JS string.
        wrapped_js = wrapped_url.replace("'", "\\'")
        new_content = new_content[: m.start(2)] + wrapped_js + new_content[m.end(2) :]
        wrapped_count += 1
    if execute and wrapped_count > 0:
        with open(path, "w") as f:
            f.write(new_content)
    return {
        "wrapped": wrapped_count,
        "already": already_count,
        "total": len(matches),
    }


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--execute", action="store_true", help="Actually rewrite files (default is dry-run)")
    args = ap.parse_args()

    files = sorted(
        f for f in os.listdir(GUIDE_DIR)
        if f.startswith("sample") and f.endswith("Carousels.ts")
    )
    if not files:
        print(f"ERROR: no sample*Carousels.ts files in {GUIDE_DIR}", file=sys.stderr)
        sys.exit(1)

    total_wrapped = 0
    total_already = 0
    print(f"{'DRY RUN' if not args.execute else 'EXECUTING'} on {len(files)} guide files")
    for fname in files:
        path = os.path.join(GUIDE_DIR, fname)
        stats = process_file(path, args.execute)
        total_wrapped += stats["wrapped"]
        total_already += stats["already"]
        action = "wrapped" if args.execute else "would wrap"
        print(f"  {fname}: {action} {stats['wrapped']}/{stats['total']} (already wrapped: {stats['already']})")

    print(f"\nTOTAL: {'wrapped' if args.execute else 'would wrap'} {total_wrapped} URLs. Already wrapped: {total_already}.")
    if not args.execute:
        print(f"\nRe-run with --execute to apply.")


if __name__ == "__main__":
    main()
