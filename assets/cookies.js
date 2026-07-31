/*
 * CONSENTIMIENTO DE COOKIES Y CONTENIDOS DE TERCEROS
 * ==================================================
 * La web no usa analítica ni cookies de preferencias. Este componente guarda
 * únicamente la elección en localStorage y activa Google Maps solo con permiso.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "lealtad_cookie_consent";
  const CONSENT_VERSION = 1;
  let lastTrigger = null;

  function defaultConsent() {
    return {
      version: CONSENT_VERSION,
      necessary: true,
      preferences: false,
      analytics: false,
      thirdParty: false,
      date: "",
    };
  }

  function readConsent() {
    try {
      const saved = JSON.parse(window.localStorage.getItem(STORAGE_KEY));
      if (saved && saved.version === CONSENT_VERSION && saved.necessary === true) {
        return saved;
      }
    } catch (error) {
      // Si el navegador bloquea localStorage, el aviso sigue funcionando en esta visita.
    }
    return null;
  }

  function saveConsent(consent) {
    const choice = {
      ...defaultConsent(),
      ...consent,
      version: CONSENT_VERSION,
      necessary: true,
      date: new Date().toISOString(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(choice));
    } catch (error) {
      // No se registra la elección si el navegador no permite almacenamiento local.
    }
    return choice;
  }

  function applyThirdPartyConsent(consent) {
    const allowed = Boolean(consent && consent.thirdParty);
    document.querySelectorAll("[data-third-party-src]").forEach((frame) => {
      const placeholder = document.querySelector(
        `[data-third-party-placeholder="${frame.dataset.thirdPartyName || "content"}"]`,
      );
      if (allowed) {
        if (!frame.getAttribute("src")) {
          frame.setAttribute("src", frame.dataset.thirdPartySrc);
        }
        frame.hidden = false;
        if (placeholder) placeholder.hidden = true;
      } else {
        frame.removeAttribute("src");
        frame.hidden = true;
        if (placeholder) placeholder.hidden = false;
      }
    });
  }

  function createBanner() {
    const banner = document.createElement("section");
    banner.className = "cookie-consent";
    banner.hidden = true;
    banner.setAttribute("aria-labelledby", "cookie-consent-title");
    banner.innerHTML = `
      <div class="cookie-consent__content">
        <h2 id="cookie-consent-title">Tu privacidad</h2>
        <p>Usamos almacenamiento local para recordar tu elección. El mapa de Google solo se carga si aceptas los contenidos de terceros.</p>
        <p><a href="privacidad.html">Consulta la Política de privacidad</a>.</p>
        <div class="cookie-actions" aria-label="Opciones de cookies">
          <button type="button" data-cookie-accept>Aceptar todas</button>
          <button type="button" data-cookie-reject>Rechazar no necesarias</button>
          <button class="cookie-configure" type="button" data-cookie-configure aria-expanded="false" aria-controls="cookie-settings-panel">Configurar</button>
        </div>
        <div class="cookie-panel" id="cookie-settings-panel" role="dialog" aria-modal="false" aria-labelledby="cookie-settings-title" hidden>
          <h3 id="cookie-settings-title">Configurar cookies</h3>
          <div class="cookie-category">
            <div>
              <h4>Técnicas o necesarias</h4>
              <p>Guardan tu elección de privacidad en este navegador.</p>
            </div>
            <label><input type="checkbox" checked disabled> Siempre activas</label>
          </div>
          <div class="cookie-category">
            <div>
              <h4>Servicios o contenidos de terceros</h4>
              <p>Permiten mostrar el mapa de Google Maps en la página de contacto.</p>
            </div>
            <label><input id="cookie-third-party" type="checkbox"> Permitir</label>
          </div>
          <div class="cookie-panel__actions">
            <button type="button" data-cookie-save>Guardar selección</button>
            <button class="cookie-cancel" type="button" data-cookie-cancel>Cancelar</button>
          </div>
        </div>
      </div>`;
    document.body.appendChild(banner);
    return banner;
  }

  function init() {
    const banner = createBanner();
    const panel = banner.querySelector("#cookie-settings-panel");
    const configureButton = banner.querySelector("[data-cookie-configure]");
    const thirdPartyInput = banner.querySelector("#cookie-third-party");
    let currentConsent = readConsent();

    applyThirdPartyConsent(currentConsent || defaultConsent());
    if (!currentConsent) banner.hidden = false;

    function openSettings(trigger) {
      lastTrigger = trigger || document.activeElement;
      currentConsent = readConsent() || defaultConsent();
      thirdPartyInput.checked = Boolean(currentConsent.thirdParty);
      banner.hidden = false;
      panel.hidden = false;
      configureButton.setAttribute("aria-expanded", "true");
      thirdPartyInput.focus();
    }

    function closeSettings() {
      panel.hidden = true;
      configureButton.setAttribute("aria-expanded", "false");
      if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
    }

    function recordAndHide(choice) {
      currentConsent = saveConsent(choice);
      applyThirdPartyConsent(currentConsent);
      panel.hidden = true;
      configureButton.setAttribute("aria-expanded", "false");
      banner.hidden = true;
      if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
    }

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      recordAndHide({ thirdParty: true });
    });
    banner.querySelector("[data-cookie-reject]").addEventListener("click", () => {
      recordAndHide({ thirdParty: false });
    });
    configureButton.addEventListener("click", () => openSettings(configureButton));
    banner.querySelector("[data-cookie-save]").addEventListener("click", () => {
      recordAndHide({ thirdParty: thirdPartyInput.checked });
    });
    banner.querySelector("[data-cookie-cancel]").addEventListener("click", closeSettings);

    document.addEventListener("click", (event) => {
      const settingsTrigger = event.target.closest("[data-cookie-settings]");
      const thirdPartyTrigger = event.target.closest("[data-enable-third-party]");
      if (settingsTrigger || thirdPartyTrigger) {
        event.preventDefault();
        openSettings(settingsTrigger || thirdPartyTrigger);
      }
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
}());
