"""Actualiza la cronología y la Junta de hermandad.html desde Markdown."""

import html
import re
from pathlib import Path


RAIZ = Path(__file__).resolve().parent.parent
PAGINA = RAIZ / "hermandad.html"
CRONO = RAIZ / "editable" / "crono.md"
JUNTA = RAIZ / "editable" / "junta.md"

CRONO_INICIO = "          <!-- CRONOLOGIA-ESTATICA-INICIO -->"
CRONO_FIN = "          <!-- CRONOLOGIA-ESTATICA-FIN -->"
JUNTA_INICIO = "          <!-- JUNTA-ESTATICA-INICIO -->"
JUNTA_FIN = "          <!-- JUNTA-ESTATICA-FIN -->"


def leer_tabla(ruta, cabeceras_esperadas):
    markdown = ruta.read_text(encoding="utf-8")
    filas = [
        (numero, linea)
        for numero, linea in enumerate(markdown.splitlines(), start=1)
        if linea.strip().startswith("|")
    ]
    if len(filas) < 3:
        raise SystemExit(f"{ruta.relative_to(RAIZ)} no contiene una tabla con datos")

    cabeceras = separar_fila(filas[0][1])
    if cabeceras != cabeceras_esperadas:
        esperadas = ", ".join(cabeceras_esperadas)
        raise SystemExit(f"{ruta.relative_to(RAIZ)} debe conservar las columnas: {esperadas}")

    datos = []
    for numero, linea in filas[2:]:
        celdas = separar_fila(linea)
        if len(celdas) != len(cabeceras_esperadas) or not all(celdas):
            raise SystemExit(
                f"{ruta.relative_to(RAIZ)}, línea {numero}: "
                f"la fila debe tener {len(cabeceras_esperadas)} datos completos"
            )
        datos.append(celdas)

    if not datos:
        raise SystemExit(f"{ruta.relative_to(RAIZ)} no contiene ninguna fila de contenido")
    return datos


def separar_fila(linea):
    return [celda.strip() for celda in linea.strip().strip("|").split("|")]


def texto_basico(texto):
    seguro = html.escape(texto)
    return re.sub(r"\*([^*]+)\*", r"<em>\1</em>", seguro)


def markdown_en_linea(texto):
    """Convierte enlaces y énfasis sencillos sin admitir HTML arbitrario."""
    partes = []
    posicion = 0
    patron = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
    for coincidencia in patron.finditer(texto):
        partes.append(texto_basico(texto[posicion:coincidencia.start()]))
        rotulo, destino = coincidencia.groups()
        destino = destino.strip()
        if not destino or destino.lower().startswith(("javascript:", "data:")):
            raise SystemExit(f"Enlace no permitido en editable/crono.md: {destino}")
        partes.append(
            f'<a href="{html.escape(destino, quote=True)}">{texto_basico(rotulo)}</a>'
        )
        posicion = coincidencia.end()
    partes.append(texto_basico(texto[posicion:]))
    return "".join(partes)


def cronologia_html(filas):
    bloques = []
    for anio, titulo, descripcion in filas:
        bloques.extend([
            "          <li>",
            "            <time>",
            f"              {html.escape(anio)}",
            "            </time>",
            "            <div>",
            "              <h3>",
            f"                {html.escape(titulo)}",
            "              </h3>",
            "              <p>",
            f"                {markdown_en_linea(descripcion)}",
            "              </p>",
            "            </div>",
            "          </li>",
        ])
    return "\n".join(bloques)


def junta_html(filas):
    bloques = []
    for cargo, nombre in filas:
        bloques.extend([
            "          <article>",
            "            <h3>",
            f"              {html.escape(cargo)}",
            "            </h3>",
            "            <p>",
            f"              {html.escape(nombre)}",
            "            </p>",
            "          </article>",
        ])
    return "\n".join(bloques)


def sustituir_bloque(pagina, inicio, fin, contenido):
    if pagina.count(inicio) != 1 or pagina.count(fin) != 1:
        raise SystemExit("hermandad.html no contiene las marcas de contenido esperadas")
    antes, resto = pagina.split(inicio, 1)
    _, despues = resto.split(fin, 1)
    return f"{antes}{inicio}\n{contenido}\n{fin}{despues}"


def main():
    cronologia = leer_tabla(CRONO, ["Año", "Título", "Descripción"])
    junta = leer_tabla(JUNTA, ["Cargo", "Nombre"])
    pagina = PAGINA.read_text(encoding="utf-8")
    pagina = sustituir_bloque(
        pagina, CRONO_INICIO, CRONO_FIN, cronologia_html(cronologia)
    )
    pagina = sustituir_bloque(pagina, JUNTA_INICIO, JUNTA_FIN, junta_html(junta))
    PAGINA.write_text(pagina, encoding="utf-8", newline="\n")
    print("Hermandad actualizada desde editable/crono.md y editable/junta.md")


if __name__ == "__main__":
    main()
