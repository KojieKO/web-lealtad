# Guía fácil para editar la web

No necesitas saber programación. Para la mayoría de cambios solo tendrás que
buscar un texto, sustituirlo y guardar el archivo.

## Antes de empezar

1. Haz una copia del archivo que vas a modificar. Por ejemplo, copia
   `agenda.html` como `agenda-copia.html` fuera de la carpeta del proyecto.
2. Abre el archivo original con un editor de texto. Visual Studio Code es cómodo,
   pero también sirve el Bloc de notas.
3. No uses Word: puede añadir formato invisible y estropear el archivo.
4. Cambia únicamente el texto indicado en esta guía.

## Regla de oro

En el código verás elementos como este:

```html
<h3>Comida benéfica</h3>
```

Puedes cambiar lo que hay **entre** `>` y `<`:

```html
<h3>Convivencia de Navidad</h3>
```

No borres los símbolos `<`, `>`, `/` ni las palabras que están dentro de ellos.

## Cambiar contenido habitual

### Nombre, escudo u opciones del menú

La cabecera se comparte entre todas las páginas. Abre `assets/header.js` y busca
el título `CABECERA COMPARTIDA`. Un cambio realizado allí aparecerá en toda la
web. No copies la cabecera dentro de los archivos HTML.

En cada página solo verás una línea similar a esta:

```html
<site-header active="titulares"></site-header>
```

No cambies esa línea salvo que quieras marcar otra opción del menú como activa.

### Próximo encuentro de la portada

Abre `index.html` y busca `Próximo encuentro`. Cerca encontrarás:

```html
<time datetime="2026-11-30"><strong>30</strong><span>NOV<br>2026</span></time>
```

- `2026-11-30` es la fecha en formato año-mes-día.
- `30` es el día visible.
- `NOV` es el mes visible.
- `2026` es el año visible.
- Cambia también el título y la descripción que aparecen justo después.

### Agenda y cultos

Abre `editable/agenda.md`. Los actos están en una tabla y cada fila es un evento. Para
añadir otro, copia una fila completa, pégala en orden cronológico y cambia sus
datos. Las fechas de `Inicio` y `Fin` usan el formato `AAAA-MM-DD`; si el acto
dura un solo día, puedes dejar `Fin` vacío. Al publicar en GitHub, la web se
actualiza automáticamente sin tocar `agenda.html` ni ningún archivo JavaScript.

### Junta de Gobierno

Abre `editable/junta.md`. Cada fila de la tabla contiene un cargo y el nombre de
la persona que lo ocupa. Para añadir otra persona, copia una fila completa y
cambia sus dos datos; para quitarla, borra su fila. Al publicar en GitHub,
`hermandad.html` se actualiza automáticamente.

### Cronología de la Hermandad

Abre `editable/crono.md`. Cada fila es un hito y contiene el año, el título y la
descripción. Puedes añadir, cambiar, reordenar o borrar filas. Conserva siempre
las tres columnas y las barras verticales `|` que las separan. Para enlazar una
página escribe `[texto visible](pagina.html)`. La web se actualiza automáticamente
al publicar en GitHub.

### Datos de los Titulares

Abre `titulares.html`. Busca `Información por completar` o `Espacio para
desarrollar` y sustituye únicamente esos textos. Las tres fichas están separadas
en bloques que empiezan por `<article class="titular-detail"`.

### Teléfono, correo y dirección

Abre `contacto.html` y busca `Datos de contacto`. Al cambiar un correo, cambia
también el texto y el valor que empieza por `mailto:`:

```html
<a href="mailto:nuevo@correo.es">nuevo@correo.es</a>
```

El destinatario del formulario está fijado en `scripts/apps-script/Code.gs`.
La URL de su aplicación web se configura en `APPS_SCRIPT_ENDPOINT`, al principio
de `assets/contacto.js`. Sigue [la guía de configuración](../scripts/apps-script/README.md)
para activar o actualizar el envío con Google Workspace.

### Enlaces pendientes

Busca `href="#"` en todos los archivos. `#` significa que el enlace todavía no
tiene destino. Sustitúyelo por la dirección completa, incluyendo `https://`, o
por el nombre de un archivo local, como `solicitud-hermano.pdf`.

## Añadir una fotografía

1. Guarda la imagen dentro de `assets` con un nombre corto, sin espacios ni
   tildes, por ejemplo `titular-jesus.jpg`.
2. Busca el recuadro provisional, por ejemplo:

```html
<div class="photo">Fotografía de Nuestro Padre Jesús</div>
```

3. Sustitúyelo por:

```html
<div class="photo"><img src="assets/titular-jesus.jpg" alt="Nuestro Padre Jesús de la Lealtad Despojado"></div>
```

El texto `alt` debe describir brevemente la fotografía. No lo dejes vacío salvo
que la imagen sea puramente decorativa.

## Cambiar colores (opcional)

Abre `assets/css/01-base.css` y busca `:root`. Ahí están los colores
principales:

- `--green`: verde principal.
- `--green-dark`: verde oscuro del pie.
- `--gold`: dorado principal.
- `--paper`: color crema de algunos fondos.

Los colores usan códigos como `#2e482b`. Cambia solo el código, manteniendo el
signo `#` y el punto y coma final.

## Encontrar otros estilos (edición avanzada)

`assets/styles.css` es ahora un índice corto. No contiene todos los estilos:
los carga en el orden correcto desde la carpeta `assets/css/`.

- `01-base.css`: colores, tipografías y estilos básicos.
- `02-brand-footer.css`: marca y pie de página.
- `03-page-layout.css`: estructura compartida de las páginas.
- `04-content-elements.css`: tablas, cronologías y contenido compartido.
- `05-responsive-content.css`: ajustes para pantallas estrechas.
- `06-navigation-frame.css`: navegación y marco exterior.
- `07-layout-refinements.css`: medidas y espaciado finales.
- `pages/`: estilos propios de cada apartado.

No cambies el orden de las líneas `@import` de `assets/styles.css`. Si buscas
un estilo de una página concreta, empieza por el archivo con su nombre dentro
de `assets/css/pages/`.

## Comprobar el resultado

1. Guarda el archivo.
2. Abre `index.html` en el navegador y pulsa `F5`.
3. Visita todas las páginas desde el menú.
4. Comprueba también el tamaño móvil estrechando la ventana.
5. Revisa que no haya textos provisionales buscando: `pendiente`, `por completar`,
   `provisional` y `href="#"`.

Si algo se rompe, restaura la copia del archivo y repite el cambio con más
cuidado. Un texto modificado no debería requerir cambios en `assets/script.js`.
