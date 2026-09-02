import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import vm from "node:vm";

const code = readFileSync(new URL("Code.gs", import.meta.url), "utf8");
const visitor = {
  nombre: "María", apellidos: "García", email: "maria@example.com",
  asunto: "Consulta sobre cultos", mensaje: "Primera línea.\nSegunda línea: <b>texto</b>",
  privacidad: "aceptada", website: "", returnOrigin: "https://www.lealtaddespojado.es",
  requestId: "1234567890abcdef1234567890abcdef",
  "g-recaptcha-response": "test-only-token",
};

export function backend({
  account = "contacto@lealtaddespojado.es", aliases = [], fail = false,
  secret = "test-only-secret", captchaResult = { success: true, hostname: "www.lealtaddespojado.es" },
  verifyError = false, verifyStatus = 200, verifyBody,
} = {}) {
  const sent = [];
  const verifications = [];
  const context = vm.createContext({
    console: { warn() {}, log() {} },
    Session: { getEffectiveUser: () => ({ getEmail: () => account }) },
    GmailApp: {
      getAliases: () => aliases,
      sendEmail: (...args) => { if (fail) throw new Error("Private Google failure"); sent.push(args); },
    },
    PropertiesService: { getScriptProperties: () => ({ getProperty: (name) => name === "RECAPTCHA_SECRET_KEY" ? secret : null }) },
    UrlFetchApp: { fetch: (url, options) => {
      verifications.push({ url, options });
      if (verifyError) throw new Error("Private request failure");
      return { getResponseCode: () => verifyStatus, getContentText: () => verifyBody ?? JSON.stringify(captchaResult) };
    } },
    HtmlService: {
      XFrameOptionsMode: { ALLOWALL: "ALLOWALL" },
      createHtmlOutput: (html) => ({ html, setXFrameOptionsMode(mode) { this.mode = mode; return this; } }),
    },
  });
  vm.runInContext(code, context);
  function post(values = {}, patch = {}) {
    const parameters = Object.fromEntries(Object.entries({ ...visitor, ...values })
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [key, Array.isArray(value) ? value : [value]]));
    return context.doPost({ parameters, postData: { length: 1500 }, ...patch });
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

test("correo fijo, nombre, Reply-To, asunto y cuerpo en texto plano", () => {
  const server = backend();
  const output = server.post({ to: "attacker@example.org", cc: "attacker@example.org", bcc: "attacker@example.org", from: "attacker@example.org", replyTo: "attacker@example.org" });
  assert.equal(server.sent.length, 1);
  const [to, subject, body, options] = server.sent[0];
  assert.equal(to, "contacto@lealtaddespojado.es");
  assert.equal(subject, "Formulario web - Consulta sobre cultos");
  assert.equal(options.name, "María García (a través de la web)");
  assert.equal(options.replyTo, visitor.email);
  assert.deepEqual(Object.keys(options).sort(), ["name", "replyTo"]);
  assert.match(body, /Nombre: María García/);
  assert.ok(body.includes(visitor.mensaje));
  assert.ok(!body.includes("Política de privacidad"));
  assert.equal(result(output)[0].ok, true);
  assert.equal(result(output)[1], visitor.returnOrigin);
  assert.equal(output.mode, "ALLOWALL");
  assert.ok(!output.html.includes(visitor.email));
});

for (const name of ["nombre", "apellidos", "email", "asunto", "mensaje"]) {
  for (const value of [undefined, "", "   ", ["one", "two"]]) {
    test(`rechaza ${name} ausente, vacío o repetido: ${JSON.stringify(value)}`, () => {
      const server = backend();
      assert.equal(result(server.post({ [name]: value }))[0].ok, false);
      assert.equal(server.sent.length, 0);
    });
  }
}

for (const [name, max] of [["nombre", 80], ["apellidos", 120], ["email", 254], ["asunto", 150], ["mensaje", 5000]]) {
  test(`limita la longitud de ${name} en el servidor`, () => {
    const server = backend();
    assert.equal(result(server.post({ [name]: "a".repeat(max + 1) }))[0].ok, false);
    assert.equal(server.sent.length, 0);
  });
}

for (const values of [
  { email: "no-es-correo" }, { email: "a@b" }, { email: "a@b.com,c@d.com" },
  { email: "a@b.com\r\nBcc: victim@example.com" },
  { nombre: "María\nBcc: victim@example.com" }, { asunto: "Hola\r\nBcc: victim@example.com" },
  { mensaje: "texto\u0000oculto" },
  { privacidad: undefined }, { privacidad: "false" }, { privacidad: ["aceptada", "aceptada"] },
  { website: "https://spam.example" }, { website: undefined }, { website: ["", ""] },
]) {
  test(`rechaza correo, cabeceras, consentimiento o honeypot inválidos: ${JSON.stringify(values)}`, () => {
    const server = backend();
    assert.equal(result(server.post(values))[0].ok, false);
    assert.equal(server.sent.length, 0);
  });
}

test("rechaza cuerpo excesivo antes de enviar", () => {
  const server = backend();
  assert.equal(result(server.post({}, { postData: { length: 100001 } }))[0].ok, false);
  assert.equal(server.sent.length, 0);
});

test("no permite inyectar HTML a través del origen o el identificador", () => {
  const server = backend();
  for (const values of [
    { returnOrigin: "https://attacker.example" },
    { returnOrigin: "https://www.lealtaddespojado.es.attacker.example" },
    { requestId: '</script><script>alert("x")</script>' },
  ]) {
    assert.equal(server.post(values).html, "Solicitud no válida.");
  }
  assert.equal(server.sent.length, 0);
});

test("un fallo de Gmail produce error sin datos internos", () => {
  const server = backend({ fail: true });
  const output = server.post();
  assert.equal(result(output)[0].ok, false);
  assert.ok(!output.html.includes("Private"));
  assert.equal(server.sent.length, 0);
});

test("acepta un alias autorizado del dominio y fija from", () => {
  const server = backend({ account: "secretaria@lealtaddespojado.es", aliases: ["contacto@lealtaddespojado.es"] });
  assert.equal(result(server.post())[0].ok, true);
  assert.equal(server.sent[0][3].from, "contacto@lealtaddespojado.es");
});

test("impide enviar con una cuenta o alias no autorizados", () => {
  for (const account of ["secretaria@lealtaddespojado.es", "personal@gmail.com"]) {
    const server = backend({ account });
    assert.equal(result(server.post())[0].ok, false);
    assert.equal(server.sent.length, 0);
  }
});

test("GET y la comprobación de configuración nunca envían correo", () => {
  const server = backend();
  server.context.doGet();
  server.context.comprobarConfiguracion();
  assert.equal(server.sent.length, 0);
});

test("verifica el token en Google mediante POST y mantiene la clave fuera de la respuesta", () => {
  const server = backend();
  const output = server.post();
  assert.equal(server.verifications.length, 1);
  const { url, options } = server.verifications[0];
  assert.equal(url, "https://www.google.com/recaptcha/api/siteverify");
  assert.equal(options.method, "post");
  assert.equal(options.payload.response, visitor["g-recaptcha-response"]);
  assert.equal(options.payload.secret, "test-only-secret");
  assert.equal(options.followRedirects, false);
  assert.ok(!output.html.includes("test-only"));
});

for (const token of [undefined, "", "  ", ["a", "b"], "a".repeat(10001)]) {
  test(`impide enviar sin token único y válido (${typeof token}, ${token?.length ?? 0})`, () => {
    const server = backend();
    assert.equal(result(server.post({ "g-recaptcha-response": token }))[0].ok, false);
    assert.equal(server.verifications.length, 0);
    assert.equal(server.sent.length, 0);
  });
}

for (const options of [
  { secret: "" }, { verifyError: true }, { verifyStatus: 503 }, { verifyBody: "no es JSON" },
  { captchaResult: { success: false, "error-codes": ["timeout-or-duplicate"] } },
  { captchaResult: { success: "true", hostname: "www.lealtaddespojado.es" } },
  { captchaResult: { success: true } },
  { captchaResult: { success: true, hostname: "attacker.example" } },
  { captchaResult: { success: true, hostname: "www.lealtaddespojado.es.attacker.example" } },
]) {
  test(`rechaza CAPTCHA ausente, falso, caducado o de otro dominio: ${JSON.stringify(options)}`, () => {
    const server = backend(options);
    assert.equal(result(server.post())[0].ok, false);
    assert.equal(server.sent.length, 0);
  });
}

test("acepta también la comprobación realizada en el dominio sin www", () => {
  const server = backend({ captchaResult: { success: true, hostname: "lealtaddespojado.es" } });
  assert.equal(result(server.post())[0].ok, true);
  assert.equal(server.sent.length, 1);
});

test("los bots del honeypot se rechazan antes de consultar reCAPTCHA", () => {
  const server = backend();
  assert.equal(result(server.post({ website: "bot" }))[0].ok, false);
  assert.equal(server.verifications.length, 0);
});

test("la comprobación de configuración detecta la falta de clave privada", () => {
  assert.throws(() => backend({ secret: "" }).context.comprobarConfiguracion(), /RECAPTCHA_SECRET_KEY/);
});
