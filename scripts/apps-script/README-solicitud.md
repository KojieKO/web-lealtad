# Activar el envío de la solicitud de ingreso

El botón **Enviar a la Hermandad** de `solicitud-ingreso.html` manda el PDF de la
solicitud desde `notificaciones@lealtaddespojado.es` a `contacto@lealtaddespojado.es`,
con el asunto `Solicitud de {Nombre}` y la dirección del solicitante en «Responder a».

Es un **proyecto de Apps Script distinto** del formulario de contacto
([README.md](README.md)): se ejecuta con la cuenta `notificaciones@`, tiene su
propia URL y no afecta al formulario de contacto. Usa el mismo transporte
(iframe y postMessage) y la misma clave de reCAPTCHA que ese formulario.

**Mientras `SOLICITUD_ENDPOINT` esté vacía en `assets/js/solicitud-pdf.js`, el
botón no aparece** y la solicitud solo se puede descargar.

## Qué hay en el repositorio

- `solicitud/Code.gs`: servidor que valida los datos y el PDF y envía el correo.
- `solicitud/appsscript.json`: permisos. Usa `MailApp` (solo enviar correo), no
  el acceso completo a Gmail que necesita el formulario de contacto.
- `solicitud/solicitud.test.mjs`: pruebas del servidor sin llamar a Google.
- `assets/js/apps-script-envio.js`: envío compartido con el formulario de contacto.

## Pasos en Google

1. **Cuenta:** `notificaciones@lealtaddespojado.es` debe ser un usuario de
   Workspace con buzón propio (no un alias ni un grupo). El script se niega a
   enviar con cualquier otra cuenta.
2. **Proyecto:** inicia sesión **con notificaciones@** en
   [Apps Script](https://script.google.com/), pulsa **Nuevo proyecto** y llámalo
   `Solicitudes web — Hermandad del Despojado`.
3. **Código:** sustituye `Código.gs` por el contenido completo de
   [solicitud/Code.gs](solicitud/Code.gs).
4. **Manifiesto:** en **Configuración del proyecto**, activa **Mostrar el archivo
   de manifiesto appsscript.json en el editor** y sustitúyelo por
   [solicitud/appsscript.json](solicitud/appsscript.json). Guarda.
5. **Clave de reCAPTCHA:** en **Configuración del proyecto → Propiedades del
   script**, añade `RECAPTCHA_SECRET_KEY` con **la misma clave secreta** que
   tiene el proyecto del formulario de contacto. No la escribas en el código ni
   la compartas por correo.
6. **Comprobación:** elige `comprobarConfiguracion` y pulsa **Ejecutar**.
   Autoriza con notificaciones@. Pedirá enviar correo en tu nombre, consultar
   tu dirección y conectarse a un servicio externo (para verificar reCAPTCHA).
   No envía nada y debe mostrar `Remitente correcto: notificaciones@lealtaddespojado.es`.
7. **Despliegue:** **Implementar → Nueva implementación → Aplicación web**.
   **Ejecutar como: Yo** (notificaciones@) y **Quién tiene acceso: Cualquier
   usuario** (anónimo). Copia la URL, que termina en `/exec`.
8. **Web:** pega esa URL entre las comillas de `SOLICITUD_ENDPOINT`, al principio
   de `assets/js/solicitud-pdf.js`, y publica la web. Es una dirección pública,
   no una contraseña.

Para actualizar el código más adelante: **Implementar → Gestionar implementaciones
→ Editar → Nueva versión**, así se conserva la URL.

## Prueba real

1. En la web publicada, rellena una solicitud con tu correo externo, dibuja la
   firma y pulsa **Enviar a la Hermandad**.
2. En contacto@ debe llegar `Solicitud de {Nombre}` **de** notificaciones@,
   con el PDF adjunto. Pulsa **Responder**: el destinatario debe ser tu correo.
3. Abre el PDF adjunto y comprueba datos y firma.

No funciona desde `localhost` ni con doble clic: el servidor solo responde a
`lealtaddespojado.es` y `www.lealtaddespojado.es`.

## Límites y datos

- Sin firma dibujada no se puede enviar: quien firme a mano o con certificado
  descarga el PDF y lo manda por su cuenta.
- El servidor solo acepta un archivo que empiece como PDF y ocupe menos de 3 MB.
  El destinatario es fijo; el solicitante no puede cambiarlo.
- El PDF contiene DNI e IBAN. No se guarda en Drive ni en registros del script:
  solo queda en los buzones de contacto@ y notificaciones@ (Enviados). Conviene
  que contacto@ no reenvíe estos correos fuera del dominio.
- El cupo diario de envíos de notificaciones@ lo comparten este formulario y
  Corregidor. Una solicitud gasta un envío.

Ejecuta las pruebas con `node --test scripts/apps-script/solicitud/solicitud.test.mjs`.
