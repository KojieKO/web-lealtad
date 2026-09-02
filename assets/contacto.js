/* Configuración pública: pega aquí la URL /exec del despliegue de Apps Script.
 * Instrucciones: scripts/apps-script/README.md. No se necesitan claves. */
const APPS_SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycby77lQI1flTHMdbv1-vO6VEq7VWefM6L9Cw8HtdkMoL7tcMS_vxRh4doHkuojDtwG8t/exec";

(() => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = form.querySelector("[data-submit-label]");
  const status = document.querySelector("#contact-status");
  const fields = ["nombre", "apellidos", "email", "asunto", "mensaje"];
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  const endpointPattern = /^https:\/\/script\.google\.com\/macros\/s\/[a-zA-Z0-9_-]+\/exec$/;
  const googleOriginPattern = /^https:\/\/(?:script\.google\.com|script\.googleusercontent\.com|[a-z0-9-]+-script\.googleusercontent\.com)$/;
  const errorMessage = "No se ha podido enviar tu mensaje. Conservamos tus datos para que puedas volver a intentarlo. También puedes escribir a contacto@lealtaddespojado.es.";
  let pending = null;

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
    form.removeAttribute("aria-busy");
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

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (pending) return;

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
    if (!endpointPattern.test(APPS_SCRIPT_ENDPOINT)) {
      showStatus("El formulario todavía no está disponible. Escríbenos a contacto@lealtaddespojado.es.", "error");
      status.focus();
      return;
    }

    try {
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
      const values = new FormData(form);
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
      button.disabled = true;
      buttonLabel.textContent = "Enviando…";
      // Evita que un cambio escrito durante el envío se pierda al limpiar.
      form.querySelectorAll("input, textarea").forEach((field) => { field.disabled = true; });
      form.setAttribute("aria-busy", "true");
      showStatus("Enviando tu mensaje…", "loading");
      pending.timer = window.setTimeout(() => {
        finish("No hemos podido confirmar el envío. Tus datos siguen aquí. Espera unos minutos antes de volver a intentarlo o escríbenos a contacto@lealtaddespojado.es.", "error");
      }, 60000);
      // POST nativo a un marco oculto: no hay fetch, preflight ni respuesta opaca.
      // La carga del marco NO confirma el envío: solo lo hace postMessage.
      HTMLFormElement.prototype.submit.call(transport);
    } catch {
      finish(errorMessage, "error");
    }
  });

  button.disabled = false;
})();
