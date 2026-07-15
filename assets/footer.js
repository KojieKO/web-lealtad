/*
 * PIE DE PÁGINA COMPARTIDO
 * ========================
 * Este pie aparece automáticamente en todas las páginas.
 * Para cambiar su contenido, edita SOLO este archivo.
 */

class PieWeb extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `
      <footer>
        <div class="footer-brand">
          <small>Hermandad de Jesús de la Lealtad</small>
          <strong>Despojado</strong>
        </div>
        <div>
          <p>Parroquia de Nuestra Señora<br>del Rosario de Fátima · Cáceres</p>
          <a href="mailto:contacto@lealtaddespojado.es">contacto@lealtaddespojado.es</a>
        </div>
        <div>
          <a href="contacto.html">Contacto</a><br>
          <a href="#">Privacidad</a>
        </div>
        <small>
          © 2026 Hermandad de Nuestra Señora del Rosario de Fátima y Penitencial Cofradía de Nuestro Padre Jesús de la Lealtad Despojado de sus vestiduras, María Santísima de la Pureza y San Juan Evangelista
        </small>
      </footer>
    `;
  }
}

customElements.define("site-footer", PieWeb);
