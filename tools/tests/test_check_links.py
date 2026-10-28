from __future__ import annotations

import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

import check_links  # noqa: E402


def _repo(tmp_path: Path) -> Path:
    (tmp_path / "docs").mkdir()
    (tmp_path / "docs" / "DECISIONS.md").write_text("# decisions\n", encoding="utf-8")
    (tmp_path / "README.md").write_text("# readme\n", encoding="utf-8")
    return tmp_path


def test_a_link_with_a_title_or_query_still_resolves(tmp_path: Path) -> None:
    root = _repo(tmp_path)
    readme = root / "README.md"
    assert check_links._missing_relative(readme, 'docs/DECISIONS.md "Decisions"', root) is None
    assert check_links._missing_relative(readme, "docs/DECISIONS.md?plain=1", root) is None


def test_a_root_relative_link_resolves_against_the_repository(tmp_path: Path) -> None:
    root = _repo(tmp_path)
    nested = root / "docs" / "DECISIONS.md"
    assert check_links._missing_relative(nested, "/README.md", root) is None
    assert check_links._missing_relative(nested, "/MISSING.md", root) is not None


def test_a_link_with_the_wrong_letter_case_is_broken(tmp_path: Path) -> None:
    # Windows and macOS find docs/decisions.md; GitHub does not.
    root = _repo(tmp_path)
    readme = root / "README.md"
    assert check_links._missing_relative(readme, "docs/decisions.md", root) is not None
    assert check_links._missing_relative(readme, "Docs/DECISIONS.md", root) is not None
    assert check_links._missing_relative(readme, "docs/DECISIONS.md#top", root) is None


def test_an_angle_bracket_link_may_contain_spaces(tmp_path: Path) -> None:
    root = _repo(tmp_path)
    (root / "docs" / "a b.md").write_text("x\n", encoding="utf-8")
    readme = root / "README.md"
    assert check_links._missing_relative(readme, "<docs/a b.md>", root) is None
    assert check_links._missing_relative(readme, '<docs/a b.md> "title"', root) is None
