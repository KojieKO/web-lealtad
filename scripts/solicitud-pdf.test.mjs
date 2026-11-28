// Ejecuta assets/js/solicitud-pdf.js con la plantilla real y comprueba el adjunto solicitud.json.
// node --test scripts/solicitud-pdf.test.mjs   (SOLICITUD_PDF_OUT=ruta.pdf guarda el PDF del mayor de edad)
import assert from "node:assert/strict";
import { readFileSync, writeFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const root = new URL("../", import.meta.url);
const read = (path) => readFileSync(new URL(path, root));

const base = {
  "solicitante.nombre": "  María José Fernández  ", "solicitante.dniNie": "12345678Z",
  "solicitante.domicilio": "Calle Larga", "solicitante.numero": "3", "solicitante.piso": "2º B",
  "solicitante.codigoPostal": "06800", "solicitante.localidad": "Mérida", "solicitante.telefono": "600000000",
  "solicitante.email": "maria@example.com", "solicitante.whatsapp": true,
  "solicitante.lugarNacimiento": "Mérida", "solicitante.provinciaNacimiento": "Badajoz",
  "bautismo.parroquia": "Santa Eulalia", "bautismo.localidad": "Mérida", "bautismo.fecha": "1990-06-01",
  "bautismo.declaracionIngresoAceptada": true, "cuota.importe": "20", "cuota.periodicidad": "anual",
  "cuenta.entidadBancaria": "Banco de Prueba", "cuenta.titularEsSolicitante": false, "cuenta.titular": "Ana Fernández",
  "cuenta.dniTitular": "00000000T", "cuenta.iban": "ES9121000418450200051332",
  "consentimiento.mayor.nombre": "María José Fernández", "consentimiento.mayor.dniNie": "12345678Z",
  "consentimiento.mayor.lugar": "Mérida", "consentimiento.mayor.fecha": "2026-11-22",
  "consentimiento.representante.nombre": "Pedro Fernández", "consentimiento.representante.dniNie": "11111111H",
  "consentimiento.representante.calidad": "Padre", "consentimiento.representante.menorNombre": "María José Fernández",
  "consentimiento.representante.lugar": "Mérida", "consentimiento.representante.fecha": "2026-11-22",
  "consentimiento.aceptado": true, website: "spam", "g-recaptcha-response": "token",
};

async function download(values) {
  const elements = Object.entries(values).map(([name, value]) => typeof value === "boolean"
    ? { name, type: "checkbox", checked: value, value: "on" } : { name, type: "text", value });
  for (const element of elements) elements[element.name] = element;
  const button = () => ({ dataset: {}, addEventListener(type, fn) { this.onClick = fn; } });
  const canvas = { dataset: { signed: "true" }, toDataURL: () => "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==" };
  const nodes = {
    "#solicitud-form": { elements, reportValidity: () => true },
    "#descargar-pdf": button(), "#enviar-solicitud": button(), "#form-status": { focus() {} },
    "#firma-mayor canvas": canvas, "#firma-menor canvas": canvas,
  };
  let saved;
  const context = vm.createContext({
    document: { querySelector: (s) => nodes[s], createElement: () => ({ click() {} }) },
    location: { protocol: "https:" }, TextEncoder, setTimeout: (fn, ms) => setTimeout(fn, ms).unref(), // pdf-lib lo usa; el del enlace de descarga no debe retener node
    Uint8Array, ArrayBuffer, // mismo reino que Buffer y TextEncoder, para los instanceof de pdf-lib
    fetch: async () => ({ ok: true, arrayBuffer: async () => read("documentos/solicitud-base-local.pdf") }),
    Blob: class { constructor([bytes]) { saved = bytes; } },
    URL: { createObjectURL: () => "blob:", revokeObjectURL() {} },
    LealtadEnvio: { configured: () => false },
  });
  context.self = context;
  vm.runInContext(read("assets/js/pdf-lib.min.js").toString(), context);
  vm.runInContext(read("assets/js/solicitud-pdf.js").toString(), context);
  await nodes["#descargar-pdf"].onClick();
  const status = nodes["#form-status"].textContent;
  assert.match(status, /^PDF generado/, status);
  return { bytes: saved, PDFLib: context.PDFLib };
}

async function attachment({ bytes, PDFLib }) {
  const { PDFName, PDFArray, PDFDict, PDFHexString, PDFString } = PDFLib;
  const pdf = await PDFLib.PDFDocument.load(bytes);
  assert.equal(pdf.getPageCount(), 2);
  const files = pdf.catalog.lookup(PDFName.of("Names"), PDFDict).lookup(PDFName.of("EmbeddedFiles"), PDFDict)
    .lookup(PDFName.of("Names"), PDFArray);
  assert.equal(files.size(), 2, "un único adjunto");
  assert.equal(files.lookup(0, PDFString, PDFHexString).decodeText(), "solicitud.json");
  const spec = files.lookup(1, PDFDict);
  assert.equal(spec.lookup(PDFName.of("Desc"), PDFString, PDFHexString).decodeText(), "Datos de la solicitud para Corregidor");
  const stream = spec.lookup(PDFName.of("EF"), PDFDict).lookup(PDFName.of("F"));
  assert.equal(stream.dict.lookup(PDFName.of("Subtype")).toString(), "/application#2Fjson");
  // pdf-lib guarda el adjunto comprimido con Flate.
  return JSON.parse(new TextDecoder().decode(PDFLib.decodePDFRawStream(stream).decode()));
}

function checkCommon(data) {
  assert.equal(data.formato, "solicitud-ingreso");
  assert.equal(data.version, 1);
  assert.match(data.generado, /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/);
  assert.equal(data["solicitante.nombre"], "María José Fernández");
  assert.equal(data["solicitante.whatsapp"], true);
  assert.equal(data["cuenta.titularEsSolicitante"], false);
  assert.equal(data["cuota.periodicidad"], "anual");
  assert.equal(data["bautismo.fecha"], "1990-06-01");
  assert.equal(data["consentimiento.aceptado"], true);
  assert.ok(!("website" in data) && !("g-recaptcha-response" in data));
  assert.ok(!JSON.stringify(data).includes("data:image"), "sin firma");
}

test("mayor de edad: adjunto con los campos del firmante mayor", async () => {
  const built = await download({ ...base, "solicitante.fechaNacimiento": "1990-05-01" });
  const data = await attachment(built);
  checkCommon(data);
  assert.equal(data["solicitante.fechaNacimiento"], "1990-05-01");
  assert.equal(data["consentimiento.mayor.fecha"], "2026-11-22");
  assert.ok(!Object.keys(data).some((k) => k.startsWith("consentimiento.representante.")));
  if (process.env.SOLICITUD_PDF_OUT) writeFileSync(process.env.SOLICITUD_PDF_OUT, built.bytes);
});

test("menor de 14 años: adjunto con los campos del representante", async () => {
  const data = await attachment(await download({ ...base, "solicitante.fechaNacimiento": "2020-01-01" }));
  checkCommon(data);
  assert.equal(data["consentimiento.representante.calidad"], "Padre");
  assert.ok(!Object.keys(data).some((k) => k.startsWith("consentimiento.mayor.")));
});
