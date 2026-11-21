/* Comportamiento local de la primera versión del formulario. */
(function () {
  const form = document.querySelector("#solicitud-form");
  if (!form) return;

  const birthDate = form.elements["solicitante.fechaNacimiento"];
  const fee = form.elements["cuota.importe"];
  const frequency = form.elements["cuota.periodicidad"];
  const major = document.querySelector("#consentimiento-mayor");
  const minor = document.querySelector("#consentimiento-menor");
  const consent = form.elements["consentimiento.aceptado"];
  const province = form.elements["solicitante.provinciaNacimiento"];
  const provinces = ["Álava", "Albacete", "Alicante", "Almería", "Asturias", "Ávila", "Badajoz", "Barcelona", "Bizkaia", "Burgos", "Cáceres", "Cádiz", "Cantabria", "Castellón", "Ciudad Real", "Córdoba", "A Coruña", "Cuenca", "Gipuzkoa", "Girona", "Granada", "Guadalajara", "Huelva", "Huesca", "Illes Balears", "Jaén", "León", "Lleida", "Lugo", "Madrid", "Málaga", "Murcia", "Navarra", "Ourense", "Palencia", "Las Palmas", "Pontevedra", "La Rioja", "Salamanca", "Santa Cruz de Tenerife", "Segovia", "Sevilla", "Soria", "Tarragona", "Teruel", "Toledo", "Valencia", "Valladolid", "Zamora", "Zaragoza", "Ceuta", "Melilla"];
  provinces.sort((a, b) => a.localeCompare(b, "es")).forEach((name) => province.add(new Option(name, name)));

  const phone = form.elements["solicitante.telefono"];
  phone.addEventListener("blur", () => {
    const digits = phone.value.replace(/\s/g, "");
    if (/^\d{9}$/.test(digits)) phone.value = digits.replace(/(\d{3})(\d{3})(\d{3})/, "$1 $2 $3");
  });

  const sameHolder = form.elements["cuenta.titularEsSolicitante"];
  const holder = form.elements["cuenta.titular"];
  const holderId = form.elements["cuenta.dniTitular"];
  const applicantName = form.elements["solicitante.nombre"];
  const applicantId = form.elements["solicitante.dniNie"];
  function syncHolder() {
    if (sameHolder.checked) {
      holder.value = applicantName.value;
      holderId.value = applicantId.value;
    }
    holder.readOnly = sameHolder.checked;
    holderId.readOnly = sameHolder.checked;
  }
  sameHolder.addEventListener("change", () => {
    if (!sameHolder.checked) {
      holder.value = "";
      holderId.value = "";
    }
    syncHolder();
  });
  applicantName.addEventListener("input", syncHolder);
  applicantId.addEventListener("input", syncHolder);

  const iban = form.elements["cuenta.iban"];
  const ibanStatus = document.querySelector("#iban-status");
  function validateIban(showResult = false) {
    const value = iban.value.replace(/\s/g, "").toUpperCase();
    let valid = /^ES\d{22}$/.test(value);
    if (valid) {
      const rearranged = value.slice(4) + value.slice(0, 4);
      let remainder = 0;
      for (const character of rearranged) {
        const digits = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character;
        for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
      }
      valid = remainder === 1;
    }
    iban.setCustomValidity(value && !valid ? "Introduce un IBAN español válido de 24 caracteres." : "");
    ibanStatus.dataset.valid = String(Boolean(showResult && value && valid));
    ibanStatus.textContent = showResult && value ? (valid ? "✓" : "El IBAN no es válido. Revisa sus caracteres.") : "";
    ibanStatus.setAttribute("aria-label", showResult && value && valid ? "IBAN válido" : "");
  }
  iban.addEventListener("input", () => validateIban(false));
  iban.addEventListener("blur", () => validateIban(true));

  const mapsKey = window.SOLICITUD_MAPS_KEY;
  const mapsStatus = document.querySelector("#maps-status");
  const streetInput = form.elements["solicitante.domicilio"];
  const suggestionsPanel = document.querySelector("#address-suggestions");
  const suggestionsList = document.querySelector("#sugerencias-direccion");
  let queryVersion = 0;
  let timer;
  function closeSuggestions() {
    suggestionsPanel.hidden = true;
    streetInput.setAttribute("aria-expanded", "false");
  }
  if (mapsKey && location.protocol !== "file:") {
    window.iniciarBusquedaSolicitud = async function () {
      try {
        const { AutocompleteSuggestion, AutocompleteSessionToken } = await google.maps.importLibrary("places");
        let session = null;
        streetInput.addEventListener("input", () => {
          clearTimeout(timer);
          const version = ++queryVersion;
          const input = streetInput.value.trim();
          closeSuggestions();
          mapsStatus.textContent = "";
          if (input.length < 3) { if (!input) session = null; return; }
          timer = setTimeout(async () => {
            try {
              session ||= new AutocompleteSessionToken();
              const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({ input, includedRegionCodes: ["es"], sessionToken: session });
              if (version !== queryVersion || document.activeElement !== streetInput) return;
              suggestionsList.replaceChildren();
              for (const suggestion of suggestions) {
                const prediction = suggestion.placePrediction;
                if (!prediction) continue;
                const button = document.createElement("button");
                button.type = "button";
                button.setAttribute("role", "option");
                button.textContent = prediction.text.toString();
                button.addEventListener("click", () => selectPrediction(prediction));
                suggestionsList.appendChild(button);
              }
              suggestionsPanel.hidden = !suggestionsList.children.length;
              streetInput.setAttribute("aria-expanded", String(!suggestionsPanel.hidden));
            } catch {
              if (version === queryVersion) mapsStatus.textContent = "No se pueden cargar sugerencias. Puedes escribir la dirección manualmente.";
            }
          }, 350);
        });
        async function selectPrediction(placePrediction) {
          ++queryVersion;
          clearTimeout(timer);
          closeSuggestions();
          session = null;
          try {
            const place = placePrediction.toPlace();
            await place.fetchFields({ fields: ["addressComponents"] });
            const parts = place.addressComponents || [];
            const get = (type) => parts.find((part) => part.types.includes(type))?.longText || "";
            const street = get("route");
            const number = get("street_number");
            const postal = get("postal_code");
            const locality = get("locality") || get("postal_town") || get("administrative_area_level_3");
            form.elements["solicitante.domicilio"].value = street || placePrediction.text.toString();
            form.elements["solicitante.numero"].value = number;
            form.elements["solicitante.codigoPostal"].value = postal;
            form.elements["solicitante.localidad"].value = locality;
            mapsStatus.textContent = "";
          } catch {
            mapsStatus.textContent = "No se han podido obtener los datos. Puedes introducirlos manualmente.";
          }
        }
        streetInput.addEventListener("keydown", (event) => {
          if (event.key === "Escape") { ++queryVersion; closeSuggestions(); }
          if (event.key === "ArrowDown" && !suggestionsPanel.hidden) { event.preventDefault(); suggestionsList.querySelector("button")?.focus(); }
        });
        suggestionsList.addEventListener("keydown", (event) => {
          const buttons = Array.from(suggestionsList.querySelectorAll("button"));
          const index = buttons.indexOf(document.activeElement);
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            buttons[(index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length]?.focus();
          } else if (event.key === "Escape") { closeSuggestions(); streetInput.focus(); }
        });
        document.addEventListener("click", (event) => { if (!event.target.closest(".address-field")) { ++queryVersion; closeSuggestions(); } });
      } catch {
        mapsStatus.textContent = "Buscador no disponible. Puedes escribir la dirección manualmente.";
      }
    };
    const mapsScript = document.createElement("script");
    const params = new URLSearchParams({ key: mapsKey, loading: "async", callback: "iniciarBusquedaSolicitud", language: "es" });
    mapsScript.src = `https://maps.googleapis.com/maps/api/js?${params}`;
    mapsScript.async = true;
    mapsScript.onerror = () => { mapsStatus.textContent = "Buscador no disponible. Puedes escribir la dirección manualmente."; };
    document.head.appendChild(mapsScript);
  }

  function calculateAge(value) {
    if (!value) return null;
    const birth = new Date(`${value}T00:00:00`);
    const today = new Date();
    let age = today.getFullYear() - birth.getFullYear();
    const birthdayNotReached = today < new Date(today.getFullYear(), birth.getMonth(), birth.getDate());
    if (birthdayNotReached) age -= 1;
    return age >= 0 ? age : null;
  }

  function setRequired(container, required) {
    container.querySelectorAll("input, select").forEach((control) => {
      control.required = required;
    });
  }

  function updateAgeState() {
    const age = calculateAge(birthDate.value);
    const isMinorConsent = age !== null && age < 14;
    form.elements["bautismo.fecha"].min = birthDate.value;

    major.hidden = age === null || isMinorConsent;
    minor.hidden = age === null || !isMinorConsent;
    document.querySelector("#firma-mayor").hidden = age === null || isMinorConsent;
    document.querySelector("#firma-menor").hidden = age === null || !isMinorConsent;
    setRequired(major, age !== null && !isMinorConsent);
    setRequired(minor, age !== null && isMinorConsent);
    updateConsentAvailability();

    validateFee();

  }

  function updateConsentAvailability() {
    const age = calculateAge(birthDate.value);
    const needsRepresentative = age !== null && age < 14;
    const incomplete = needsRepresentative && Array.from(minor.querySelectorAll("input, select")).some((control) => !control.checkValidity());
    consent.disabled = age === null || incomplete;
    document.querySelector("#consentimiento-ayuda").hidden = !incomplete;
    if (consent.disabled) consent.checked = false;
  }
  minor.addEventListener("input", updateConsentAvailability);
  minor.addEventListener("change", updateConsentAvailability);

  function validateFee() {
    const raw = fee.value.trim().replace(",", ".");
    const amount = Number(raw);
    const age = calculateAge(birthDate.value);
    let message = "";
    if (raw && (!/^\d+(?:\.\d{1,2})?$/.test(raw) || !Number.isFinite(amount))) message = "Introduce un importe válido.";
    else if (raw && Math.round(amount * 100) * ({ anual: 1, semestral: 2, trimestral: 4, mensual: 12 }[frequency.value] || 1) < 1500 && !(amount === 0 && age !== null && age < 8)) message = "La cuota anual debe sumar al menos 15 €; solo los menores de 8 años pueden indicar 0 €.";
    fee.setCustomValidity(message);
  }

  const firstSections = Array.from(form.querySelectorAll(".form-section:not(.paso-dos)"));
  const secondSections = Array.from(form.querySelectorAll(".paso-dos"));
  const firstNav = document.querySelector("#paso-uno-nav");
  function showStep(second) {
    firstSections.forEach((section) => { section.hidden = second; });
    firstNav.hidden = second;
    secondSections.forEach((section) => { section.hidden = !second; });
    document.querySelector(second ? "#consentimiento-title" : "#datos-personales-title").scrollIntoView({ block: "start" });
  }
  document.querySelector("#siguiente-paso").addEventListener("click", () => {
    updateAgeState();
    const invalid = firstSections.flatMap((section) => Array.from(section.querySelectorAll("input, select"))).find((control) => !control.checkValidity());
    if (invalid) { invalid.reportValidity(); return; }
    form.elements["consentimiento.mayor.nombre"].value = form.elements["solicitante.nombre"].value;
    form.elements["consentimiento.mayor.dniNie"].value = form.elements["solicitante.dniNie"].value;
    form.elements["consentimiento.representante.menorNombre"].value = form.elements["solicitante.nombre"].value;
    for (const name of ["consentimiento.mayor.lugar", "consentimiento.representante.lugar"]) {
      if (!form.elements[name].value) form.elements[name].value = form.elements["solicitante.localidad"].value;
    }
    const today = new Date();
    const localDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
    for (const name of ["consentimiento.mayor.fecha", "consentimiento.representante.fecha"]) {
      if (!form.elements[name].value) form.elements[name].value = localDate;
    }
    updateConsentAvailability();
    showStep(true);
  });
  document.querySelector("#paso-anterior").addEventListener("click", () => showStep(false));

  const todayIso = new Date().toLocaleDateString("sv-SE");
  birthDate.max = todayIso;
  form.elements["bautismo.fecha"].max = todayIso;
  birthDate.addEventListener("change", updateAgeState);
  fee.addEventListener("input", validateFee);
  frequency.addEventListener("change", validateFee);
  updateAgeState();

  document.querySelectorAll(".signature-pad").forEach((canvas) => {
    const context = canvas.getContext("2d");
    let drawing = false;
    const position = (event) => {
      const rect = canvas.getBoundingClientRect();
      return [(event.clientX - rect.left) * canvas.width / rect.width, (event.clientY - rect.top) * canvas.height / rect.height];
    };
    canvas.addEventListener("pointerdown", (event) => {
      if (event.button !== 0) return;
      event.preventDefault();
      drawing = true;
      canvas.setPointerCapture(event.pointerId);
      const [x, y] = position(event);
      context.beginPath(); context.moveTo(x, y);
      context.lineWidth = 4; context.lineCap = "round"; context.lineJoin = "round"; context.strokeStyle = "#17251a";
    });
    canvas.addEventListener("pointermove", (event) => {
      if (!drawing) return;
      const [x, y] = position(event); context.lineTo(x, y); context.stroke();
      canvas.dataset.signed = "true";
    });
    for (const name of ["pointerup", "pointercancel", "lostpointercapture"]) canvas.addEventListener(name, () => { drawing = false; });
    canvas.parentElement.querySelector(".signature-clear").addEventListener("click", () => {
      context.clearRect(0, 0, canvas.width, canvas.height); delete canvas.dataset.signed;
    });
  });

  // El formulario nunca se envía: evita que Intro mande los datos en la URL.
  form.addEventListener("submit", (event) => event.preventDefault());
  // Borra borradores guardados por versiones anteriores (incluían DNI e IBAN).
  try { localStorage.removeItem("solicitudIngresoBorrador"); } catch {}
})();
