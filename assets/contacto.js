/* Configuración pública: pega aquí la URL /exec del despliegue de Apps Script.
 * Instrucciones: scripts/apps-script/README.md y RECAPTCHA.md.
 * La clave pública de reCAPTCHA y el transporte están en assets/js/apps-script-envio.js. */
const APPS_SCRIPT_ENDPOINT = "https://script.google.com/macros/s/AKfycby77lQI1flTHMdbv1-vO6VEq7VWefM6L9Cw8HtdkMoL7tcMS_vxRh4doHkuojDtwG8t/exec";

(() => {
  const form = document.querySelector("#contact-form");
  if (!form) return;

  const button = form.querySelector('button[type="submit"]');
  const buttonLabel = form.querySelector("[data-submit-label]");
  const status = document.querySelector("#contact-status");
  const captcha = document.querySelector("#contact-captcha");
  const cancelCaptcha = document.querySelector("#contact-captcha-cancel");
  const fields = ["nombre", "apellidos", "email", "asunto", "mensaje"];
  const emailPattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  const errorMessage = "No se ha podido enviar tu mensaje. Conservamos tus datos para que puedas volver a intentarlo. También puedes escribir a contacto@lealtaddespojado.es.";
  const captchaError = "No se ha podido completar la comprobación de seguridad. Vuelve a intentarlo o escríbenos a contacto@lealtaddespojado.es.";
  const captchaCancelled = "Comprobación cancelada. Tus datos siguen aquí para que puedas volver a intentarlo.";
  const timeoutMessage = "No hemos podido confirmar el envío. Tus datos siguen aquí. Espera unos minutos antes de volver a intentarlo o escríbenos a contacto@lealtaddespojado.es.";
  let submitting = false;

  function showStatus(message, state) {
    status.textContent = message;
    status.dataset.state = state;
  }

  function finish(message, state) {
    submitting = false;
    button.removeAttribute("aria-busy");
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
    if (!LealtadEnvio.configured(APPS_SCRIPT_ENDPOINT)) {
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
      const result = await LealtadEnvio.send(APPS_SCRIPT_ENDPOINT, values, {
        captcha,
        cancel: cancelCaptcha,
        onSending: () => {
          buttonLabel.textContent = "Enviando…";
          showStatus("Enviando tu mensaje…", "loading");
        },
      });
      if (result === "ok") finish("Tu mensaje se ha enviado correctamente. Nos pondremos en contacto contigo lo antes posible.", "success");
      else finish(result === "timeout" ? timeoutMessage : errorMessage, "error");
    } catch (error) {
      finish(error.message === "cancelled" ? captchaCancelled : error.message === "captcha" ? captchaError : errorMessage, "error");
    }
  });

  button.disabled = false;
})();
