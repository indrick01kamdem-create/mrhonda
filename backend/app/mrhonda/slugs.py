from __future__ import annotations

import re
import unicodedata
from typing import Callable

MAX_SLUG_LENGTH = 60


def slugify(value: str, fallback: str = "element") -> str:
    normalized = unicodedata.normalize("NFKD", value or "")
    ascii_only = normalized.encode("ascii", "ignore").decode("ascii")
    hyphenated = re.sub(r"[^a-z0-9]+", "-", ascii_only.lower()).strip("-")
    if not hyphenated:
        return fallback
    return hyphenated[:MAX_SLUG_LENGTH].strip("-")


def unique_slug(value: str, exists: Callable[[str], bool], fallback: str = "element") -> str:
    base = slugify(value, fallback)
    if not exists(base):
        return base
    suffix = 2
    while True:
        room = MAX_SLUG_LENGTH - len(str(suffix)) - 1
        candidate = f"{base[:room].strip('-')}-{suffix}"
        if not exists(candidate):
            return candidate
        suffix += 1
