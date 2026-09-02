/* Copiar en un proyecto independiente de Apps Script. Ver README.md.
 * Este archivo se ejecuta en Google, nunca en GitHub Pages. */
const CONTACT_ADDRESS = "contacto@lealtaddespojado.es";
const ALLOWED_ORIGINS = [
  "https://www.lealtaddespojado.es",
  "https://lealtaddespojado.es",
];
const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;

function doGet() {
  // Abrir el endpoint nunca envía correo ni publica datos de visitantes.
  return HtmlService.createHtmlOutput("Servicio de contacto de la Hermandad. Utiliza el formulario de nuestra web.");
}

function doPost(e) {
  const parameters = e && e.parameters ? e.parameters : {};
  const origin = singleValue_(parameters, "returnOrigin");
  const requestId = singleValue_(parameters, "requestId");
  if (!ALLOWED_ORIGINS.includes(origin) || !/^[a-f0-9]{32}$/.test(requestId)) {
    return HtmlService.createHtmlOutput("Solicitud no válida.");
  }

  try {
    // Se exige el campo vacío y único: no se omite la comprobación en servidor.
    if (singleValue_(parameters, "website") !== "" ||
        singleValue_(parameters, "privacidad") !== "aceptada" ||
        !e.postData || e.postData.length > 100000) {
      return response_(origin, requestId, false);
    }
    const nombre = field_(parameters, "nombre", 80, false);
    const apellidos = field_(parameters, "apellidos", 120, false);
    const email = field_(parameters, "email", 254, false);
    const asunto = field_(parameters, "asunto", 150, false);
    const mensaje = field_(parameters, "mensaje", 5000, true);
    if (!EMAIL_PATTERN.test(email)) return response_(origin, requestId, false);
    if (!verifyCaptcha_(parameters)) return response_(origin, requestId, false);

    const options = senderOptions_();
    options.name = `${nombre} ${apellidos} (a través de la web)`;
    options.replyTo = email;
    // Texto plano: ningún dato del visitante se interpreta como HTML.
    const body = [
      `Nombre: ${nombre} ${apellidos}`,
      `Correo electrónico: ${email}`,
      `Asunto: ${asunto}`,
      "",
      "Mensaje:",
      mensaje,
    ].join("\n");
    // Solo se usa el destinatario fijo. No hay to/cc/bcc recibidos del cliente.
    GmailApp.sendEmail(CONTACT_ADDRESS, `Formulario web - ${asunto}`, body, options);
    return response_(origin, requestId, true);
  } catch {
    // No publicar excepciones, datos personales ni credenciales en la respuesta.
    console.warn("No se ha completado un envío del formulario de contacto.");
    return response_(origin, requestId, false);
  }
}

function singleValue_(parameters, name) {
  const values = parameters[name];
  return Array.isArray(values) && values.length === 1 && typeof values[0] === "string"
    ? values[0] : null;
}

function verifyCaptcha_(parameters) {
  const token = singleValue_(parameters, "g-recaptcha-response");
  // La clave privada se configura en Google, nunca en este archivo público.
  const secret = PropertiesService.getScriptProperties().getProperty("RECAPTCHA_SECRET_KEY");
  if (!secret || !token || !token.trim() || token.length > 10000) return false;
  const response = UrlFetchApp.fetch("https://www.google.com/recaptcha/api/siteverify", {
    method: "post",
    payload: { secret, response: token },
    muteHttpExceptions: true,
    followRedirects: false,
  });
  if (response.getResponseCode() !== 200) return false;
  const result = JSON.parse(response.getContentText());
  // Google comprueba también caducidad y uso único del token.
  return result.success === true &&
    ALLOWED_ORIGINS.includes("https://" + result.hostname);
}

function field_(parameters, name, maxLength, multiline) {
  const raw = singleValue_(parameters, name);
  if (raw === null) throw new Error("Campo ausente o repetido.");
  const value = raw.trim();
  const forbidden = multiline ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f\u2028\u2029]/;
  if (!value || value.length > maxLength || forbidden.test(value)) {
    throw new Error("Campo no válido.");
  }
  return value;
}

function senderOptions_() {
  const account = Session.getEffectiveUser().getEmail().toLowerCase();
  if (!account.endsWith("@lealtaddespojado.es")) {
    throw new Error("Utiliza una cuenta de Google Workspace de la Hermandad.");
  }
  if (account === CONTACT_ADDRESS) return {};
  const alias = GmailApp.getAliases().find((email) => email.toLowerCase() === CONTACT_ADDRESS);
  if (!alias) throw new Error("La cuenta no tiene autorizado el remitente de contacto.");
  return { from: alias };
}

function comprobarConfiguracion() {
  // Ejecutar manualmente en el editor para autorizar y validar el remitente.
  // No envía ningún correo.
  senderOptions_();
  GmailApp.getAliases();
  if (!PropertiesService.getScriptProperties().getProperty("RECAPTCHA_SECRET_KEY")) {
    throw new Error("Añade RECAPTCHA_SECRET_KEY en las propiedades del script.");
  }
  console.log("Remitente autorizado: " + CONTACT_ADDRESS);
}

function response_(origin, requestId, ok) {
  // Solo se interpolan valores validados: origen de lista fija, nonce hex y booleano.
  // No se devuelve el nombre, correo ni mensaje en el HTML.
  const result = JSON.stringify({ type: "lealtad-contact-result", requestId, ok });
  const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
    '<script>window.top.postMessage(' + result + ', ' + JSON.stringify(origin) + ');</script>' +
    '</body></html>';
  // Google anida el HTML en otro marco: top llega a la web, parent no siempre.
  // ALLOWALL es necesario para recibir esta respuesta dentro de nuestra página.
  return HtmlService.createHtmlOutput(html)
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
}
