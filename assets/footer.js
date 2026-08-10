/*
 * PIE DE PÁGINA COMPARTIDO
 * ========================
 * Este pie aparece automáticamente en todas las páginas.
 * Para cambiar su contenido, edita SOLO este archivo.
 */

class PieWeb extends HTMLElement {
  connectedCallback() {
    const bloqueInstitucional = this.hasAttribute("institutional")
      ? `
        <div class="footer-institution" aria-label="Datos de la entidad">
          <strong>Hermandad de Jesús de la Lealtad Despojado</strong>
          <p>Entidad religiosa sin ánimo de lucro de Cáceres dedicada al culto público, la formación cristiana, la fraternidad y la acción caritativa. NIF R1000601C.</p>
          <a href="contacto.html">Datos de la entidad</a>
        </div>`
      : "";

    this.innerHTML = `
      <footer>
        ${bloqueInstitucional}
        <div class="footer-brand">
          <small>Hermandad de Jesús de la Lealtad</small>
          <strong>Despojado</strong>
        </div>
        <div class="footer-contact">
          <p>Casa de Hermandad<br>Calle Sanguino Michel 7–9<br>10001. Cáceres</p>
          <a href="mailto:contacto@lealtaddespojado.es">contacto@lealtaddespojado.es</a>
        </div>
        <div class="footer-links">
          <div class="footer-social" aria-label="Redes sociales">
            <span>Síguenos</span>
            <div class="footer-social-icons">
              <a href="https://www.facebook.com/despojadocaceres/" aria-label="Hermandad del Despojado en Facebook" rel="me noopener">
                <img src="assets/images/facebook.png" alt="" width="36" height="36" loading="lazy" decoding="async">
              </a>
              <a href="https://www.instagram.com/lealtaddespojado/" aria-label="Hermandad del Despojado en Instagram" rel="me noopener">
                <img src="assets/images/instagram.png" alt="" width="36" height="36" loading="lazy" decoding="async">
              </a>
            </div>
          </div>
          <div class="footer-nav">
            <a href="contacto.html">Contacto</a>
            <a href="privacidad.html">Privacidad</a>
            <button class="footer-cookie-settings" type="button" data-cookie-settings>
              Configurar cookies
            </button>
          </div>
        </div>
        <small class="footer-copyright">
          © 2026 Hermandad de Jesús de la Lealtad Despojado · NIF R1000601C · Cáceres
        </small>
      </footer>
    `;
  }
}

customElements.define("site-footer", PieWeb);
