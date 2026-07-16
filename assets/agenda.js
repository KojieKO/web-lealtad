/*
 * AGENDA AUTOMÁTICA
 * -----------------
 * Los eventos se editan únicamente en agenda-datos.js. Este archivo construye la
 * agenda completa y el bloque de próximo encuentro de la portada.
 */

function separarFilaMarkdown(fila) {
  const celdas = [];
  let celda = "";
  let escapado = false;

  for (const caracter of fila.trim().replace(/^\|/, "").replace(/\|$/, "")) {
    if (escapado) {
      celda += caracter;
      escapado = false;
    } else if (caracter === "\\") {
      escapado = true;
    } else if (caracter === "|") {
      celdas.push(celda.trim());
      celda = "";
    } else {
      celda += caracter;
    }
  }

  celdas.push(celda.trim());
  return celdas;
}

function leerAgendaMarkdown(markdown) {
  const filas = markdown.split(/\r?\n/).filter((fila) => fila.trim().startsWith("|"));
  if (filas.length < 3) return [];

  const cabeceras = separarFilaMarkdown(filas[0]).map((cabecera) => cabecera.toLowerCase());
  return filas.slice(2).map((fila, orden) => {
    const valores = separarFilaMarkdown(fila);
    const evento = Object.fromEntries(cabeceras.map((cabecera, indice) => [cabecera, valores[indice] || ""]));
    evento.fin = evento.fin || evento.inicio;
    evento.orden = orden;
    return evento;
  }).filter((evento) => /^\d{4}-\d{2}-\d{2}$/.test(evento.inicio) && /^\d{4}-\d{2}-\d{2}$/.test(evento.fin) && evento.evento);
}

function fechaLocal(fechaIso) {
  const [ano, mes, dia] = fechaIso.split("-").map(Number);
  return new Date(ano, mes - 1, dia);
}

function inicioDelDia(fecha) {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate());
}

function anadirDescripcion(contenedor, evento) {
  if (!evento["descripción"] && !evento.enlace) return;

  const parrafo = document.createElement("p");
  const lineas = evento["descripción"].split(/<br\s*\/?\s*>/i);

  lineas.forEach((linea, indice) => {
    if (indice) parrafo.append(document.createElement("br"));
    parrafo.append(document.createTextNode(linea));
  });

  if (evento.enlace) {
    if (evento["descripción"]) parrafo.append(document.createTextNode(" "));
    const enlace = document.createElement("a");
    enlace.href = evento.enlace;
    enlace.textContent = evento["texto enlace"] || "Más información";
    parrafo.append(enlace, document.createTextNode("."));
  }

  contenedor.append(parrafo);
}

function crearArticulo(evento) {
  const articulo = document.createElement("article");
  const fecha = document.createElement("time");
  const fechaVisible = document.createElement("b");
  const mes = document.createElement("span");
  const contenido = document.createElement("div");
  const titulo = document.createElement("h3");

  articulo.dataset.eventStart = evento.inicio;
  articulo.dataset.eventEnd = evento.fin;
  fechaVisible.textContent = evento.fecha;
  mes.textContent = evento.mes;
  titulo.textContent = evento.evento;
  fecha.append(fechaVisible, mes);

  if (evento.etiqueta) {
    const etiqueta = document.createElement("p");
    etiqueta.className = "tag";
    etiqueta.textContent = evento.etiqueta;
    contenido.append(etiqueta);
  }

  contenido.append(titulo);
  anadirDescripcion(contenido, evento);
  articulo.append(fecha, contenido);
  return articulo;
}

function pintarAgenda(eventos) {
  const lista = document.querySelector("[data-agenda-list]");
  if (!lista) return;

  lista.replaceChildren(...eventos.map(crearArticulo));

  const anos = [...new Set(eventos.map((evento) => evento.inicio.slice(0, 4)))];
  const rotulo = document.querySelector("[data-agenda-years]");
  if (rotulo && anos.length) {
    rotulo.textContent = anos.length === 1 ? `Para el año ${anos[0]}` : `Agenda ${anos.join(" · ")}`;
  }
}

function textoFechaPortada(eventos, fechaRelevante) {
  return eventos.length > 1 ? String(fechaRelevante.getDate()) : eventos[0].fecha;
}

function pintarProximoEncuentro(eventos) {
  const bloqueFecha = document.querySelector("[data-next-event-date]");
  const bloqueDetalles = document.querySelector("[data-next-event-details]");
  if (!bloqueFecha || !bloqueDetalles) return;

  const hoy = inicioDelDia(new Date());
  const candidatos = eventos.map((evento) => ({
    ...evento,
    inicioReal: fechaLocal(evento.inicio),
    finReal: fechaLocal(evento.fin),
  })).filter((evento) => evento.finReal >= hoy).map((evento) => ({
    ...evento,
    fechaRelevante: evento.inicioReal > hoy ? evento.inicioReal : hoy,
  })).sort((a, b) => a.fechaRelevante - b.fechaRelevante || a.orden - b.orden);

  if (!candidatos.length) {
    bloqueFecha.querySelector("strong").textContent = "—";
    bloqueFecha.querySelector("span").textContent = "POR ANUNCIAR";
    bloqueDetalles.replaceChildren();
    const detalle = document.createElement("div");
    detalle.className = "event-details";
    const titulo = document.createElement("h2");
    titulo.textContent = "Próximos cultos por anunciar";
    detalle.append(titulo);
    bloqueDetalles.append(detalle);
    return;
  }

  const primeraFecha = candidatos[0].fechaRelevante.getTime();
  const proximos = candidatos.filter((evento) => evento.fechaRelevante.getTime() === primeraFecha);
  const fechaRelevante = candidatos[0].fechaRelevante;
  const mes = new Intl.DateTimeFormat("es-ES", { month: "short" }).format(fechaRelevante).replace(".", "").toUpperCase();

  bloqueFecha.dateTime = [fechaRelevante.getFullYear(), String(fechaRelevante.getMonth() + 1).padStart(2, "0"), String(fechaRelevante.getDate()).padStart(2, "0")].join("-");
  bloqueFecha.querySelector("strong").textContent = textoFechaPortada(proximos, fechaRelevante);
  bloqueFecha.querySelector("span").innerHTML = `${mes}<br>${fechaRelevante.getFullYear()}`;
  bloqueDetalles.replaceChildren(...proximos.map((evento) => {
    const detalle = document.createElement("div");
    const titulo = document.createElement("h2");
    detalle.className = "event-details";
    titulo.textContent = evento.evento;
    detalle.append(titulo);
    anadirDescripcion(detalle, evento);
    return detalle;
  }));
}

async function cargarAgenda() {
  const eventos = leerAgendaMarkdown(window.AGENDA_CULTOS || "");
  if (!eventos.length) throw new Error("agenda-datos.js no contiene eventos válidos");
  pintarAgenda(eventos);
  pintarProximoEncuentro(eventos);
}

cargarAgenda().catch((error) => {
  console.error("No se pudo actualizar la agenda:", error);
  const estado = document.querySelector("[data-agenda-status]");
  if (estado) estado.textContent = "No se ha podido cargar la agenda en este momento.";
});
