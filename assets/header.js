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

    const enlaces = [
      ["inicio", "index.html", "Inicio"],
      ["hermandad", "hermandad.html", "Hermandad"],
      ["titulares", "titulares.html", "Titulares"],
      ["agenda", "agenda.html", "Cultos y agenda"],
      ["alta", "hazte-hermano.html", "Hazte hermano"],
      ["contacto", "contacto.html", "Contacto"],
    ];

    const menu = enlaces
      .map(([nombre, archivo, texto]) => {
        const claseActiva = nombre === paginaActiva ? ' class="active"' : "";
        return `<a${claseActiva} href="${archivo}">${texto}</a>`;
      })
      .join("");

    this.innerHTML = `
      <header class="top">
        <a class="brand" href="index.html" aria-label="Ir al inicio">
          <img src="assets/escudo-aprobado.png" alt="" width="64" height="72">
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
