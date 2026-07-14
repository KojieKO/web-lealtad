"""Ordena los HTML del proyecto para que sean fáciles de leer y editar.

Uso desde la carpeta principal:
    python scripts/format_html.py

No cambia el contenido ni el diseño: solo añade saltos de línea y sangría.
"""

from pathlib import Path
import re


ROOT = Path(__file__).resolve().parent.parent
VOID_TAGS = {
    "area", "base", "br", "col", "embed", "hr", "img", "input",
    "link", "meta", "param", "source", "track", "wbr",
}
TOKEN_PATTERN = re.compile(r"(<!--.*?-->|<![^>]*>|<[^>]+>)", re.DOTALL)


def tag_name(token: str) -> str:
    match = re.match(r"</?\s*([\w-]+)", token)
    return match.group(1).lower() if match else ""


def format_html(source: str) -> str:
    lines: list[str] = []
    level = 0

    for token in TOKEN_PATTERN.split(source):
        token = token.strip()
        if not token:
            continue

        is_tag = token.startswith("<")
        is_closing = token.startswith("</")
        is_comment_or_doctype = token.startswith(("<!--", "<!"))
        name = tag_name(token)
        is_void = name in VOID_TAGS or token.endswith("/>")

        if is_closing:
            level = max(0, level - 1)

        # Los comentarios multilínea conservan su forma, pero reciben sangría.
        if token.startswith("<!--"):
            for comment_line in token.splitlines():
                lines.append("  " * level + comment_line.strip())
        else:
            lines.append("  " * level + token)

        if is_tag and not is_closing and not is_void and not is_comment_or_doctype:
            level += 1

    return "\n".join(lines) + "\n"


def main() -> None:
    pages = sorted(ROOT.glob("*.html"))
    for page in pages:
        original = page.read_text(encoding="utf-8")
        page.write_text(format_html(original), encoding="utf-8", newline="\n")
        print(f"Ordenado: {page.name}")


if __name__ == "__main__":
    main()
