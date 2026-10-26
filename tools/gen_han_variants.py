"""Regenerate the variant-group table in src/shared/han-variants.ts.

The table lists groups of CJK characters that people use interchangeably (Simplified, Traditional,
Taiwan-standard and Hong Kong / Kangxi variants). It is derived from the OpenCC dictionaries by
converting every character in the CJK Unified Ideographs block with the character-level configs
t2s, s2t, s2tw, s2hk, tw2s and hk2s and uniting each character with its single-character results.

Generated with:
    pip install opencc-python-reimplemented==0.1.7   # pure-Python OpenCC, bundles the OpenCC dictionaries
    python tools/gen_han_variants.py                 # rewrites the block between the BEGIN/END markers
    python tools/gen_han_variants.py --check         # exit 1 if the file is out of date

OpenCC: https://github.com/BYVoid/OpenCC, Apache-2.0, Copyright Carbo Kuo and contributors
(see NOTICE.md). The pure-Python port is https://github.com/yichen0831/opencc-python.
"""

import sys
from pathlib import Path

CONFIGS = ("t2s", "s2t", "s2tw", "s2hk", "tw2s", "hk2s")
TARGET = Path(__file__).resolve().parent.parent / "src" / "shared" / "han-variants.ts"
BEGIN = "// BEGIN GENERATED (tools/gen_han_variants.py)"
END = "// END GENERATED"
LINE_WIDTH = 96


def build_groups() -> list[str]:
    import opencc  # imported lazily so `compileall` and linting do not need the package

    converters = [opencc.OpenCC(name) for name in CONFIGS]
    parent: dict[str, str] = {}

    def find(x: str) -> str:
        parent.setdefault(x, x)
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a: str, b: str) -> None:
        ra, rb = find(a), find(b)
        if ra != rb:
            parent[ra] = rb

    for codepoint in range(0x4E00, 0xA000):
        char = chr(codepoint)
        for converter in converters:
            converted = converter.convert(char)
            if len(converted) == 1 and converted != char:
                union(char, converted)

    groups: dict[str, set[str]] = {}
    for char in list(parent):
        groups.setdefault(find(char), set()).add(char)
    return sorted("".join(sorted(g)) for g in groups.values() if len(g) > 1)


def render_block(groups: list[str]) -> str:
    lines: list[str] = []
    current = ""
    for group in groups:
        if len(current) + len(group) + 1 > LINE_WIDTH:
            lines.append(current)
            current = group
        else:
            current = f"{current} {group}" if current else group
    lines.append(current)
    body = "\n".join(
        "  '" + line + " '" + (" +" if i < len(lines) - 1 else "") for i, line in enumerate(lines)
    )
    return (
        f"{BEGIN}\n"
        "const VARIANT_GROUPS: readonly string[] = (\n"
        f"{body}\n"
        ").split(' ').filter(Boolean)\n"
        f"{END}"
    )


def main() -> int:
    check = "--check" in sys.argv[1:]
    text = TARGET.read_bytes().decode("utf-8")
    newline = "\r\n" if "\r\n" in text else "\n"
    text = text.replace("\r\n", "\n")
    start = text.index(BEGIN)
    end = text.index(END) + len(END)
    updated = text[:start] + render_block(build_groups()) + text[end:]
    if check:
        if updated != text:
            print("src/shared/han-variants.ts is out of date; run tools/gen_han_variants.py")
            return 1
        print("han-variants table is up to date")
        return 0
    TARGET.write_bytes(updated.replace("\n", newline).encode("utf-8"))
    print(f"wrote {TARGET}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
