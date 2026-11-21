  /* Proyecto de Apps Script independiente, desplegado desde notificaciones@.
   * Envía a contacto@ el PDF de la solicitud de ingreso. Ver ../README-solicitud.md.
   * Este archivo se ejecuta en Google, nunca en GitHub Pages.
   * Transporte y reCAPTCHA idénticos al formulario de contacto (../Code.gs):
   * son proyectos de Google separados y no pueden compartir código. */
  const SENDER_ADDRESS = "notificaciones@lealtaddespojado.es";
  const DESTINATION_ADDRESS = "contacto@lealtaddespojado.es";
  const ALLOWED_ORIGINS = [
    "https://www.lealtaddespojado.es",
    "https://lealtaddespojado.es",
  ];
  const MAX_PDF_BYTES = 3 * 1024 * 1024;
  const EMAIL_PATTERN = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?)+$/;
  
  function doGet() {
    // Abrir el endpoint nunca envía correo ni publica datos.
    return HtmlService.createHtmlOutput("Servicio de solicitudes de la Hermandad. Utiliza el formulario de nuestra web.");
  }
  
  function doPost(e) {
    const parameters = e && e.parameters ? e.parameters : {};
    const origin = singleValue_(parameters, "returnOrigin");
    const requestId = singleValue_(parameters, "requestId");
    if (!ALLOWED_ORIGINS.includes(origin) || !/^[a-f0-9]{32}$/.test(requestId)) {
      return HtmlService.createHtmlOutput("Solicitud no válida.");
    }
  
    try {
      // El PDF codificado ocupa un tercio más; el resto de campos es pequeño.
      if (singleValue_(parameters, "website") !== "" ||
          singleValue_(parameters, "consentimiento") !== "aceptado" ||
          !e.postData || e.postData.length > MAX_PDF_BYTES * 2) {
        return response_(origin, requestId, false);
      }
      const nombre = field_(parameters, "nombre", 150);
      const email = field_(parameters, "email", 254);
      if (!EMAIL_PATTERN.test(email)) return response_(origin, requestId, false);
      const pdf = pdf_(parameters, nombre);
      if (!verifyCaptcha_(parameters)) return response_(origin, requestId, false);
      checkSender_();
  
      const body = [
        "Nueva solicitud de ingreso recibida desde la web.",
        "",
        `Solicitante: ${nombre}`,
        `Correo electrónico: ${email}`,
        "",
        "Se adjunta el PDF generado y firmado por el solicitante.",
      ].join("\n");
      // Destinatario fijo y texto plano; el solicitante solo aparece como Reply-To.
      MailApp.sendEmail(DESTINATION_ADDRESS, `Inscripción de ${nombre}`, body, {
        name: "Solicitudes web - Hermandad del Despojado",
        replyTo: email,
        attachments: [pdf],
      });
      return response_(origin, requestId, true);
    } catch {
      // No publicar excepciones ni datos personales en la respuesta o los registros.
      console.warn("No se ha completado el envío de una solicitud de ingreso.");
      return response_(origin, requestId, false);
    }
  }
  
  function singleValue_(parameters, name) {
    const values = parameters[name];
    return Array.isArray(values) && values.length === 1 && typeof values[0] === "string"
      ? values[0] : null;
  }
  
  function field_(parameters, name, maxLength) {
    const raw = singleValue_(parameters, name);
    if (raw === null) throw new Error("Campo ausente o repetido.");
    const value = raw.trim();
    if (!value || value.length > maxLength || /[\u0000-\u001f\u007f\u2028\u2029]/.test(value)) {
      throw new Error("Campo no válido.");
    }
    return value;
  }
  
  function pdf_(parameters, nombre) {
    const encoded = singleValue_(parameters, "pdf");
    if (!encoded || encoded.length > Math.ceil(MAX_PDF_BYTES / 3) * 4 ||
        !/^[A-Za-z0-9+/]+={0,2}$/.test(encoded)) {
      throw new Error("PDF no válido.");
    }
    const bytes = Utilities.base64Decode(encoded);
    // Debe empezar por «%PDF»: no se reenvían otros tipos de archivo.
    if (bytes.length < 5 || bytes.length > MAX_PDF_BYTES ||
        bytes[0] !== 37 || bytes[1] !== 80 || bytes[2] !== 68 || bytes[3] !== 70) {
      throw new Error("PDF no válido.");
    }
    const fileName = `Solicitud de ingreso - ${nombre.replace(/[\\/:*?"<>|]/g, "")}.pdf`;
    return Utilities.newBlob(bytes, "application/pdf", fileName);
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
    return result.success === true &&
      ALLOWED_ORIGINS.includes("https://" + result.hostname);
  }
  
  function checkSender_() {
    // MailApp envía siempre desde la cuenta que despliega: debe ser notificaciones@.
    if (Session.getEffectiveUser().getEmail().toLowerCase() !== SENDER_ADDRESS) {
      throw new Error("Despliega este proyecto con la cuenta " + SENDER_ADDRESS + ".");
    }
  }
  
  function comprobarConfiguracion() {
    // Ejecutar manualmente en el editor para autorizar y validar. No envía correo.
    checkSender_();
    if (!PropertiesService.getScriptProperties().getProperty("RECAPTCHA_SECRET_KEY")) {
      throw new Error("Añade RECAPTCHA_SECRET_KEY en las propiedades del script.");
    }
    console.log("Remitente correcto: " + SENDER_ADDRESS + ". Cuota de envío restante hoy: " + MailApp.getRemainingDailyQuota());
  }
  
  function response_(origin, requestId, ok) {
    // Mismo mensaje que el formulario de contacto: lo recibe assets/js/apps-script-envio.js.
    const result = JSON.stringify({ type: "lealtad-contact-result", requestId, ok });
    const html = '<!doctype html><html><head><meta charset="utf-8"></head><body>' +
      '<script>window.top.postMessage(' + result + ', ' + JSON.stringify(origin) + ');</script>' +
      '</body></html>';
    return HtmlService.createHtmlOutput(html)
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL);
  }
