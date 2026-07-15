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
        <div class="footer-contact">
          <p>Casa de Hermandad<br>Calle Sanguino Michel 7–9<br>Cáceres</p>
          <a href="mailto:contacto@lealtaddespojado.es">contacto@lealtaddespojado.es</a>
        </div>
        <div class="footer-links">
          <a href="contacto.html">Contacto</a><br>
          <a href="#">Privacidad</a>
        </div>
        <small class="footer-copyright">
          © 2026 Hermandad de Nuestra Señora del Rosario de Fátima y Penitencial Cofradía de Nazarenos de Nuestro Padre Jesús de la Lealtad Despojado, María Santísima de la Pureza y San Juan Evangelista
        </small>
      </footer>
    `;
  }
}

customElements.define("site-footer", PieWeb);
