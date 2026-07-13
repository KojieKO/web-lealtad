# Web institucional · Hermandad de la Lealtad

Web estática y adaptable de la Hermandad de Jesús de la Lealtad Despojado y María Santísima de la Pureza de Cáceres.

## Mantenimiento

- `index.html`: textos, agenda, noticias, enlaces y formularios.
- `assets/styles.css`: colores, tipografías y diseño.
- `assets/script.js`: menú móvil.
- Las cajas marcadas como fotografía son provisionales. Sustituirlas por `<img>` con archivos optimizados en `assets/images/`.

## Publicación

1. En **Settings → Pages → Build and deployment**, seleccionar **GitHub Actions**.
2. Al integrar esta rama en `main`, el flujo publicará `https://kojieko.github.io/web-lealtad/`.

## Dominio propio

1. En **Settings → Pages → Custom domain**, indicar `www.lealtaddespojado.es`.
2. En el proveedor del dominio, crear un registro `CNAME`: nombre `www`, destino `kojieko.github.io`.
3. Para el dominio sin `www`, añadir los cuatro registros `A` oficiales indicados por GitHub Pages.
4. Activar **Enforce HTTPS** cuando el certificado esté disponible.

No se incluye `CNAME` todavía para no afectar al dominio actual antes del cambio de DNS.
