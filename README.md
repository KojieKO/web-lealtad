# Web de la Hermandad de la Lealtad

Esta es una web estática: no necesita base de datos ni un programa especial para
editarla. Los textos se cambian directamente en los archivos `.html`.

## Quiero cambiar algo

Empieza por **[GUIA-EDICION.md](GUIA-EDICION.md)**. La guía explica, paso a paso y
sin asumir conocimientos web, cómo cambiar textos, fechas, enlaces, fotografías,
datos de contacto y miembros de la Junta de Gobierno.

## Mapa rápido del proyecto

| Archivo | Qué contiene |
| --- | --- |
| `index.html` | Portada y próximo encuentro |
| `hermandad.html` | Historia, Junta, reglas y hábito |
| `titulares.html` | Información de los Titulares |
| `agenda.html` | Cultos, actos y calendario |
| `hazte-hermano.html` | Información y formulario de alta |
| `contacto.html` | Datos, formulario y mapa |
| `assets/escudo-aprobado.png` | Escudo oficial que aparece en la cabecera y la portada |
| `assets/styles.css` | Colores y aspecto visual (edición avanzada) |
| `assets/script.js` | Menú para móviles; normalmente no hay que tocarlo |
| `assets/header.js` | Cabecera y menú compartidos por todas las páginas |

## Ver la web

Abre `index.html` con doble clic. Después de cada cambio, guarda el archivo y
recarga la página en el navegador (tecla `F5`).

Dentro de cada HTML busca `ZONA EDITABLE`. Esos comentarios señalan directamente
los bloques pensados para modificar. Todo el código está separado en líneas y con
sangría para que sea fácil reconocer dónde empieza y termina cada apartado.

Si alguna vez el HTML vuelve a aparecer comprimido, ejecuta desde esta carpeta:

```text
python scripts/format_html.py
```

## Cabecera compartida

La cabecera no está repetida. Se escribe una sola vez en `assets/header.js`.
Cada página incluye únicamente una etiqueta corta como esta:

```html
<site-header active="agenda"></site-header>
```

El valor `active` marca la opción actual del menú. Los valores disponibles están
escritos en `assets/header.js`; normalmente no hace falta modificarlos.

## Publicación

La publicación está configurada con GitHub Pages. Al integrar los cambios en la
rama `main`, GitHub publicará la web automáticamente.

> Importante: prueba siempre los cambios antes de publicarlos y conserva una
> copia del archivo que vayas a editar.
