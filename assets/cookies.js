/*
 * CONSENTIMIENTO DE COOKIES, ANALÍTICA Y CONTENIDOS DE TERCEROS
 * =============================================================
 * La web usa un modelo de consentimiento básico: Google Analytics 4 no se
 * carga hasta que la persona usuaria acepta expresamente la categoría de
 * analítica. Google Maps también permanece bloqueado hasta aceptar contenidos
 * de terceros. La elección se guarda en localStorage.
 */
(function () {
  "use strict";

  const STORAGE_KEY = "lealtad_cookie_consent";
  const CONSENT_VERSION = 2;
  const GA_MEASUREMENT_ID = "G-W325LRLR5Z";
  let lastTrigger = null;
  let analyticsLoaded = false;

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

  function deleteAnalyticsCookies() {
    const host = window.location.hostname;
    const rootDomain = host.replace(/^www\./, "");
    const domains = ["", host, `.${host}`, rootDomain, `.${rootDomain}`];

    document.cookie.split(";").forEach((cookie) => {
      const name = cookie.split("=")[0].trim();
      if (!name.startsWith("_ga")) return;

      domains.forEach((domain) => {
        const domainPart = domain ? `; domain=${domain}` : "";
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/${domainPart}; SameSite=Lax`;
      });
    });
  }

  function ensureGtag() {
    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function gtag() {
        window.dataLayer.push(arguments);
      };
    }
  }

  function loadAnalytics() {
    if (analyticsLoaded || document.querySelector(`script[data-ga4-id="${GA_MEASUREMENT_ID}"]`)) {
      analyticsLoaded = true;
      return;
    }

    ensureGtag();
    window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;

    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
    });
    window.gtag("js", new Date());
    window.gtag("config", GA_MEASUREMENT_ID);

    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(GA_MEASUREMENT_ID)}`;
    script.dataset.ga4Id = GA_MEASUREMENT_ID;
    document.head.appendChild(script);
    analyticsLoaded = true;
  }

  function applyAnalyticsConsent(consent) {
    const allowed = Boolean(consent && consent.analytics);

    if (allowed) {
      window[`ga-disable-${GA_MEASUREMENT_ID}`] = false;
      if (typeof window.gtag === "function") {
        window.gtag("consent", "update", {
          analytics_storage: "granted",
          ad_storage: "denied",
          ad_user_data: "denied",
          ad_personalization: "denied",
        });
      }
      loadAnalytics();
      return;
    }

    window[`ga-disable-${GA_MEASUREMENT_ID}`] = true;
    if (typeof window.gtag === "function") {
      window.gtag("consent", "update", {
        analytics_storage: "denied",
        ad_storage: "denied",
        ad_user_data: "denied",
        ad_personalization: "denied",
      });
    }
    deleteAnalyticsCookies();
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
        <p>Usamos almacenamiento local para recordar tu elección. Google Analytics solo se activa si aceptas las cookies analíticas y Google Maps solo se carga si aceptas contenidos de terceros.</p>
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
              <h4>Analíticas</h4>
              <p>Permiten conocer de forma agregada cómo se utiliza la web mediante Google Analytics 4.</p>
            </div>
            <label><input id="cookie-analytics" type="checkbox"> Permitir</label>
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
    const analyticsInput = banner.querySelector("#cookie-analytics");
    const thirdPartyInput = banner.querySelector("#cookie-third-party");
    let currentConsent = readConsent();

    applyAnalyticsConsent(currentConsent || defaultConsent());
    applyThirdPartyConsent(currentConsent || defaultConsent());
    if (!currentConsent) banner.hidden = false;

    function openSettings(trigger) {
      lastTrigger = trigger || document.activeElement;
      currentConsent = readConsent() || defaultConsent();
      analyticsInput.checked = Boolean(currentConsent.analytics);
      thirdPartyInput.checked = Boolean(currentConsent.thirdParty);
      banner.hidden = false;
      panel.hidden = false;
      configureButton.setAttribute("aria-expanded", "true");
      analyticsInput.focus();
    }

    function closeSettings() {
      panel.hidden = true;
      configureButton.setAttribute("aria-expanded", "false");
      if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
    }

    function recordAndHide(choice) {
      currentConsent = saveConsent(choice);
      applyAnalyticsConsent(currentConsent);
      applyThirdPartyConsent(currentConsent);
      panel.hidden = true;
      configureButton.setAttribute("aria-expanded", "false");
      banner.hidden = true;
      if (lastTrigger && typeof lastTrigger.focus === "function") lastTrigger.focus();
    }

    banner.querySelector("[data-cookie-accept]").addEventListener("click", () => {
      recordAndHide({ analytics: true, thirdParty: true });
    });
    banner.querySelector("[data-cookie-reject]").addEventListener("click", () => {
      recordAndHide({ analytics: false, thirdParty: false });
    });
    configureButton.addEventListener("click", () => openSettings(configureButton));
    banner.querySelector("[data-cookie-save]").addEventListener("click", () => {
      recordAndHide({
        analytics: analyticsInput.checked,
        thirdParty: thirdPartyInput.checked,
      });
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
