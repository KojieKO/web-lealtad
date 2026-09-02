# Activar reCAPTCHA invisible

La nueva versión elimina del correo la frase sobre la aceptación de privacidad.
La casilla del formulario sigue siendo obligatoria, también en el servidor.

Se utiliza **reCAPTCHA v2 — Insignia de reCAPTCHA invisible**. Google comprueba
cada intento de envío y normalmente solo muestra un reto cuando detecta tráfico
sospechoso. Es protección contra automatización y spam; no determina si una
actividad es legal. [Tipos de reCAPTCHA](https://developers.google.com/recaptcha/docs/versions).

**La clave de sitio pública facilitada por la Hermandad ya está configurada.**
Antes de publicar, confirma que has guardado la clave privada en las propiedades
de Apps Script y actualizado su despliegue como se explica más abajo. No se ha
modificado el despliegue de Google ni publicado la web desde este repositorio.

## 1. Crear las claves en Google

1. Con la cuenta de Workspace de la Hermandad, abre
   [Registrar un sitio en reCAPTCHA](https://www.google.com/recaptcha/admin/create).
2. Escribe como etiqueta `Formulario de contacto — Lealtad Despojado`.
3. Selecciona **reCAPTCHA v2** y **Insignia de reCAPTCHA invisible**. Esta integración
   usa `api.js` y `siteverify`; no utiliza una clave v3 ni la integración Enterprise
   de puntuaciones o retos por políticas.
4. En dominios, añade `lealtaddespojado.es`, sin `https://` ni rutas. La configuración
   de Google cubre también `www`; el servidor admite exclusivamente el dominio
   principal y `www`. Mantén activada la validación del dominio.
5. Si Google solicita un proyecto, selecciona o crea uno de la Hermandad. Revisa
   las condiciones y cualquier opción de facturación que presente Google antes
   de registrar el sitio.
6. Copia la **clave de sitio** y la **clave secreta**. La de sitio es pública y
   puedes facilitármela para incorporarla; **no me envíes la clave secreta**.

Si la pantalla ofrece únicamente claves Enterprise o «retos basados en políticas»,
no elijas otra modalidad al azar: necesitamos una clave compatible con v2 invisible.
Los nombres de las pantallas pueden variar. Para claves gestionadas en Cloud,
Google documenta la clave secreta compatible en **Detalles de la clave → Integración
→ Usar clave heredada / Use Legacy Key**.
[Documentación de Google sobre claves y secreto heredado](https://docs.cloud.google.com/recaptcha/docs/create-key-website#find-legacy-secret-key).

## 2. Guardar la clave privada en Apps Script

1. Abre tu proyecto **Formulario de contacto** en Apps Script.
2. Ve al engranaje **Configuración del proyecto**.
3. Busca **Propiedades del script → Añadir propiedad del script**.
4. En nombre escribe exactamente `RECAPTCHA_SECRET_KEY`.
5. En valor pega la **clave secreta** de Google y guarda las propiedades.

La clave privada no se escribe en `Código.gs`, `appsscript.json`, GitHub ni el
JavaScript de la web. Quienes tengan permiso de edición del proyecto podrán
acceder a sus propiedades; el visitante no puede leerlas.

## 3. Completar la web y actualizar Google

1. En `assets/contacto.js`, `RECAPTCHA_SITE_KEY` ya contiene la **clave de sitio
   pública** facilitada. Conserva `APPS_SCRIPT_ENDPOINT`, cuya URL ya está configurada.
2. En Apps Script sustituye `Código.gs` por el contenido actualizado de
   [Code.gs](Code.gs), y `appsscript.json` por [appsscript.json](appsscript.json).
3. Guarda y ejecuta `comprobarConfiguracion`. Además de los permisos de Gmail y
   correo de la cuenta, autoriza **conectarse a un servicio externo**
   (`script.external_request`): se utiliza para verificar el token en Google.
   La función comprueba que existe la propiedad privada, sin mostrarla ni enviar
   correo; la validez de la pareja de claves se comprueba con un envío real.
4. Cuando estés preparado para publicar la web, usa **Implementar → Gestionar
   implementaciones → Editar → Nueva versión → Implementar** en el despliegue
   existente. Conserva **Ejecutar como: Yo** y el acceso anónimo. Así mantienes la URL.
5. Publica manualmente los cambios de la web. La web anterior no aporta un token,
   por lo que no puede enviar a la nueva versión del servidor. Coordina ambos
   cambios en el mismo momento y prueba con una recarga completa después.

La API de verificación recibe únicamente la clave privada y el token; el nombre,
correo, asunto y mensaje no se envían a reCAPTCHA mediante esa llamada.
El servidor exige `success: true` y comprueba el dominio devuelto por Google.
Un token rechazado, repetido, caducado o ausente impide enviar el correo.
[Verificación de reCAPTCHA](https://developers.google.com/recaptcha/docs/verify).

## 4. Probarlo

- Abre el contacto publicado, rellena los datos y acepta la privacidad.
- Pulsa **Enviar**. Primero aparece **Comprobando…** y después **Enviando…**.
  Google puede aceptar automáticamente o mostrar un reto; ambas situaciones son normales.
- Si muestra un reto, complétalo. Si cancelas o falla la comprobación, se mantienen
  los datos y puedes volver a intentarlo. También hay un botón para cancelar la
  comprobación y un tiempo límite de tres minutos.
- Verifica que llega el correo y ya no incluye la frase sobre privacidad. Comprueba
  también el destinatario del borrador al pulsar **Responder** en Gmail.
- Prueba en móvil y sin iniciar sesión en Google. No hace falta aceptar las
  cookies opcionales de Analytics o Maps para usar la protección del formulario.

El script de reCAPTCHA se carga al intentar enviar un formulario válido, después
de la casilla de privacidad. Su insignia permanece visible dentro del formulario.
No se permite enviar si Google está bloqueado o falla la verificación; se ofrece
la dirección de contacto como alternativa. El honeypot continúa activo.

La comprobación local usa sustitutos de las APIs de Google. El comportamiento del
reto real y las claves de vuestra cuenta requieren la prueba posterior a su configuración.

Comprobado en local: 63 pruebas del servidor; aceptación automática, espera,
cancelación y reintento, caducidad, fallo de carga y falta de clave pública en el
navegador. Revisado el formulario a 412 y 320 píxeles sin desbordamiento horizontal.
