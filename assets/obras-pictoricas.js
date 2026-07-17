/*
 * OBRAS PICTÓRICAS AUTOMÁTICAS
 * ----------------------------
 * Lee los datos generados desde editable/obras-pictoricas.md y actualiza las dos tablas.
 */

function separarFilaObras(fila) {
  return fila.trim().replace(/^\|/, "").replace(/\|$/, "").split("|").map((celda) => celda.trim());
}

function leerTablasObras(markdown) {
  const tablas = {};
  let seccion = "";

  for (const linea of markdown.split(/\r?\n/)) {
    if (linea.startsWith("## ")) {
      seccion = linea.slice(3).trim();
      tablas[seccion] = [];
      continue;
    }
    if (!linea.trim().startsWith("|") || !tablas[seccion]) continue;

    const celdas = separarFilaObras(linea);
    const esSeparador = celdas.every((celda) => /^:?-+:?$/.test(celda));
    if (!esSeparador) tablas[seccion].push(celdas);
  }

  return tablas;
}

function crearFilasObras(filas) {
  return filas.map((celdas) => {
    const fila = document.createElement("tr");
    fila.append(...celdas.map((texto) => {
      const celda = document.createElement("td");
      celda.textContent = texto;
      return celda;
    }));
    return fila;
  });
}

function pintarObrasPictoricas() {
  const tablas = leerTablasObras(window.OBRAS_PICTORICAS || "");
  const destinos = {
    "Carteles de Martes Santo": document.querySelector("[data-obras-carteles]"),
    "Otras obras": document.querySelector("[data-obras-otras]"),
  };

  for (const [nombre, cuerpo] of Object.entries(destinos)) {
    const filas = tablas[nombre] || [];
    if (!cuerpo || filas.length < 2) continue;
    cuerpo.replaceChildren(...crearFilasObras(filas.slice(1)));
  }
}

pintarObrasPictoricas();
