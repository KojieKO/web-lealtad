# Activar el formulario con Google Workspace

El código de la web y del servidor está preparado. **La URL del despliegue
facilitada por la Hermandad ya está configurada en `APPS_SCRIPT_ENDPOINT`.**
Quedan pendientes la publicación de la web y la prueba real de recepción y
«Responder» en Gmail. Los pasos siguientes sirven también para futuras actualizaciones.

## Qué está preparado en el repositorio

- `contacto.html`: formulario con sus campos originales, privacidad y estados accesibles.
- `assets/contacto.js`: envío y confirmación dentro de la página; configuración pública al principio.
- `scripts/apps-script/Code.gs`: servidor que valida y envía a `contacto@lealtaddespojado.es`.
- `scripts/apps-script/appsscript.json`: permisos y configuración del proyecto de Google.

No hay claves, contraseñas, bases de datos, bibliotecas nuevas ni correo automático
al visitante. GitHub Pages sirve la web; el archivo `.gs` solo se ejecuta en Google.

## Lo que debes hacer en Google

1. **Cuenta:** utiliza preferentemente `contacto@lealtaddespojado.es`, si es un
   usuario de Workspace con buzón propio. Si es un alias, utiliza la cuenta de
   `@lealtaddespojado.es` que lo tenga autorizado en Gmail, en **Configuración →
   Ver todos los ajustes → Cuentas → Enviar como**. Ser un grupo, recibir correo
   o tener un alias de recepción no garantiza que se pueda enviar como esa
   dirección: debe estar autorizado para enviar. El script comprueba este punto.
   [Ayuda de Google sobre remitentes y alias](https://support.google.com/mail/answer/22370?hl=es).
2. **Proyecto:** inicia sesión con esa cuenta en [Apps Script](https://script.google.com/)
   y pulsa **Nuevo proyecto**. Nómbralo `Contacto web — Hermandad del Despojado`.
3. **Código:** sustituye el contenido de `Código.gs` / `Code.gs` por el contenido
   completo de [Code.gs](Code.gs). No lo pegues en el HTML de la web.
4. **Configuración:** en el engranaje **Configuración del proyecto**, activa
   **Mostrar el archivo de manifiesto appsscript.json en el editor**. Vuelve al
   editor y sustituye ese archivo por [appsscript.json](appsscript.json). Guarda.
5. **Permisos y comprobación:** elige `comprobarConfiguracion` en el selector de
   funciones y pulsa **Ejecutar**. Autoriza con la cuenta indicada. GmailApp pide
   el permiso amplio de Gmail (`https://mail.google.com/`), aunque este código
   solo consulta alias y envía mensajes; también pide consultar el correo de la
   cuenta (`userinfo.email`). No solicita Drive, Sheets ni contactos. La
   comprobación no manda correo y debe mostrar `Remitente autorizado: contacto@lealtaddespojado.es`.
   Si aparece un error de remitente, corrige la cuenta o su alias antes de seguir.
   [Permisos y opciones de GmailApp](https://developers.google.com/apps-script/reference/gmail/gmail-app#sendemailrecipient,-subject,-body,-options).
6. **Revisa antes de publicar:** confirma el código, el remitente y las condiciones
   aplicables a Apps Script/Workspace en vuestra organización. El siguiente paso
   hace público el endpoint; hazlo cuando hayas terminado la revisión.
7. **Despliegue:** pulsa **Implementar → Nueva implementación** (en inglés,
   **Deploy → New deployment**). En el selector de tipo, elige **Aplicación web**.
   En **Ejecutar como**, elige **Yo**, comprobando la cuenta. En **Quién tiene
   acceso**, elige **Cualquier usuario / Anyone**, con acceso anónimo, sin exigir
   cuenta de Google. No elijas la opción limitada a cuentas de Google o al dominio.
   Pulsa **Implementar** y completa la autorización si vuelve a solicitarse.
   Si la política de Workspace no permite acceso anónimo, debe revisarlo el
   administrador; una aplicación que exige iniciar sesión no sirve para este formulario.
   [Despliegue y ejecución de aplicaciones web](https://developers.google.com/apps-script/guides/web).
   La configuración equivalente es `USER_DEPLOYING` y `ANYONE_ANONYMOUS`, según
   [la referencia de Google](https://developers.google.com/apps-script/manifest/web-app-api-executable).
8. **URL:** copia la **URL de la aplicación web** de la ventana del despliegue.
   Debe empezar por `https://script.google.com/macros/s/` y terminar en `/exec`.
   No copies el identificador solo, la dirección del editor ni una URL `/dev`.
9. **Web:** abre `assets/contacto.js` y pega la URL entre las comillas de
   `APPS_SCRIPT_ENDPOINT` (el despliegue actual ya está configurado). Es una dirección pública, no una contraseña.
   No introduzcas tokens. Publica los cambios de la web por el procedimiento
   habitual de GitHub Pages cuando hayas revisado el conjunto.

Los nombres de los botones pueden variar con el idioma. Se ha contrastado la
documentación oficial el 2 de septiembre de 2026; no se ha inspeccionado la consola
privada de vuestra organización.

## Prueba real y comprobación de «Responder»

1. Abre `https://www.lealtaddespojado.es/contacto.html` en una ventana privada,
   sin iniciar sesión en Google. Usa también un móvil. Rechazar las cookies
   opcionales debe permitir seguir enviando el formulario.
2. Introduce tu nombre y apellidos, una dirección externa que controles, un asunto
   reconocible (`Prueba del formulario`) y un mensaje. Acepta la privacidad.
3. Pulsa **Enviar** una sola vez. Debes ver **Enviando…**, con el botón desactivado.
   Al confirmarse el envío, aparece el mensaje de éxito y se limpian los campos.
   La barra de direcciones debe seguir en la web de la Hermandad.
4. En Gmail de contacto, busca el correo (revisa también spam y todos los mensajes).
   Abre los detalles del remitente y verifica:
   - **De:** tu nombre y apellidos `(a través de la web) <contacto@lealtaddespojado.es>`.
   - **Para:** `contacto@lealtaddespojado.es`.
   - **Responder a:** la dirección externa que escribiste.
   - **Asunto:** `Formulario web - Prueba del formulario`.
   Comprueba que el cuerpo conserva todos los campos, acentos y saltos de línea.
   Gmail puede mostrar un nombre guardado en Contactos: los detalles y **Mostrar
   original** permiten comprobar las cabeceras reales `From`, `To` y `Reply-To`.
5. Pulsa **Responder** en ese correo. El destinatario del borrador debe ser la
   dirección externa del formulario; no hace falta enviar la respuesta para probarlo.
6. Prueba a dejar un campo vacío, escribir un correo incorrecto y no aceptar la
   privacidad: el navegador debe impedir el envío. Comprueba con teclado que
   puedes recorrer los campos, abrir la política y activar la casilla y el botón.
7. Para probar un fallo real sin cambiar el despliegue, carga el formulario,
   desconecta la red antes de enviarlo y espera hasta 60 segundos. Debe avisar de
   que no puede confirmar el envío, conservar lo escrito y habilitar el botón.
   Reconecta la red. No se reintenta automáticamente: un fallo de confirmación
   puede ocurrir después de que Google haya enviado el correo.
8. En **Ejecuciones** del proyecto puedes comprobar que se ejecuta `doPost`.
   Abrir `/exec` directamente solo muestra una descripción, nunca envía mensajes.

Hasta completar esta prueba **no está verificada la entrega real ni el Reply-To
en vuestro Gmail**, ni las restricciones concretas de la cuenta o del navegador.

## Por qué este envío evita los problemas de CORS

El navegador envía un **POST de formulario normal** (`application/x-www-form-urlencoded`)
a un `iframe` oculto. No hace `fetch`, no añade cabeceras que provoquen preflight
y no intenta leer una respuesta HTTP de otro origen. Las redirecciones de Google
ocurren dentro de ese marco, no en la página visible.

`doPost` devuelve HTML mediante `HtmlService`, con
`XFrameOptionsMode.ALLOWALL`, necesario para incrustar la respuesta. El HTML solo
contiene una confirmación sin datos personales. Google ejecuta ese HTML en su
propio marco anidado; `window.top.postMessage` entrega el resultado a la página de
la Hermandad. La web comprueba el origen de Google, el tipo de mensaje y un
identificador aleatorio de 128 bits que corresponde al envío en curso. El destino
de la confirmación es un origen explícito de nuestra lista; nunca `*`.
[Incrustación con HtmlService](https://developers.google.com/apps-script/reference/html/x-frame-options-mode),
[sandbox de Google](https://developers.google.com/apps-script/guides/html/restrictions)
y [comunicación entre ventanas](https://developer.mozilla.org/en-US/docs/Web/API/Window/postMessage).

La carga del marco, un HTTP 200 o una respuesta opaca **no se consideran éxito**.
Solo se anuncia éxito si el servidor informa de que `GmailApp.sendEmail` terminó.
Eso confirma que Google aceptó el envío, no que se haya entregado a la bandeja de
entrada. El tiempo límite también cubre fallos de red, permisos incorrectos o
bloqueo del marco. No usamos JSONP ni `fetch` con `mode: "no-cors"`.
[Google documenta las redirecciones de ContentService](https://developers.google.com/apps-script/guides/content#redirects);
esta solución usa HtmlService y no depende de leerlas mediante CORS.

## Límites y mantenimiento

- El destinatario y el remitente técnico están fijados en el servidor. Cualquier
  parámetro adicional `to`, `cc`, `bcc`, `from` o `replyTo` enviado desde el navegador
  se ignora. El correo del visitante se usa únicamente como `replyTo` validado.
- Se valida también en Google: campos obligatorios, longitudes máximas, correo,
  consentimiento, controles no permitidos y parámetros duplicados. Se conserva
  Apellidos como campo obligatorio, igual que en el formulario original.
- El honeypot se oculta a la vista, al teclado y a los lectores de pantalla.
  Rellenarlo, omitirlo o repetirlo impide el envío en el servidor. El cuerpo del
  correo es texto plano, sin HTML del visitante.
- El endpoint es público. La lista de orígenes dirige la respuesta, **no autentica
  solicitudes**: un bot puede falsificar ese parámetro y eludir el honeypot. Esta
  protección inicial no detiene un ataque dirigido; el buzón aún puede recibir
  spam. No se envía a direcciones arbitrarias ni se crean respuestas automáticas.
  Si aparece abuso, revisa las ejecuciones y añade un límite de frecuencia antes
  de valorar un CAPTCHA. Se aplican las [cuotas vigentes de Apps Script](https://developers.google.com/apps-script/guides/services/quotas).
- No se guardan mensajes en bases de datos, archivos ni registros del script.
  Google sí procesa el envío y el correo se conserva en los buzones según vuestra
  configuración. Los registros de error de este código no incluyen el contenido.
- Para actualizar Google: guarda los cambios y usa **Implementar → Gestionar
  implementaciones → Editar → Nueva versión → Implementar** sobre el despliegue
  existente. Así conservas la URL. Guardar `Code.gs` no actualiza por sí solo `/exec`.
- Para pruebas locales con Google, añade temporalmente el origen exacto del
  servidor local a `ALLOWED_ORIGINS` y despliega una versión de prueba. Elimina ese
  origen al terminar. Abrir el archivo con doble clic (`file://`) no sirve para
  probar el envío real. No añadas `*` ni `null` a la lista.

## Comprobaciones del repositorio

Ejecuta `node --test scripts/apps-script/contacto.test.mjs` si tienes Node instalado.
No instala dependencias ni llama a Google. Comprueba el servidor con sustitutos de
las APIs de Google; las pruebas locales no sustituyen la prueba real de arriba.

Verificación realizada el 2 de septiembre de 2026:

- La URL real facilitada por la Hermandad responde sin iniciar sesión. Un POST
  incompleto con el honeypot relleno devuelve la confirmación de error prevista,
  sin cabecera `X-Frame-Options` que impida incrustarla. Esta prueba no envía correo.
- 45 pruebas del servidor superadas, incluidos destinatario manipulado, alias,
  consentimiento, honeypot, campos duplicados, inyección de cabeceras y error de Gmail.
- En navegador: POST entre tres orígenes locales, redirección HTTP 303 y respuesta
  desde un marco anidado con sandbox; éxito, error, espera de 60 segundos y rechazo
  de origen o identificador incorrectos. Sin navegación de la página principal.
- Botón bloqueado durante el envío, datos conservados tras error, campos vaciados
  tras éxito, validación y recorrido por teclado sin entrar en el honeypot.
- Aspecto revisado en escritorio (1440 px) y móvil (412 px), sin desbordamiento
  horizontal ni errores de consola en la prueba móvil.
- Pendiente: publicación de la web, prueba anónima en el dominio publicado,
  recepción del correo y comprobación de «Responder» en vuestro Gmail.
