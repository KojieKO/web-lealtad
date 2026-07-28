# Revistas Fides

Cada revista tiene su propia carpeta y un archivo `revista.json`. No hace falta
crear otra página HTML ni copiar el lector.

## Añadir las páginas de una revista

1. Copie en su carpeta las imágenes WebP, ordenadas y numeradas:
   `pagina-001.webp`, `pagina-002.webp`, etc.
2. Abra su archivo `revista.json`.
3. Escriba los nombres en `pages`, en el mismo orden:

```json
{
  "title": "Revista Fides · Número 1 (2024)",
  "width": 1240,
  "height": 1754,
  "pdf": "fides-1-2024.pdf",
  "pages": [
    "pagina-001.webp",
    "pagina-002.webp",
    "pagina-003.webp"
  ]
}
```

Deje `"pdf": ""` cuando no exista un PDF. En ese caso el botón «Abrir PDF» no
aparecerá. `width` y `height` representan la proporción de cada página.

Para añadir otro número, copie una carpeta existente, cambie su
`revista.json` y añada una fila con un botón en `patrimonio.html`.
