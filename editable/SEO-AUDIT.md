# Auditoría SEO de lealtaddespojado.es

Fecha de auditoría: 17 de julio de 2026  
Dominio canónico: `https://lealtaddespojado.es/`  
Repositorio: `KojieKO/web-lealtad`

## Resumen ejecutivo

La web dispone de contenido institucional útil, HTML mayoritariamente semántico y una
arquitectura sencilla. Los principales bloqueos eran la ausencia de sitemap y robots,
metadatos genéricos, falta de URL canónica y datos estructurados, contenido de agenda
dependiente de JavaScript y varias imágenes desproporcionadamente pesadas.

La consulta pública `site:lealtaddespojado.es` no devolvía páginas del dominio en el
momento de la auditoría. El dominio acababa de migrarse a GitHub Pages, por lo que este
dato es una línea base, no una prueba de penalización.

## Hallazgos por prioridad

| Código | Prioridad | Hallazgo | Impacto esperado | Estado |
| --- | --- | --- | --- | --- |
| SEO-TECH-01 | Crítico | `robots.txt` y `sitemap.xml` devolvían 404. | Facilita el descubrimiento y seguimiento de las nueve URL canónicas y sus imágenes. | Corregido |
| SEO-PERF-01 | Crítico | Una fotografía pesaba 8,86 MB, otra 1,51 MB y el escudo común cerca de 1 MB. Faltaban dimensiones en varias imágenes. | Reduce LCP, consumo móvil y saltos de diseño; mejora Core Web Vitals. | Corregido |
| SEO-TECH-02 | Alto | No había canonical, robots avanzados, Open Graph ni Twitter Cards; títulos y descripciones eran genéricos. | Consolida señales por URL y mejora comprensión y clics desde buscadores y redes. | Corregido |
| SEO-TECH-03 | Alto | El despliegue utilizaba versiones de GitHub Actions basadas en Node.js 20, ya obsoleto en los runners. | Mantiene la publicación compatible con Node.js 24 y evita futuras interrupciones. | Corregido salvo limitación del empaquetador oficial |
| SEO-SEM-01 | Alto | No existían datos estructurados. | Ayuda a Google a identificar la entidad, su nombre, logo, sede, web oficial y relación con cada página. | Corregido |
| SEO-LOCAL-01 | Alto | Las señales de Cáceres y Extremadura eran débiles fuera del contenido visible de algunas páginas. | Refuerza relevancia para búsquedas locales sin repetir palabras clave de forma artificial. | Corregido |
| SEO-JS-01 | Alto | La agenda principal solo aparecía después de ejecutar JavaScript. | El contenido ya es rastreable en el HTML inicial y continúa actualizándose desde `editable/agenda.md`. | Corregido |
| SEO-DUP-01 | Alto | Faltaba declarar el host preferido. `www` ya redirigía a la versión sin `www`. | Evita señales divididas entre variantes del dominio. | Corregido con canonical y `CNAME` |
| SEO-A11Y-01 | Medio | Cuatro páginas no tenían enlace para saltar al contenido; faltaban nombres accesibles en navegación y estado de página. | Mejora navegación por teclado y semántica para tecnologías de asistencia. | Corregido |
| SEO-LINK-01 | Medio | Había poco enlazado contextual entre páginas relacionadas. | Reparte autoridad interna y aclara relaciones entre Titulares, cultos y procesiones. | Corregido parcialmente |
| SEO-UX-01 | Alto | Los enlaces de privacidad y calendario apuntan a `#`. | Daña confianza y usabilidad, especialmente junto al formulario. | Pendiente de contenido o URL real |
| SEO-CONTENT-01 | Alto | La portada es visualmente sólida pero ofrece muy poco texto institucional estático. | Limita la capacidad de posicionar la entidad y sus temas principales desde la página de mayor autoridad. | Pendiente de aprobación editorial |
| SEO-CONTENT-02 | Alto | Faltan páginas con intención propia: sede canónica y parroquia, hacerse hermano, noticias, galerías y preguntas frecuentes. | Abre búsquedas informativas y locales de cola larga y mejora la autoridad temática. | Pendiente de fuentes y aprobación |
| SEO-DATA-01 | Alto | `editable/agenda.md` mezcla actos de 2027 con fechas de febrero, marzo y mayo de 2026; una fila muestra día 13 pero declara del 4 al 12. | Impide publicar datos `Event` fiables y puede mostrar fechas incoherentes a usuarios y Google. | Pendiente de confirmación |
| SEO-DISCOVER-01 | Medio | No existe una sección editorial con artículos fechados, autoría e imágenes grandes por noticia. | Sin contenido nuevo y original no hay una estrategia realista para Google Discover. | Pendiente de estrategia editorial |
| SEO-URL-01 | Bajo | Las URL conservan `.html`. | Las rutas son comprensibles; migrarlas ahora sin redirecciones de servidor añadiría riesgo y poco beneficio. | Sin cambio |
| SEO-BREAD-01 | Bajo | No hay migas de pan. | La arquitectura tiene un único nivel y navegación global clara; añadirlas ahora aportaría poco y alteraría el diseño. | Sin cambio |

## Mapa de palabras clave e intención

