# Documentación oficial de la Hermandad

La sección se edita directamente en `hermandad.html`, buscando
`id="documentacion-oficial"`. Sus estilos específicos están en
`assets/css/pages/hermandad.css`; reutiliza la tabla `literary-table` de Producción literaria.
La generación automática de cronología y Junta no modifica esta sección.

## Comprobación de los originales aportados (21 de octubre de 2026)

| Documento | Evidencia en el PDF | Archivo integrado |
| --- | --- | --- |
| Estatutos (13 páginas) | La portada declara aprobación por Cabildo General Extraordinario de 15 de mayo de 2023. Se observan sellos de la Diócesis de Coria-Cáceres con fecha de 31 de mayo de 2023. | `documentos/normativa/estatutos-2023-05.pdf` |
| Reglamento de Régimen Interno (41 páginas) | El preámbulo, página 1, declara aprobación en Cabildo General Extraordinario de 25 de febrero de 2025 y modificación parcial aprobada el 29 de enero de 2026. | `documentos/normativa/reglamento-regimen-interno-2026-01-29.pdf` |

Los documentos aportados contienen evidencia de aprobación y no se identifican
como borradores. El responsable de la web confirmó expresamente la vigencia de ambos documentos
el 21 de octubre de 2026. Se han integrado copias idénticas a los originales,
comprobadas mediante SHA-256, con enlaces independientes de consulta y descarga.
La comprobación documental acredita lo visible en los archivos; la vigencia actual
se apoya en esa confirmación del responsable.

El preámbulo del Reglamento menciona un decreto episcopal de 13 de mayo de 2023;
esa fecha no coincide con el sello visible en los Estatutos. No se usa como fecha
de aprobación episcopal en la web.

## Mantener la consulta en futuras actualizaciones

1. Confirmar con Secretaría que ambas versiones siguen vigentes. Si alguna ha sido
   sustituida, obtener el PDF definitivo y aprobado que corresponda.
2. Copiar el PDF original sin modificarlo a su ruta de destino y comprobar que
   coincide con el original. No sustituirlo por una transcripción ni un borrador.
3. Actualizar los enlaces de consulta y descarga de la fila correspondiente,
   conservando su nombre accesible (`aria-label`) y el atributo `download` en
   el enlace de descarga. Actualizar la fecha visible y este registro.

## Añadir o sustituir documentos

Duplicar una fila `tr` dentro del `tbody` de la tabla `official-documents`.
La primera celda contiene el título, una descripción breve y la fecha de versión;
la segunda, el botón de consulta en el visor y el enlace de descarga del PDF. Mantener las rutas y los
nombres accesibles específicos de cada documento. Conservar nombres de archivo
con fecha para distinguir versiones.

La normativa se presenta como contenido institucional permanente.
La publicación requiere autorización expresa del responsable de la web.

## Visor de consulta

«Consultar» reutiliza el visor de `patrimonio.html` y `assets/js/revistas.js`.
Cada documento tiene una carpeta junto a su PDF con `documento.json` y las
imágenes `pagina-001.webp`, etc., generadas a partir del original aprobado.
El JSON define título, dimensiones, PDF y páginas ordenadas. Al sustituir un PDF,
regenerar las imágenes y actualizar el JSON y los atributos `data-revista-*`
del botón (también se usan al abrir la web directamente con `file://`).
`data-revista-title` permite usar títulos institucionales sin cambiar los de Fides.
La descarga conserva el PDF original sin modificar.
