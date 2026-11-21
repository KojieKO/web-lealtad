/* Rellena una copia de la plantilla original en el navegador, para descargarla
 * o enviarla a la Hermandad. */
// URL /exec del despliegue de Apps Script de notificaciones@ (scripts/apps-script/README-solicitud.md).
// Si se deja vacía, el botón «Enviar a la Hermandad» no aparece.
const SOLICITUD_ENDPOINT = "https://script.google.com/macros/s/AKfycbw0nbhQ2mqcfmGiwPCEcAcH6Vg834iRuXdcn0689uSUywciH6CR2A3Vc-ogG24j6wOtJw/exec";

(function () {
  const form = document.querySelector("#solicitud-form");
  const downloadButton = document.querySelector("#descargar-pdf");
  const sendButton = document.querySelector("#enviar-solicitud");
  const status = document.querySelector("#form-status");
  const field = (name) => form.elements[name]?.value.trim() || "";
  function ageOn(dateString) {
    const date = new Date(`${dateString}T00:00:00`), now = new Date();
    let age = now.getFullYear() - date.getFullYear();
    if (now < new Date(now.getFullYear(), date.getMonth(), date.getDate())) age--;
    return age;
  }
  const months = ["enero", "febrero", "marzo", "abril", "mayo", "junio", "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre"];
  // Devuelve el PDF relleno y si lleva firma dibujada. Lanza Error con un texto para el usuario.
  async function buildPdf() {
      // fetch() de la plantilla no funciona al abrir el HTML con doble clic (file://).
      if (location.protocol === "file:") throw new Error("abre la página desde la web o un servidor local, no con doble clic.");
      const age = ageOn(field("solicitante.fechaNacimiento"));
      if (!Number.isFinite(age) || age < 0) throw new Error("revisa la fecha de nacimiento.");
      const response = await fetch("documentos/solicitud-base-local.pdf");
      if (!response.ok) throw new Error("No se encuentra la plantilla PDF.");
      const pdf = await PDFLib.PDFDocument.load(await response.arrayBuffer());
      const pages = pdf.getPages();
      if (pages.length !== 2) throw new Error("La plantilla debe tener dos páginas.");
      const font = await pdf.embedFont(PDFLib.StandardFonts.Helvetica);
      const draw = (page, value, x, top, width, maxSize = 10) => {
        if (!value) return;
        const text = String(value).replace(/[\r\n]+/g, " ").trim();
        let size = maxSize;
        while (size > 7 && font.widthOfTextAtSize(text, size) > width) size -= 0.25;
        if (font.widthOfTextAtSize(text, size) > width) throw new Error("Un dato es demasiado largo para el espacio disponible en el PDF. Revísalo antes de descargar.");
        page.drawText(text, { x, y: page.getHeight() - top - size, size, font });
      };
      const check = (page, x, top) => {
        const y = page.getHeight() - top;
        page.drawLine({ start: { x: x + 1.2, y: y - 1.2 }, end: { x: x + 6.3, y: y - 6.3 }, thickness: 0.9 });
        page.drawLine({ start: { x: x + 6.3, y: y - 1.2 }, end: { x: x + 1.2, y: y - 6.3 }, thickness: 0.9 });
      };
      const dateParts = (value) => value ? value.split("-") : [];
      const [p1, p2] = pages;
      draw(p1, field("solicitante.nombre"), 98, 196, 460);
      draw(p1, field("solicitante.dniNie"), 104, 218, 173);
      const born = dateParts(field("solicitante.fechaNacimiento"));
      if (born.length === 3) { draw(p1, born[2], 389, 218, 23); draw(p1, months[Number(born[1])-1], 427, 218, 75); draw(p1, born[0], 518, 218, 42); }
      draw(p1, field("solicitante.lugarNacimiento"), 140, 240, 256);
      draw(p1, field("solicitante.provinciaNacimiento"), 457, 240, 100);
      draw(p1, [field("solicitante.domicilio"), field("solicitante.numero"), field("solicitante.piso")].filter(Boolean).join(", "), 86, 262, 470);
      draw(p1, field("solicitante.codigoPostal"), 110, 284, 78);
      draw(p1, field("solicitante.localidad"), 260, 284, 297);
      draw(p1, field("solicitante.telefono"), 74, 306, 90);
      draw(p1, field("solicitante.email"), 266, 306, 290);
      draw(p1, field("bautismo.parroquia"), 224, 356, 332);
      draw(p1, field("bautismo.localidad"), 80, 378, 250);
      const baptism = dateParts(field("bautismo.fecha"));
      if (baptism.length === 3) { draw(p1, baptism[2], 443, 378, 22); draw(p1, baptism[1], 479, 378, 22); draw(p1, baptism[0], 515, 378, 46); }
      if (form.elements["solicitante.whatsapp"].checked) check(p1, 35.5, 410.5);
      if (form.elements["bautismo.declaracionIngresoAceptada"].checked) check(p1, 35.5, 456.5);
      const spots = { anual: [464, 671.5], mensual: [506.5, 671.5], trimestral: [33, 693.5], semestral: [97, 693.5] };
      const spot = spots[field("cuota.periodicidad")]; if (spot) check(p1, ...spot);
      draw(p1, field("cuota.importe"), 168, 690, 43);
      draw(p1, field("cuenta.entidadBancaria"), 129, 713, 422);
      draw(p1, field("cuenta.titular"), 141, 735, 252);
      draw(p1, field("cuenta.dniTitular"), 455, 735, 95);
      draw(p1, field("cuenta.iban"), 132, 757, 280);
      const rep = age < 14;
      const prefix = rep ? "consentimiento.representante." : "consentimiento.mayor.";
      draw(p2, field(prefix+"nombre"), rep ? 128 : 76, rep ? 517 : 379, rep ? 425 : 480);
      draw(p2, field(prefix+"dniNie"), rep ? 125 : 106, rep ? 539 : 401, rep ? 170 : 140);
      if (rep) draw(p2, field("solicitante.nombre"), 122, 561, 430);
      draw(p2, field(prefix+"lugar"), rep ? 48 : 446, rep ? 649 : 445, rep ? 115 : 110);
      const signed = dateParts(field(prefix+"fecha"));
      if (signed.length === 3) {
        draw(p2, signed[2], rep ? 180 : 38, rep ? 649 : 467, 35);
        draw(p2, months[Number(signed[1])-1], rep ? 233 : 91, rep ? 649 : 467, 105);
        draw(p2, signed[0], rep ? 358 : 216, rep ? 649 : 467, 55);
      }
      const canvas = document.querySelector(rep ? "#firma-menor canvas" : "#firma-mayor canvas");
      if (canvas.dataset.signed) {
        const png = await pdf.embedPng(canvas.toDataURL("image/png"));
        p1.drawImage(png, { x: rep ? 218 : 213, y: p1.getHeight()-(rep ? 561 : 578), width: rep ? 160 : 170, height: rep ? 39 : 42 });
      }
      if (rep) {
        const representative = `${field(prefix+"nombre")} - ${field(prefix+"dniNie")}`;
        let size = 9;
        while (size > 7 && font.widthOfTextAtSize(representative, size) > 250) size -= 0.25;
        const width = font.widthOfTextAtSize(representative, size);
        if (width > 250) throw new Error("El nombre del representante es demasiado largo para el espacio de firma.");
        draw(p1, representative, (p1.getWidth() - width) / 2, 568, 250, size);
      }
      return { pdf, signed: Boolean(canvas.dataset.signed) };
  }

  let busy = false;
  async function run(action) {
    if (busy || !form.reportValidity()) return;
    busy = true;
    downloadButton.disabled = sendButton.disabled = true;
    let built;
    try {
      built = await buildPdf();
    } catch (error) {
      status.textContent = `No se ha podido generar el PDF: ${error.message}`;
    }
    try {
      if (built) status.textContent = await action(built);
    } catch (error) {
      status.textContent = error.message;
    } finally {
      busy = false;
      downloadButton.disabled = false;
      sendButton.disabled = sendButton.dataset.sent === "true";
      status.focus();
    }
  }

  downloadButton.addEventListener("click", () => run(async ({ pdf }) => {
    const bytes = await pdf.save();
    const url = URL.createObjectURL(new Blob([bytes], { type: "application/pdf" }));
    const link = document.createElement("a"); link.href = url; link.download = "solicitud-ingreso.pdf"; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 60000);
    return "PDF generado. Revísalo antes de firmarlo o entregarlo.";
  }));

  const sendError = "No se ha podido enviar la solicitud. Tus datos siguen aquí: vuelve a intentarlo o descarga el PDF y envíalo a contacto@lealtaddespojado.es.";
  sendButton.hidden = !LealtadEnvio.configured(SOLICITUD_ENDPOINT);
  sendButton.addEventListener("click", () => run(async ({ pdf, signed }) => {
    if (!signed) return "Dibuja la firma antes de enviar la solicitud. Si prefieres firmar a mano o con certificado, descarga el PDF.";
    const values = new FormData();
    values.set("nombre", field("solicitante.nombre"));
    values.set("email", field("solicitante.email"));
    values.set("consentimiento", form.elements["consentimiento.aceptado"].checked ? "aceptado" : "");
    values.set("website", field("website"));
    values.set("pdf", await pdf.saveAsBase64());
    status.textContent = "Comprobando seguridad… Si Google te pide una verificación, complétala para enviar.";
    try {
      const result = await LealtadEnvio.send(SOLICITUD_ENDPOINT, values, {
        captcha: document.querySelector("#solicitud-captcha"),
        cancel: document.querySelector("#solicitud-captcha-cancel"),
        onSending: () => { status.textContent = "Enviando la solicitud…"; },
      });
      if (result === "ok") {
        // Evita duplicados: para reenviar hay que recargar la página.
        sendButton.dataset.sent = "true";
        return "Solicitud enviada a la Hermandad. Te contestaremos al correo que has indicado. Puedes descargar también una copia del PDF.";
      }
      if (result === "timeout") return "No hemos podido confirmar el envío. Espera unos minutos antes de volver a intentarlo o escribe a contacto@lealtaddespojado.es.";
      return sendError;
    } catch (error) {
      if (error.message === "cancelled") return "Comprobación cancelada. Tus datos siguen aquí para que puedas volver a intentarlo.";
      if (error.message === "captcha") return "No se ha podido completar la comprobación de seguridad. Vuelve a intentarlo o descarga el PDF.";
      return sendError;
    }
  }));
})();