| Página | Palabra clave principal | Oportunidades secundarias y de cola larga | Intención |
| --- | --- | --- | --- |
| Inicio | hermandad del Despojado Cáceres | Lealtad Despojado, hermandades de Cáceres, cofradía del Despojado Cáceres | Navegacional y de entidad |
| Hermandad | historia Hermandad del Despojado Cáceres | fundación, Junta de Gobierno, hábito nazareno, reglas de la Hermandad | Informativa |
| Titulares | Jesús de la Lealtad Despojado | María Santísima de la Pureza, Virgen de Fátima Cáceres, titulares del Despojado | Informativa y Google Imágenes |
| Martes Santo | procesión del Despojado Cáceres | itinerario, horarios, estación de penitencia, Semana Santa de Cáceres | Informativa local y temporal |
| Antorchas | procesión de las Antorchas Fátima Cáceres | Virgen de Fátima 12 de mayo, procesión de antorchas 23:00, barrio de Fátima | Informativa local y temporal |
| Salidas | vía crucis Jesús Despojado Cáceres | rosario matutino Pureza, salidas devocionales barrio de Fátima | Informativa local |
| Agenda | cultos Hermandad del Despojado | triduo Jesús Despojado, novena Virgen de Fátima, quinario de la Pureza | Temporal y de asistencia |
| Patrimonio | patrimonio Hermandad del Despojado | ajuar, orfebrería, marcha Pureza, revista Fides, carteles del Martes Santo | Informativa |
| Contacto | Hermandad del Despojado Cáceres contacto | Casa de Hermandad, sede, calle Sanguino Michel, cómo llegar | Local y de contacto |

## Cambios implementados

- `SEO-TECH-01`: nuevos `robots.txt` y `sitemap.xml`, con sitemap de imágenes.
- `SEO-TECH-02`: title, description, canonical, Open Graph, Twitter Cards,
  `max-image-preview:large`, manifest y color de tema en todas las páginas indexables.
- `SEO-TECH-03`: actualización de checkout, configuración y despliegue de Pages a
  versiones estables con Node.js 24; el empaquetador queda en su última versión estable
  (`v4`), que aún puede emitir un aviso por una dependencia interna de GitHub.
- `SEO-SEM-01`: grafo `Organization` + `WebSite` + `WebPage` en la portada y tipos
  específicos `AboutPage`, `CollectionPage` y `ContactPage` en páginas interiores.
- `SEO-LOCAL-01`: nombre de entidad, dirección, Cáceres, Extremadura, redes sociales,
  fecha de fundación y área de servicio en datos estructurados.
- `SEO-PERF-01`: copias WebP responsivas, escudo ligero, dimensiones intrínsecas,
  `decoding="async"`, lazy loading solo fuera de la zona inicial y prioridad para LCP.
- `SEO-JS-01`: el generador de agenda escribe también el listado estático en
  `agenda.html`; JavaScript mantiene la mejora progresiva.
- `SEO-A11Y-01`: salto al contenido consistente, `aria-current`, etiquetas de
  navegación y enlaces reales a redes sociales.
- `SEO-LINK-01`: enlaces contextuales entre historia, Titulares, procesiones,
  patrimonio y contacto.
- Página 404 propia con `noindex,follow`.

Los comentarios con códigos `SEO-*` permiten localizar las modificaciones de mayor
impacto. El historial de Git permite revertir el conjunto completo por commit.

## Contenido pendiente: información necesaria

| Código de autorización | Página o mejora | Información necesaria antes de redactar |
| --- | --- | --- |
| SEO-CONTENT-PORTADA | Texto institucional breve en portada | Nombre corto preferido, misión en 80–120 palabras y tono de bienvenida. |
| SEO-CONTENT-SEDE | Sede canónica y Parroquia de Fátima | Historia verificada de la parroquia, fecha de vinculación, dirección oficial, horarios y fotografías autorizadas. |
| SEO-CONTENT-HERMANO | Cómo hacerse hermano | Requisitos, cuotas, pasos, plazos, contacto responsable y versión vigente del formulario. |
| SEO-CONTENT-NEWS | Noticias | Responsable editorial, frecuencia, autoría, fecha, archivo fotográfico y criterio para noticias antiguas. |
| SEO-CONTENT-GALERIAS | Galerías fotográficas | Fotografías autorizadas, autor/crédito, fecha, acto y permiso de publicación. |
| SEO-CONTENT-FAQ | Preguntas frecuentes | Respuestas oficiales sobre cultos, estación de penitencia, hábitos, papeletas de sitio, altas y contacto. |
| SEO-CONTENT-BARRIO | Historia del barrio y la parroquia | Fuentes históricas, hitos, relación con la Hermandad y fotografías con derechos. |
| SEO-CONTENT-PRIV | Privacidad | Identidad legal y NIF, responsable, base jurídica, plazos, derechos, encargados externos y canal de ejercicio. |
| SEO-DATA-AGENDA | Corrección de agenda | Confirmar si los actos marcados en febrero, marzo y mayo de 2026 corresponden a 2027 y la fecha exacta del Día de Fátima. |

## Acciones externas al repositorio

1. Verificar las propiedades `https://lealtaddespojado.es/` y de dominio en Google
   Search Console.
2. Enviar `https://lealtaddespojado.es/sitemap.xml` y solicitar indexación de la
   portada, Titulares, Martes Santo y Antorchas.
3. Revisar que la ficha de Google/Maps use exactamente el mismo nombre, dirección,
   web y correo que la página de contacto.
4. Medir Core Web Vitals con datos reales cuando Search Console acumule tráfico;
   Lighthouse de laboratorio no sustituye esos datos de campo.

## Decisiones deliberadas

- No se han añadido `meta keywords`: Google no las utiliza.
- No se ha marcado la Hermandad como `LocalBusiness`: no es un negocio local.
- No se ha añadido schema `Event` hasta confirmar las fechas de la agenda.
- No se han creado páginas vacías ni textos de relleno para captar palabras clave.
- No se han añadido migas de pan ni se han cambiado URL para preservar el diseño,
  la simplicidad de GitHub Pages y los enlaces existentes.
