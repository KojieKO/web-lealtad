"""Convierte editable/obras-pictoricas.md en los datos que consume la web."""

import json
from pathlib import Path


RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "editable" / "obras-pictoricas.md"
DESTINO = RAIZ / "assets" / "obras-pictoricas-datos.js"

CABECERAS_ESPERADAS = {
    "Carteles de Martes Santo": ["Año", "Técnica", "Autor/a"],
    "Otras obras": ["Motivo", "Técnica", "Autor/a"],
}


def separar_fila(linea):
    return [celda.strip() for celda in linea.strip().strip("|").split("|")]


def validar(markdown):
    seccion = None
    cabeceras_encontradas = {}

    for numero, linea in enumerate(markdown.splitlines(), start=1):
        if linea.startswith("## "):
            seccion = linea[3:].strip()
            continue
        if not linea.strip().startswith("|") or seccion not in CABECERAS_ESPERADAS:
            continue
        celdas = separar_fila(linea)
        if seccion not in cabeceras_encontradas:
            if celdas != CABECERAS_ESPERADAS[seccion]:
                raise SystemExit(
                    f"editable/obras-pictoricas.md, línea {numero}: columnas incorrectas en {seccion}"
                )
            cabeceras_encontradas[seccion] = True
        elif not all(celda.replace("-", "").replace(":", "") == "" for celda in celdas):
            if len(celdas) != 3 or not all(celdas):
                raise SystemExit(
                    f"editable/obras-pictoricas.md, línea {numero}: la fila debe tener 3 datos"
                )

    faltan = set(CABECERAS_ESPERADAS) - set(cabeceras_encontradas)
    if faltan:
        raise SystemExit(f"Faltan tablas: {', '.join(sorted(faltan))}")


def main():
    markdown = ORIGEN.read_text(encoding="utf-8")
    validar(markdown)
    lineas = markdown.splitlines()
    if markdown.endswith("\n"):
        lineas.append("")

    contenido = (
        "/* Archivo generado automáticamente desde editable/obras-pictoricas.md. No editar. */\n\n"
        "window.OBRAS_PICTORICAS = [\n"
        + ",\n".join(
            f"    {json.dumps(linea, ensure_ascii=False)}" for linea in lineas
        )
        + '\n].join("\\n");\n'
    )
    DESTINO.write_text(contenido, encoding="utf-8", newline="\n")
    print(f"Obras pictóricas generadas: {DESTINO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
