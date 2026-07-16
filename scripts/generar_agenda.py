"""Convierte agenda.md en el archivo de datos que consume el navegador."""

import json
from datetime import date
from pathlib import Path


RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "agenda.md"
DESTINO = RAIZ / "assets" / "agenda-datos.js"


def validar_tabla(markdown):
    filas = [
        (numero, linea)
        for numero, linea in enumerate(markdown.splitlines(), start=1)
        if linea.strip().startswith("|")
    ]
    if len(filas) < 3 or "| Inicio | Fin | Fecha |" not in filas[0][1]:
        raise SystemExit("agenda.md no contiene la tabla de eventos esperada")

    for numero, fila in filas[2:]:
        celdas = [celda.strip() for celda in fila.strip().strip("|").split("|")]
        if len(celdas) != 9:
            raise SystemExit(f"agenda.md, línea {numero}: la fila debe tener 9 columnas")

        inicio, fin, fecha_visible, mes, _, evento, *_ = celdas
        try:
            inicio_real = date.fromisoformat(inicio)
            fin_real = date.fromisoformat(fin or inicio)
        except ValueError:
            raise SystemExit(
                f"agenda.md, línea {numero}: Inicio y Fin deben usar AAAA-MM-DD"
            ) from None

        if fin_real < inicio_real:
            raise SystemExit(f"agenda.md, línea {numero}: Fin no puede ser anterior a Inicio")
        if not fecha_visible or not mes or not evento:
            raise SystemExit(
                f"agenda.md, línea {numero}: Fecha, Mes y Evento son obligatorios"
            )


def main():
    markdown = ORIGEN.read_text(encoding="utf-8")
    validar_tabla(markdown)

    # Guardamos cada línea por separado para que agenda-datos.js sea fácil de leer.
    # La cadena vacía final conserva el salto de línea con el que termina agenda.md.
    lineas = markdown.splitlines()
    if markdown.endswith("\n"):
        lineas.append("")

    lineas_javascript = ",\n".join(
        f"    {json.dumps(linea, ensure_ascii=False)}" for linea in lineas
    )

    contenido = (
        "/* Archivo generado automáticamente desde agenda.md. No editar. */\n\n"
        "window.AGENDA_CULTOS = [\n"
        f"{lineas_javascript}\n"
        '].join("\\n");\n'
    )
    DESTINO.write_text(contenido, encoding="utf-8", newline="\n")
    print(f"Agenda generada: {DESTINO.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
