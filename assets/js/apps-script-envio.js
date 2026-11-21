/* Envío común a Apps Script: reCAPTCHA invisible, POST nativo a un iframe oculto
 * y confirmación por postMessage. Lo usan contacto.js y solicitud-pdf.js.
 * Por qué así y no con fetch: scripts/apps-script/README.md. */
window.LealtadEnvio = (() => {
  // Solo la clave de sitio PÚBLICA de reCAPTCHA v2 invisible. Nunca la clave secreta.
  const RECAPTCHA_SITE_KEY = "6Lfq-qUtAAAAABPdOtVe8JHruaZF2fWoNAny94G3";
  const endpointPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
  const googleOriginPattern = /^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/;
  let loader = null;
  let widget = null;
  let attempt = null;
  let pending = null;

  function loadCaptcha() {
    if (window.grecaptcha?.render) return Promise.resolve();
    if (loader) return loader;
    loader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const fail = () => {
        window.clearTimeout(timer);
        script.remove();
        loader = null;
        reject(new Error("captcha"));
      };
      const timer = window.setTimeout(fail, 15000);
      window.onLealtadCaptchaLoaded = () => {
        window.clearTimeout(timer);
        resolve();
      };
      script.src = "https://www.google.com/recaptcha/api.js?onload=onLealtadCaptchaLoaded&render=explicit&hl=es";
      script.async = true;
      script.onerror = fail;
      // Solo se contacta con reCAPTCHA al intentar enviar un formulario válido.
      document.head.append(script);
    });
    return loader;
  }

  function settleCaptcha(token, reason = "captcha") {
    if (!attempt) return;
    const current = attempt;
    attempt = null;
    window.clearTimeout(current.timer);
    current.cancel.hidden = true;
    if (typeof token === "string" && token) current.resolve(token);
    else current.reject(new Error(reason));
  }

  async function verifyCaptcha(container, cancel) {
    await loadCaptcha();
    return new Promise((resolve, reject) => {
      attempt = { resolve, reject, cancel, timer: window.setTimeout(() => settleCaptcha(null), 180000) };
      cancel.onclick = () => settleCaptcha(null, "cancelled");
      cancel.hidden = false;
      try {
        if (widget === null) {
          widget = window.grecaptcha.render(container, {
            sitekey: RECAPTCHA_SITE_KEY,
            size: "invisible",
            badge: "inline",
            callback: (token) => settleCaptcha(token),
            "error-callback": () => settleCaptcha(null),
            "expired-callback": () => settleCaptcha(null),
          });
        } else {
          window.grecaptcha.reset(widget);
        }
        window.grecaptcha.execute(widget);
      } catch {
        settleCaptcha(null);
      }
    });
  }

  function finishPending(result) {
    if (!pending) return;
    window.clearTimeout(pending.timer);
    pending.transport.remove();
    pending.frame.remove();
    pending.resolve(result);
    pending = null;
  }

  window.addEventListener("message", (event) => {
    // HtmlService ejecuta su respuesta dentro de un iframe anidado de Google.
    // Su event.source no es el marco exterior; se verifican origen y nonce.
    const data = event.data;
    if (!pending || !googleOriginPattern.test(event.origin) || !data ||
        data.type !== "lealtad-contact-result" || data.requestId !== pending.requestId ||
        typeof data.ok !== "boolean") return;
    finishPending(data.ok ? "ok" : "error");
  });

  function configured(endpoint) {
    return endpointPattern.test(endpoint) && Boolean(RECAPTCHA_SITE_KEY.trim());
  }

  /* values: FormData con los campos. ui: { captcha, cancel, onSending }.
   * Resuelve "ok", "error" o "timeout". Rechaza con Error("captcha") o
   * Error("cancelled") si no se supera la comprobación (nada se ha enviado). */
  async function send(endpoint, values, ui) {
    try {
      values.set("g-recaptcha-response", await verifyCaptcha(ui.captcha, ui.cancel));
      ui.onSending?.();
      return await new Promise((resolve) => {
        const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)),
          (byte) => byte.toString(16).padStart(2, "0")).join("");
        const frame = document.createElement("iframe");
        frame.name = `lealtad-response-${requestId}`;
        frame.title = "Respuesta del envío del formulario";
        frame.hidden = true;
        const transport = document.createElement("form");
        transport.hidden = true;
        transport.method = "post";
        transport.action = endpoint;
        transport.target = frame.name;
        transport.acceptCharset = "UTF-8";
        values.set("requestId", requestId);
        values.set("returnOrigin", window.location.origin);
        for (const [name, value] of values) {
          const input = document.createElement("input");
          input.type = "hidden";
          input.name = name;
          input.value = value;
          transport.append(input);
        }
        pending = { requestId, frame, transport, resolve, timer: null };
        document.body.append(frame, transport);
        pending.timer = window.setTimeout(() => finishPending("timeout"), 60000);
        // POST nativo a un marco oculto: no hay fetch, preflight ni respuesta opaca.
        // La carga del marco NO confirma el envío: solo lo hace postMessage.
        HTMLFormElement.prototype.submit.call(transport);
      });
    } finally {
      ui.cancel.hidden = true;
      if (widget !== null) {
        try { window.grecaptcha.reset(widget); } catch { /* Puede fallar si se pierde la conexión. */ }
      }
    }
  }

  return { configured, send };
})();
