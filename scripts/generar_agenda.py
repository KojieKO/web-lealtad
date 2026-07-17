"""Convierte agenda.md en datos JavaScript y HTML rastreable."""

import html
import json
from datetime import date
from pathlib import Path


RAIZ = Path(__file__).resolve().parent.parent
ORIGEN = RAIZ / "agenda.md"
DESTINO = RAIZ / "assets" / "agenda-datos.js"
PAGINA = RAIZ / "agenda.html"
MARCA_INICIO = "          <!-- AGENDA-ESTATICA-INICIO -->"
MARCA_FIN = "          <!-- AGENDA-ESTATICA-FIN -->"


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


def leer_eventos(markdown):
    filas = [
        linea
        for linea in markdown.splitlines()
        if linea.strip().startswith("|")
    ]
    cabeceras = [
        celda.strip().lower()
        for celda in filas[0].strip().strip("|").split("|")
    ]
    eventos = []

    for fila in filas[2:]:
        valores = [celda.strip() for celda in fila.strip().strip("|").split("|")]
        evento = dict(zip(cabeceras, valores))
        evento["fin"] = evento["fin"] or evento["inicio"]
        eventos.append(evento)

    return eventos


def descripcion_html(texto):
    return "\n              <br>\n              ".join(
        html.escape(linea) for linea in texto.replace("<br/>", "<br>").split("<br>")
    )


def articulo_html(evento):
    lineas = [
        f'          <article data-event-start="{evento["inicio"]}" data-event-end="{evento["fin"]}">',
        f'            <time datetime="{evento["inicio"]}">',
        f"              <b>{html.escape(evento['fecha'])}</b>",
        f"              <span>{html.escape(evento['mes'])}</span>",
        "            </time>",
        "            <div>",
    ]
    if evento["etiqueta"]:
        lineas.append(f'              <p class="tag">{html.escape(evento["etiqueta"])}</p>')
    lineas.append(f"              <h3>{html.escape(evento['evento'])}</h3>")

    if evento["descripción"] or evento["enlace"]:
        descripcion = descripcion_html(evento["descripción"])
        enlace = ""
        if evento["enlace"]:
            rotulo = html.escape(evento["texto enlace"] or "Más información")
            separador = " " if descripcion else ""
            enlace = f'{separador}<a href="{html.escape(evento["enlace"], quote=True)}">{rotulo}</a>.'
        lineas.extend([
            "              <p>",
            f"              {descripcion}{enlace}",
            "              </p>",
        ])

    lineas.extend(["            </div>", "          </article>"])
    return "\n".join(lineas)


def actualizar_html_agenda(eventos):
    pagina = PAGINA.read_text(encoding="utf-8")
    if MARCA_INICIO not in pagina or MARCA_FIN not in pagina:
        raise SystemExit("agenda.html no contiene las marcas de agenda estática")

    antes, resto = pagina.split(MARCA_INICIO, 1)
    _, despues = resto.split(MARCA_FIN, 1)
    articulos = "\n".join(articulo_html(evento) for evento in eventos)
    contenido = f"{antes}{MARCA_INICIO}\n{articulos}\n{MARCA_FIN}{despues}"
    PAGINA.write_text(contenido, encoding="utf-8", newline="\n")


def main():
    markdown = ORIGEN.read_text(encoding="utf-8")
    validar_tabla(markdown)
    eventos = leer_eventos(markdown)

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
    actualizar_html_agenda(eventos)
    print(f"Agenda generada: {DESTINO.relative_to(RAIZ)}")
    print(f"Agenda HTML actualizada: {PAGINA.relative_to(RAIZ)}")


if __name__ == "__main__":
    main()
