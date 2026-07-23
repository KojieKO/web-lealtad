(function setUpMagazineReader(window, document) {
  "use strict";

  var modal = document.getElementById("reader-modal");
  var dialog = modal && modal.querySelector(".reader-dialog");
  var body = modal && modal.querySelector(".reader-dialog__body");
  var stage = modal && modal.querySelector(".reader-stage");
  var book = document.getElementById("reader-book");
  var title = document.getElementById("reader-title");
  var message = modal && modal.querySelector(".reader-message");
  var pdfLink = modal && modal.querySelector(".reader-pdf");
  var currentPage = modal && modal.querySelector("[data-reader-current]");
  var totalPages = modal && modal.querySelector("[data-reader-total]");
  var previousButton = modal && modal.querySelector("[data-reader-prev]");
  var nextButton = modal && modal.querySelector("[data-reader-next]");
  var fullscreenButton = modal && modal.querySelector("[data-reader-fullscreen]");
  var zoomOutButton = modal && modal.querySelector("[data-reader-zoom-out]");
  var zoomInButton = modal && modal.querySelector("[data-reader-zoom-in]");
  var zoomResetButton = modal && modal.querySelector("[data-reader-zoom-reset]");
  var zoomValue = modal && modal.querySelector("[data-reader-zoom-value]");

  var pageFlip = null;
  var opener = null;
  var requestController = null;
  var openingId = 0;
  var libraryPromise = null;
  var zoom = 1;

  if (!modal || !dialog || !body || !stage || !book) {
    return;
  }

  function setMessage(text) {
    message.textContent = text || "";
    message.classList.toggle("is-visible", Boolean(text));
  }

  function updateCounter(index, total) {
    currentPage.textContent = total ? String(index + 1) : "0";
    totalPages.textContent = String(total || 0);
    previousButton.disabled = !total || index <= 0;
    nextButton.disabled = !total || index >= total - 1;
  }

  function updateZoomControls() {
    var readerReady = Boolean(pageFlip);

    zoomValue.textContent = String(Math.round(zoom * 100)) + "%";
    zoomOutButton.disabled = !readerReady || zoom <= 1;
    zoomInButton.disabled = !readerReady || zoom >= 2.5;
    zoomResetButton.disabled = !readerReady || zoom === 1;
  }

  function setZoom(nextZoom) {
    if (!pageFlip) {
      return;
    }

    zoom = Math.min(2.5, Math.max(1, nextZoom));
    stage.classList.toggle("is-zoomed", zoom > 1);
    book.style.width = String(zoom * 100) + "%";
    book.style.maxWidth = zoom > 1
      ? "none"
      : String(2 * pageFlip.getSettings().maxWidth) + "px";

    pageFlip.getUI().update();
    pageFlip.update();
    updateZoomControls();

    window.requestAnimationFrame(function centerZoomedReader() {
      stage.scrollLeft = Math.max(0, (stage.scrollWidth - stage.clientWidth) / 2);
      stage.scrollTop = 0;
    });
  }

  function destroyReader() {
    var bookStage = book.parentElement || modal.querySelector(".reader-stage");

    if (requestController) {
      requestController.abort();
      requestController = null;
    }

    if (pageFlip) {
      pageFlip.destroy();
      pageFlip = null;
      book = document.createElement("div");
      book.className = "reader-book";
      book.id = "reader-book";
      book.setAttribute("aria-label", "Lector de la revista");
      bookStage.prepend(book);
    } else {
      book.replaceChildren();
    }

    zoom = 1;
    stage.classList.remove("is-zoomed");
    stage.scrollLeft = 0;
    stage.scrollTop = 0;
    setMessage("");
    updateCounter(0, 0);
    updateZoomControls();
    body.setAttribute("aria-busy", "false");
    pdfLink.hidden = true;
    pdfLink.removeAttribute("href");
  }

  function closeReader() {
    if (modal.hidden) {
      return;
    }

    openingId += 1;

    if (document.fullscreenElement === dialog && document.exitFullscreen) {
      document.exitFullscreen().catch(function ignoreFullscreenError() {});
    }

    destroyReader();
    modal.hidden = true;
    document.body.classList.remove("reader-open");

    if (opener && document.contains(opener)) {
      opener.focus();
    }

    opener = null;
  }

  function resolveResources(config, configUrl) {
    var baseUrl = new URL(".", new URL(configUrl, document.baseURI));
    var pages = Array.isArray(config.pages) ? config.pages : [];

    return {
      pages: pages.map(function resolvePage(page) {
        return new URL(page, baseUrl).href;
      }),
      pdf: config.pdf ? new URL(config.pdf, baseUrl).href : ""
    };
  }

  /*
   * Chrome no permite usar fetch() con archivos file://. Este respaldo toma
   * los datos mínimos del botón para que la revista también pueda probarse
   * abriendo patrimonio.html directamente desde el ordenador.
   */
  function getLocalFileConfig(button) {
    var cells = button.closest("tr").querySelectorAll("td");
    var number = cells[0].textContent.trim();
    var year = cells[1].textContent.trim();
    var pageCount = Number(button.dataset.revistaPageCount) || 0;
    var pages = Array.from({ length: pageCount }, function makePageName(unused, index) {
      return "pagina-" + String(index + 1).padStart(3, "0") + ".webp";
    });

    return {
      title: "Revista Fides · Número " + number + " (" + year + ")",
      width: Number(button.dataset.revistaWidth) || 1240,
      height: Number(button.dataset.revistaHeight) || 1754,
      pdf: button.dataset.revistaPdf || "",
      pages: pages
    };
  }

  async function loadMagazineConfig(button, configUrl, signal) {
    if (window.location.protocol === "file:") {
      return getLocalFileConfig(button);
    }

    var response = await fetch(configUrl, {
      signal: signal,
      headers: { "Accept": "application/json" }
    });

    if (!response.ok) {
      throw new Error("No se pudo leer la configuración de esta revista.");
    }

    return response.json();
  }

  function loadStPageFlip() {
    if (window.St && window.St.PageFlip) {
      return Promise.resolve(window.St.PageFlip);
    }

    if (libraryPromise) {
      return libraryPromise;
    }

    libraryPromise = new Promise(function loadLocalLoader(resolve, reject) {
      var script = document.createElement("script");
      script.src = "assets/js/page-flip.browser.js";
      script.async = true;

      script.addEventListener("load", function loaderReady() {
        if (window.St && window.St.PageFlip) {
          resolve(window.St.PageFlip);
          return;
        }

        if (window.stPageFlipReady) {
          window.stPageFlipReady.then(resolve, reject);
          return;
        }

        reject(new Error("El cargador de StPageFlip no se ha iniciado."));
      }, { once: true });

      script.addEventListener("error", function loaderFailed() {
        reject(new Error("No se pudo cargar el lector."));
      }, { once: true });

      document.head.appendChild(script);
    });

    return libraryPromise;
  }

  async function openReader(button) {
    var thisOpening = ++openingId;
    var configUrl = button.dataset.revistaConfig;

    destroyReader();
    opener = button;
    modal.hidden = false;
    document.body.classList.add("reader-open");
    body.setAttribute("aria-busy", "true");
    title.textContent = "Cargando revista…";
    setMessage("Preparando el lector…");
    updateCounter(0, 0);
    dialog.focus();

    requestController = new AbortController();

    try {
      var config = await loadMagazineConfig(
        button,
        configUrl,
        requestController.signal
      );
      var resources = resolveResources(config, configUrl);

      if (thisOpening !== openingId || modal.hidden) {
        return;
      }

      title.textContent = config.title || "Revista Fides";

      if (resources.pdf) {
        pdfLink.href = resources.pdf;
        pdfLink.hidden = false;
      }

      if (!resources.pages.length) {
        setMessage("Las páginas de este número todavía no se han incorporado.");
        body.setAttribute("aria-busy", "false");
        return;
      }

      var PageFlip = await loadStPageFlip();

      if (thisOpening !== openingId || modal.hidden) {
        return;
      }

      pageFlip = new PageFlip(book, {
        width: Number(config.width) || 1240,
        height: Number(config.height) || 1754,
        size: "stretch",
        minWidth: 280,
        maxWidth: Number(config.width) || 1240,
        minHeight: 396,
        maxHeight: Number(config.height) || 1754,
        drawShadow: true,
        flippingTime: 700,
        usePortrait: true,
        autoSize: true,
        maxShadowOpacity: 0.35,
        showCover: true,
        mobileScrollSupport: true,
        swipeDistance: 25,
        useMouseEvents: true
      });

      pageFlip.on("init", function onReaderReady(event) {
        setMessage("");
        body.setAttribute("aria-busy", "false");
        updateCounter(event.data.page, pageFlip.getPageCount());
        updateZoomControls();
      });

      pageFlip.on("flip", function onPageFlip(event) {
        updateCounter(event.data, pageFlip.getPageCount());
      });

      pageFlip.on("changeOrientation", function onOrientationChange() {
        updateCounter(pageFlip.getCurrentPageIndex(), pageFlip.getPageCount());
      });

      pageFlip.loadFromImages(resources.pages);

      /*
       * StPageFlip limpia por defecto todo su canvas con color blanco. Ese
       * blanco no pertenece a las páginas y ocultaba el límite del papel.
       * Conservamos el render de imágenes, pero pintamos el área exterior con
       * el mismo verde grisáceo del lector.
       */
      var render = pageFlip.getRender();
      render.clear = function clearReaderCanvas() {
        this.ctx.fillStyle = "#344238";
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
      };
      pageFlip.update();
    } catch (error) {
      if (error.name === "AbortError" || thisOpening !== openingId) {
        return;
      }

      console.error("[Lector Fides]", error);
      title.textContent = "Revista Fides";
      setMessage("No ha sido posible abrir esta revista. Inténtelo de nuevo más tarde.");
      body.setAttribute("aria-busy", "false");
    }
  }

  function trapFocus(event) {
    if (event.key !== "Tab" || modal.hidden) {
      return;
    }

    var focusable = Array.from(dialog.querySelectorAll(
      "a[href]:not([hidden]), button:not([disabled]):not([hidden]), [tabindex]:not([tabindex='-1'])"
    )).filter(function isVisible(element) {
      return element.getClientRects().length > 0;
    });

    if (!focusable.length) {
      event.preventDefault();
      dialog.focus();
      return;
    }

    var first = focusable[0];
    var last = focusable[focusable.length - 1];

    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  }

  document.addEventListener("click", function handleReaderClick(event) {
    var readButton = event.target.closest("[data-revista-config]");

    if (readButton) {
      openReader(readButton);
      return;
    }

    if (!modal.hidden && event.target.closest("[data-reader-close]")) {
      closeReader();
    }
  });

  document.addEventListener("keydown", function handleReaderKeyboard(event) {
    if (modal.hidden) {
      return;
    }

    if (event.key === "Escape") {
      event.preventDefault();
      closeReader();
      return;
    }

    trapFocus(event);
  });

  previousButton.addEventListener("click", function showPreviousPage() {
    if (pageFlip) {
      pageFlip.flipPrev("top");
    }
  });

  nextButton.addEventListener("click", function showNextPage() {
    if (pageFlip) {
      pageFlip.flipNext("top");
    }
  });

  zoomOutButton.addEventListener("click", function zoomOut() {
    setZoom(zoom - 0.25);
  });

  zoomInButton.addEventListener("click", function zoomIn() {
    setZoom(zoom + 0.25);
  });

  zoomResetButton.addEventListener("click", function resetZoom() {
    setZoom(1);
  });

  fullscreenButton.addEventListener("click", function toggleFullscreen() {
    if (document.fullscreenElement === dialog) {
      document.exitFullscreen();
    } else if (dialog.requestFullscreen) {
      dialog.requestFullscreen();
    }
  });

  document.addEventListener("fullscreenchange", function updateFullscreenLabel() {
    var active = document.fullscreenElement === dialog;
    fullscreenButton.textContent = active ? "Salir de pantalla completa" : "Pantalla completa";
    fullscreenButton.setAttribute(
      "aria-label",
      active ? "Salir de pantalla completa" : "Ver el lector a pantalla completa"
    );
  });

  updateZoomControls();
}(window, document));
