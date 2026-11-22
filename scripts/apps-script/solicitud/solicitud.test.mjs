import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const code = readFileSync(new URL("Code.gs", import.meta.url), "utf8");
const pdfBase64 = Buffer.from("%PDF-1.7\nprueba").toString("base64");
const applicant = {
  nombre: "María José Fernández", email: "maria@example.com", consentimiento: "aceptado",
  website: "", pdf: pdfBase64, returnOrigin: "https://www.lealtaddespojado.es",
  requestId: "1234567890abcdef1234567890abcdef", "g-recaptcha-response": "test-only-token",
};

function backend({ account = "notificaciones@lealtaddespojado.es", fail = false, secret = "test-only-secret",
  captchaResult = { success: true, hostname: "www.lealtaddespojado.es" } } = {}) {
  const sent = [];
  const verifications = [];
  const context = vm.createContext({
    console: { warn() {}, log() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => account }) },
    MailApp: {
      getRemainingDailyQuota: () => 1500,
      sendEmail: (...args) => { if (fail) throw new Error("Private Google failure"); sent.push(args); },
    },
    Utilities: {
      // Como en Apps Script: bytes con signo de Java.
      base64Decode: (value) => Array.from(Buffer.from(value, "base64"), (byte) => byte > 127 ? byte - 256 : byte),
      newBlob: (bytes, type, name) => ({ bytes, type, name }),
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (name) => name === "RECAPTCHA_SECRET_KEY" ? secret : null }) },
    UrlFetchApp: { fetch: (url, options) => {
      verifications.push({ url, options });
      return { getResponseCode: () => 200, getContentText: () => JSON.stringify(captchaResult) };
    } },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
      createHtmlOutput: (html) => ({ html, setXFrameOptionsMode(mode) { this.mode = mode; return this; } }),
    },
  });
  vm.runInContext(code, context);
  function post(values = {}, patch = {}) {
    const parameters = Object.fromEntries(Object.entries({ ...applicant, ...values })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value : [value]]));
    return context.doPost({ parameters, postData: { length: 5000 }, ...patch });
  }
  return { post, sent, context, verifications };
}

function result(output) {
  const calls = [];
  vm.runInNewContext(output.html.match(/<script>(.*?)<\/script>/s)[1], {
    window: { top: { postMessage: (...args) => calls.push(args) } },
  });
  return calls[0];
}

test("envía el PDF a contacto@ con asunto, Reply-To y destinatario fijos", () => {
  const server = backend();
  const output = server.post({ to: "attacker@example.org", cc: "attacker@example.org", replyTo: "attacker@example.org" });
  assert.equal(server.sent.length, 1);
  const [to, subject, body, options] = server.sent[0];
  assert.equal(to, "contacto@lealtaddespojado.es");
  assert.equal(subject, "Solicitud de María José Fernández");
  assert.equal(options.replyTo, applicant.email);
  assert.deepEqual([...Object.keys(options)].sort(), ["attachments", "htmlBody", "name", "replyTo"]);
  assert.match(options.htmlBody, /<b>Solicitante:<\/b> María José Fernández<br><b>Correo electrónico:<\/b> maria@example\.com/);
  assert.equal(options.attachments[0].type, "application/pdf");
  assert.equal(options.attachments[0].name, "Solicitud de ingreso - María José Fernández.pdf");
  assert.equal(Buffer.from(options.attachments[0].bytes.map((b) => b & 255)).toString(), "%PDF-1.7\nprueba");
  assert.match(body, /Solicitante: María José Fernández/);
  assert.deepEqual({ ...result(output)[0] }, { type: "lealtad-contact-result", requestId: applicant.requestId, ok: true });
  assert.equal(result(output)[1], applicant.returnOrigin);
  assert.equal(output.mode, "ALLOWALL");
  assert.ok(!output.html.includes(applicant.email));
});

test("limpia del nombre de archivo los caracteres no válidos", () => {
  const server = backend();
  server.post({ nombre: 'Ana / "Test" <x>' });
  assert.equal(server.sent[0][3].attachments[0].name, "Solicitud de ingreso - Ana  Test x.pdf");
});

test("escapa los datos del solicitante en la versión HTML", () => {
  const server = backend();
  server.post({ nombre: '<img src=x onerror="alert(1)"> & Ana' });
  const { htmlBody } = server.sent[0][3];
  assert.ok(!htmlBody.includes("<img"));
  assert.match(htmlBody, /<b>Solicitante:<\/b> &lt;img src=x onerror=&quot;alert\(1\)&quot;&gt; &amp; Ana/);
});

for (const values of [
  { nombre: undefined }, { nombre: "" }, { nombre: ["a", "b"] }, { nombre: "a".repeat(151) },
  { nombre: "Ana\r\nBcc: x@example.org" }, { email: "no-es-correo" }, { email: undefined },
  { consentimiento: undefined }, { consentimiento: "no" }, { website: "http://spam" }, { website: undefined },
  { pdf: undefined }, { pdf: "" }, { pdf: ["a", "b"] }, { pdf: "no es base64!" },
  { pdf: Buffer.from("<html>no es un PDF</html>").toString("base64") },
  { pdf: "A".repeat(Math.ceil(3 * 1024 * 1024 / 3) * 4 + 4) },
]) {
  test(`rechaza datos no válidos: ${JSON.stringify(values).slice(0, 80)}`, () => {
    const server = backend();
    const output = server.post(values);
    assert.equal(server.sent.length, 0);
    assert.equal(result(output)[0].ok, false);
  });
}

test("rechaza cuerpo excesivo antes de enviar", () => {
  const server = backend();
  assert.equal(result(server.post({}, { postData: { length: 7 * 1024 * 1024 } }))[0].ok, false);
  assert.equal(server.sent.length, 0);
});

test("origen o identificador no válidos no devuelven script", () => {
  for (const values of [{ returnOrigin: "https://evil.example" }, { requestId: "</script><script>alert(1)//" }]) {
    const output = backend().post(values);
    assert.equal(output.html, "Solicitud no válida.");
  }
});

for (const options of [
  { secret: null }, { captchaResult: { success: false } },
  { captchaResult: { success: true, hostname: "evil.example" } },
]) {
  test(`rechaza CAPTCHA ausente, falso o de otro dominio: ${JSON.stringify(options)}`, () => {
    const server = backend(options);
    assert.equal(result(server.post())[0].ok, false);
    assert.equal(server.sent.length, 0);
  });
}

test("los bots del honeypot se rechazan antes de consultar reCAPTCHA", () => {
  const server = backend();
  server.post({ website: "spam" });
  assert.equal(server.verifications.length, 0);
});

test("solo envía desde notificaciones@", () => {
  const server = backend({ account: "contacto@lealtaddespojado.es" });
  assert.equal(result(server.post())[0].ok, false);
  assert.equal(server.sent.length, 0);
  assert.throws(() => server.context.comprobarConfiguracion(), /notificaciones@/);
});

test("un fallo de envío produce error sin datos internos", () => {
  const output = backend({ fail: true }).post();
  assert.equal(result(output)[0].ok, false);
  assert.ok(!output.html.includes("Private"));
});

test("GET y la comprobación de configuración nunca envían correo", () => {
  const server = backend();
  assert.match(server.context.doGet().html, /Servicio de solicitudes/);
  server.context.comprobarConfiguracion();
  assert.equal(server.sent.length, 0);
  assert.throws(() => backend({ secret: null }).context.comprobarConfiguracion(), /RECAPTCHA_SECRET_KEY/);
});
