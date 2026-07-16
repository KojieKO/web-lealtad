/*
 * MENÚ PARA MÓVILES
 * -----------------
 * Este archivo abre y cierra el menú en pantallas pequeñas.
 * Para cambiar textos, fechas, enlaces o fotografías NO es necesario editarlo.
 */

const botonMenu = document.querySelector(".menu");
const navegacion = document.querySelector("#nav");
const botonesSubmenu = document.querySelectorAll(".submenu-toggle");

// Algunas páginas futuras podrían no tener menú. Esta comprobación evita errores.
if (botonMenu && navegacion) {
  botonMenu.addEventListener("click", () => {
    const menuEstaAbierto = botonMenu.getAttribute("aria-expanded") === "true";

    botonMenu.setAttribute("aria-expanded", String(!menuEstaAbierto));
    navegacion.classList.toggle("open", !menuEstaAbierto);
  });

  // Al elegir una página, cerramos el menú para que no tape el contenido.
  navegacion.addEventListener("click", () => {
    botonMenu.setAttribute("aria-expanded", "false");
    navegacion.classList.remove("open");
  });
}

botonesSubmenu.forEach((boton) => {
  boton.addEventListener("click", (evento) => {
    evento.stopPropagation();
    const grupo = boton.closest(".nav-group");
    const seAbre = !grupo.classList.contains("submenu-open");

    document.querySelectorAll(".nav-group.submenu-open").forEach((otroGrupo) => {
      otroGrupo.classList.remove("submenu-open");
      otroGrupo.querySelector(".submenu-toggle").setAttribute("aria-expanded", "false");
    });

    grupo.classList.toggle("submenu-open", seAbre);
    boton.setAttribute("aria-expanded", String(seAbre));
  });
});

/*
 * OPACIDAD DEL FONDO SEGÚN EL ZOOM
 * ---------------------------------
 * La relación entre el ancho exterior e interior permite estimar el zoom.
 * Restamos 35 puntos y limitamos el resultado para que nunca sea negativo.
 */
function actualizarOpacidadFondo() {
  const zoomEstimado = window.outerWidth > 0
    ? (window.outerWidth / window.innerWidth) * 100
    : 100;
  const opacidad = Math.max(0, Math.min(1, (zoomEstimado - 25) / 100));

  document.documentElement.style.setProperty(
    "--background-opacity",
    opacidad.toFixed(3),
  );
}

actualizarOpacidadFondo();
window.addEventListener("resize", actualizarOpacidadFondo, { passive: true });
