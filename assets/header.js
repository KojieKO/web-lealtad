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
      ["hermandad", "hermandad.html", "Hermandad", [
        ["hermandad.html#historia", "Historia y fundación"],
        ["hermandad.html#cronologia", "Cronología"],
        ["hermandad.html#junta", "Junta de Gobierno"],
        ["hermandad.html#reglas", "Reglas y fines"],
        ["hermandad.html#habito", "Hábito nazareno"],
      ]],
      ["titulares", "titulares.html", "Titulares", [
        ["titulares.html#despojado", "Jesús de la Lealtad Despojado"],
        ["titulares.html#pureza", "María Santísima de la Pureza"],
        ["titulares.html#fatima", "Rosario de Fátima"],
      ]],
      ["patrimonio", "patrimonio.html", "Patrimonio", [
        ["patrimonio.html#insignias", "Insignias"],
        ["patrimonio.html#fatima", "Patrimonio de Fátima"],
        ["patrimonio.html#pureza", "Patrimonio de la Pureza"],
        ["patrimonio.html#musica", "Música y letras"],
        ["patrimonio.html#carteles", "Cartelería"],
      ]],
      ["procesion", "procesion.html", "Procesión", [
        ["procesion.html#estacion", "La estación"],
        ["procesion.html#cortejo", "Cortejo y paso"],
        ["procesion.html#habito", "Hábito nazareno"],
        ["procesion.html#recorrido", "Recorrido"],
      ]],
      ["agenda", "agenda.html", "Cultos y agenda"],
      ["contacto", "contacto.html", "Contacto"],
    ];

    const menu = enlaces
      .map(([nombre, archivo, texto, subenlaces]) => {
        const activa = nombre === paginaActiva ? " active" : "";
        if (!subenlaces) {
          return `<a class="nav-link${activa}" href="${archivo}">${texto}</a>`;
        }

        const submenu = subenlaces
          .map(([destino, rotulo]) => `<a href="${destino}">${rotulo}</a>`)
          .join("");

        return `
          <div class="nav-group${activa}">
            <div class="nav-parent">
              <a href="${archivo}">${texto}</a>
              <button class="submenu-toggle" type="button" aria-expanded="false" aria-label="Mostrar opciones de ${texto}">
                <span aria-hidden="true"></span>
              </button>
            </div>
            <div class="submenu">${submenu}</div>
          </div>`;
      })
      .join("");

    this.innerHTML = `
      <header class="top">
        <a class="brand" href="index.html" aria-label="Ir al inicio">
          <img src="assets/images/escudo-aprobado.png" alt="" width="64" height="72">
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
