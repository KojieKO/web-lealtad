/*
 * CABECERA COMPARTIDA
 * ===================
 * Esta cabecera aparece automáticamente en todas las páginas.
 * Para cambiar el nombre o las opciones del menú, edita SOLO este archivo.
 */

class CabeceraWeb extends HTMLElement {
  connectedCallback() {
    // Cada página indica su nombre con active="..." para marcarla en el menú.
    const paginaActiva = this.getAttribute("active") || "";
    const archivoActual = window.location.pathname.split("/").pop() || "index.html";

    const enlaces = [
      ["inicio", "index.html", "Inicio"],
      ["hermandad", "hermandad.html", "Hermandad", [
        ["hermandad.html#saluda", "Saluda del Hno. Mayor"],
        ["hermandad.html#cronologia", "Cronología"],
        ["hermandad.html#junta", "Junta de Gobierno"],
        ["hermandad.html#habito", "Hábito nazareno"],
      ]],
      ["titulares", "titulares.html", "Titulares", [
        ["titulares.html#despojado", "Jesús de la Lealtad Despojado"],
        ["titulares.html#pureza", "María Santísima de la Pureza"],
        ["titulares.html#fatima", "Rosario de Fátima"],
      ]],
      ["patrimonio", "patrimonio.html", "Patrimonio", [
        ["patrimonio.html#insignias", "Insignias"],
        ["patrimonio.html#patrimonio-fatima", "Patrimonio de Fátima"],
        ["patrimonio.html#ajuar-pureza", "Ajuar de Pureza"],
        ["patrimonio.html#musica", "Patrimonio musical"],
        ["patrimonio.html#literatura", "Producción literaria"],
        ["patrimonio.html#carteles", "Obras pictóricas"],
      ]],
      ["cofradia", null, "Cofradía", [
        ["martes-santo.html", "Estación de penitencia"],
        ["antorchas.html", "Procesión de antorchas"],
        ["salidas.html", "Salidas devocionales"],
      ]],
      ["agenda", "agenda.html", "Agenda"],
      ["contacto", "contacto.html", "Contacto"],
    ];

    const menu = enlaces
      .map(([nombre, archivo, texto, subenlaces]) => {
        const activa = nombre === paginaActiva ? " active" : "";
        if (!subenlaces) {
          const actual = nombre === paginaActiva ? ' aria-current="page"' : "";
          return `<a class="nav-link${activa}" href="${archivo}"${actual}>${texto}</a>`;
        }

        const submenu = subenlaces
          .map(([destino, rotulo]) => {
            const actual = !archivo && destino === archivoActual ? ' aria-current="page"' : "";
            return `<a href="${destino}"${actual}>${rotulo}</a>`;
          })
          .join("");

        const padre = archivo
          ? `<a href="${archivo}"${nombre === paginaActiva ? ' aria-current="page"' : ""}>${texto}</a>
              <button class="submenu-toggle" type="button" aria-expanded="false" aria-label="Mostrar opciones de ${texto}">
                <span aria-hidden="true"></span>
              </button>`
          : `<button class="nav-section-toggle submenu-toggle" type="button" aria-expanded="false" aria-label="Mostrar opciones de ${texto}">
              ${texto}<span aria-hidden="true"></span>
            </button>`;

        return `
          <div class="nav-group${activa}">
            <div class="nav-parent">
              ${padre}
            </div>
            <div class="submenu">${submenu}</div>
          </div>`;
      })
      .join("");

    this.innerHTML = `
      <header class="top">
        <a class="brand" href="index.html" aria-label="Ir al inicio de la Hermandad del Despojado de Cáceres">
          <!-- SEO-PERF-01: versión ligera del escudo para la cabecera. -->
          <img src="assets/images/escudo-header.webp" alt="" width="64" height="72" decoding="async">
          <span>
            <b>Hermandad de Jesús de la Lealtad</b>
            <strong>Despojado</strong>
          </span>
        </a>
        <button class="menu" type="button" aria-expanded="false" aria-controls="nav">
          Menú
        </button>
        <nav id="nav" aria-label="Navegación principal">
          ${menu}
        </nav>
      </header>
    `;
  }
}

customElements.define("site-header", CabeceraWeb);
