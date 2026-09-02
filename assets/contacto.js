/* Configuración pública: pega aquí la URL /exec del despliegue de Apps Script.
 * Instrucciones: scripts/apps-script/README.md y RECAPTCHA.md. */
const APPS_SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycby77lQI1flTHMdbv1-vO6VEq7VWefM6L9Cw8HtdkMoL7tcMS_vxRh4doHkuojDtwG8t/exec";
// Solo la clave de sitio PÚBLICA de reCAPTCHA v2 invisible. Nunca la clave secreta.
const RECAPTCHA_SITE_KEY = "6Lfq-qUtAAAAABPdOtVe8JHruaZF2fWoNAny94G3";

(() => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = form.querySelector("[data-submit-label]");
  const status = document.querySelector("#contact-status");
  const cancelCaptcha = document.querySelector("#contact-captcha-cancel");
  const fields = ["nombre", "apellidos", "email", "asunto", "mensaje"];
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  const endpointPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
  const googleOriginPattern = /^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/;
  const errorMessage = "No se ha podido enviar tu mensaje. Conservamos tus datos para que puedas volver a intentarlo. También puedes escribir a contacto@lealtaddespojado.es.";
  let pending = null;
  let submitting = false;
  let captchaLoader = null;
  let captchaWidget = null;
  let captchaAttempt = null;
  const captchaError = "No se ha podido completar la comprobación de seguridad. Vuelve a intentarlo o escríbenos a contacto@lealtaddespojado.es.";
  const captchaCancelled = "Comprobación cancelada. Tus datos siguen aquí para que puedas volver a intentarlo.";

  function loadCaptcha() {
    if (window.grecaptcha?.render) return Promise.resolve();
    if (captchaLoader) return captchaLoader;
    captchaLoader = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      const fail = () => {
        window.clearTimeout(timer);
        script.remove();
        captchaLoader = null;
        reject(new Error(captchaError));
      };
      const timer = window.setTimeout(fail, 15000);
      window.onContactCaptchaLoaded = () => {
        window.clearTimeout(timer);
        resolve();
      };
      script.src = "https://www.google.com/recaptcha/api.js?onload=onContactCaptchaLoaded&render=explicit&hl=es";
      script.async = true;
      script.onerror = fail;
      // Solo se contacta con reCAPTCHA al intentar enviar un formulario válido.
      document.head.append(script);
    });
    return captchaLoader;
  }

  function settleCaptcha(token, message = captchaError) {
    if (!captchaAttempt) return;
    const attempt = captchaAttempt;
    captchaAttempt = null;
    window.clearTimeout(attempt.timer);
    cancelCaptcha.hidden = true;
    if (typeof token === "string" && token) attempt.resolve(token);
    else attempt.reject(new Error(message));
  }

  async function verifyCaptcha() {
    await loadCaptcha();
    return new Promise((resolve, reject) => {
      captchaAttempt = { resolve, reject, timer: window.setTimeout(() => settleCaptcha(null), 180000) };
      cancelCaptcha.hidden = false;
      try {
        if (captchaWidget === null) {
          captchaWidget = window.grecaptcha.render("contact-captcha", {
            sitekey: RECAPTCHA_SITE_KEY,
            size: "invisible",
            badge: "inline",
            callback: (token) => settleCaptcha(token),
            "error-callback": () => settleCaptcha(null),
            "expired-callback": () => settleCaptcha(null),
          });
        } else {
          window.grecaptcha.reset(captchaWidget);
        }
        window.grecaptcha.execute(captchaWidget);
      } catch {
        settleCaptcha(null);
      }
    });
  }

  cancelCaptcha.addEventListener("click", () => {
    settleCaptcha(null, captchaCancelled);
  });

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  function finish(message, state) {
    if (pending) {
      window.clearTimeout(pending.timer);
      pending.transport.remove();
      pending.frame.remove();
      pending = null;
    }
    submitting = false;
    button.removeAttribute("aria-busy");
    cancelCaptcha.hidden = true;
    if (captchaWidget !== null) {
      try { window.grecaptcha.reset(captchaWidget); } catch { /* Puede fallar si se pierde la conexión. */ }
    }
    form.querySelectorAll("input, textarea").forEach((field) => { field.disabled = false; });
    button.disabled = false;
    buttonLabel.textContent = "Enviar";
    if (state === "success") form.reset();
    showStatus(message, state);
    status.focus();
  }

  fields.forEach((name) => {
    form.elements.namedItem(name).addEventListener("input", (event) => {
      event.target.setCustomValidity("");
    });
  });

  window.addEventListener("message", (event) => {
    // HtmlService ejecuta su respuesta dentro de un iframe anidado de Google.
    // Su event.source no es el marco exterior; se verifican origen y nonce.
    const data = event.data;
    if (!pending || !googleOriginPattern.test(event.origin) || !data ||
        data.type !== "lealtad-contact-result" || data.requestId !== pending.requestId ||
        typeof data.ok !== "boolean") return;

    if (data.ok) {
      finish("Tu mensaje se ha enviado correctamente. Nos pondremos en contacto contigo lo antes posible.", "success");
    } else {
      finish(errorMessage, "error");
    }
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (submitting) return;

    fields.forEach((name) => {
      const field = form.elements.namedItem(name);
      const value = field.value.trim();
      let message = "";
      if (!value) message = "Completa este campo.";
      else if (value.length > field.maxLength) message = `Usa como máximo ${field.maxLength} caracteres.`;
      else if (name !== "mensaje" && /[\u0000-\u001f\u007f\u2028\u2029]/.test(value)) message = "Escribe este dato en una sola línea.";
      else if (name === "email" && !emailPattern.test(value)) message = "Introduce una dirección de correo válida.";
      field.setCustomValidity(message);
    });
    if (!form.reportValidity()) return;

    if (form.elements.namedItem("website").value) {
      showStatus(errorMessage, "error");
      status.focus();
      return;
    }
    if (!endpointPattern.test(APPS_SCRIPT_ENDPOINT) || !RECAPTCHA_SITE_KEY.trim()) {
      showStatus("El formulario todavía no está disponible. Escríbenos a contacto@lealtaddespojado.es.", "error");
      status.focus();
      return;
    }

    try {
      const values = new FormData(form);
      submitting = true;
      button.disabled = true;
      button.setAttribute("aria-busy", "true");
      buttonLabel.textContent = "Comprobando…";
      form.querySelectorAll("input, textarea").forEach((field) => { field.disabled = true; });
      showStatus("Comprobando seguridad… Si Google te pide una verificación, complétala para enviar.", "loading");
      const captchaToken = await verifyCaptcha();
      values.set("g-recaptcha-response", captchaToken);
      const requestId = Array.from(crypto.getRandomValues(new Uint8Array(16)),
        (byte) => byte.toString(16).padStart(2, "0")).join("");
      const frame = document.createElement("iframe");
      frame.name = `contact-response-${requestId}`;
      frame.title = "Respuesta del envío del formulario";
      frame.hidden = true;
      const transport = document.createElement("form");
      transport.hidden = true;
      transport.method = "post";
      transport.action = APPS_SCRIPT_ENDPOINT;
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
      pending = { requestId, frame, transport, timer: null };
      document.body.append(frame, transport);
      buttonLabel.textContent = "Enviando…";
      showStatus("Enviando tu mensaje…", "loading");
      pending.timer = window.setTimeout(() => {
        finish("No hemos podido confirmar el envío. Tus datos siguen aquí. Espera unos minutos antes de volver a intentarlo o escríbenos a contacto@lealtaddespojado.es.", "error");
      }, 60000);
      // POST nativo a un marco oculto: no hay fetch, preflight ni respuesta opaca.
      // La carga del marco NO confirma el envío: solo lo hace postMessage.
      HTMLFormElement.prototype.submit.call(transport);
    } catch (error) {
      finish(error.message === captchaCancelled ? captchaCancelled : (pending ? errorMessage : captchaError), "error");
    }
  });

  button.disabled = false;
})();
