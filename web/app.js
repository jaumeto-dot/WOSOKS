const state = {
  wines: [],
  outlets: ["TODOS", "SHIMA", "LLUM I SAL", "MEL", "CERCLE", "QUIOSC"],
  outlet: "SHIMA",
  category: "Todas",
  query: "",
  filters: {
    type: "",
    country: "",
    region: "",
    producer: "",
    vintage: "",
  },
};

const els = {
  outletChips: document.querySelector("#outletChips"),
  categoryChips: document.querySelector("#categoryChips"),
  search: document.querySelector("#searchInput"),
  results: document.querySelector("#results"),
  count: document.querySelector("#resultCount"),
  empty: document.querySelector("#emptyState"),
  filtersPanel: document.querySelector("#filtersPanel"),
  type: document.querySelector("#typeFilter"),
  country: document.querySelector("#countryFilter"),
  region: document.querySelector("#regionFilter"),
  producer: document.querySelector("#producerFilter"),
  vintage: document.querySelector("#vintageFilter"),
  fileInput: document.querySelector("#fileInput"),
  dialog: document.querySelector("#wineDialog"),
  dialogContent: document.querySelector("#dialogContent"),
  closeDialog: document.querySelector("#closeDialog"),
  filtersToggle: document.querySelector("#filtersToggle"),
  filtersLabel: document.querySelector("#filtersLabel"),
  filtersChevron: document.querySelector("#filtersChevron"),
};

function norm(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function titleCase(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
}

function canonicalCountry(value) {
  const key = norm(value);
  const fixes = {
    espana: "España",
    esapana: "España",
    francia: "Francia",
    franciaa: "Francia",
    japon: "Japón",
  };
  return fixes[key] || titleCase(value);
}

function canonicalRegion(value) {
  const key = norm(value);
  const fixes = {
    galicia: "Galicia",
    champagne: "Champagne",
    borgona: "Borgoña",
    burgundy: "Borgoña",
    "rhone valley": "Rhône Valley",
    "valle del rodano": "Rhône Valley",
  };
  return fixes[key] || titleCase(value);
}

function canonicalType(type, category) {
  const source = norm(category) === "sake" ? category : (type || category);
  const key = norm(source).replace(/\s+/g, "");
  const fixes = {
    blanco: "Blancos",
    blancos: "Blancos",
    blancosinternacionales: "Blancos Internacionales",
    botella: norm(category) === "sake" ? "Sake" : "Botella",
    dulce: "Dulces",
    dulces: "Dulces",
    espumoso: "Espumosos",
    espumosos: "Espumosos",
    generoso: "Generosos",
    generosos: "Generosos",
    porcopa: "Por copa",
    rosado: "Rosados",
    rosados: "Rosados",
    sake: "Sake",
    tinto: "Tintos",
    tintos: "Tintos",
    tintosinternacionales: "Tintos Internacionales",
  };
  return fixes[key] || titleCase(source);
}

function canonicalCategory(value) {
  return canonicalType(value, value);
}

function normalizeWine(wine) {
  const category = canonicalCategory(wine.category);
  return {
    ...wine,
    country: canonicalCountry(wine.country),
    region: canonicalRegion(wine.region),
    type: canonicalType(wine.type, category),
    category,
    outlets: (wine.outlets || []).map((item) => ({
      ...item,
      outlet: titleCase(item.outlet).toUpperCase(),
      location: titleCase(item.location),
      price: titleCase(item.price),
    })),
  };
}

function isByTheGlass(wine) {
  return norm(wine.category) === "por copa" || norm(wine.format) === "copa";
}

function visibleOutlet(wine) {
  if (state.outlet === "TODOS") return wine.outlets;
  return wine.outlets.filter((item) => item.outlet === state.outlet);
}

function searchText(wine) {
  return norm([
    wine.name,
    wine.producer,
    wine.grapes,
    wine.vintage,
    wine.country,
    wine.region,
    wine.appellation,
    wine.subregion,
    wine.type,
    wine.category,
    wine.outlets.map((o) => `${o.outlet} ${o.location} ${o.price}`).join(" "),
  ].join(" "));
}

function categories() {
  const list = new Set(["Todas"]);
  state.wines.forEach((wine) => {
    if (visibleOutlet(wine).length && wine.category) list.add(wine.category);
  });
  return ["Todas", ...[...list].filter((item) => item !== "Todas").sort((a, b) => a.localeCompare(b, "es"))];
}

function filteredWines() {
  const query = norm(state.query);
  return state.wines.filter((wine) => {
    if (!visibleOutlet(wine).length) return false;
    if (state.category !== "Todas" && wine.category !== state.category) return false;
    if (query && !searchText(wine).includes(query)) return false;
    if (state.filters.type && wine.type !== state.filters.type) return false;
    if (state.filters.country && wine.country !== state.filters.country) return false;
    if (state.filters.region && wine.region !== state.filters.region) return false;
    if (state.filters.producer && wine.producer !== state.filters.producer) return false;
    if (state.filters.vintage && wine.vintage !== state.filters.vintage) return false;
    return true;
  });
}

function unique(field) {
  return [...new Set(
    state.wines
      .filter((wine) => visibleOutlet(wine).length)
      .map((wine) => wine[field])
      .filter(Boolean)
  )].sort((a, b) => String(a).localeCompare(String(b), "es"));
}

function setOptions(select, label, values, current) {
  select.innerHTML = `<option value="">${label}</option>` + values
    .map((value) => `<option value="${escapeHtml(value)}"${value === current ? " selected" : ""}>${escapeHtml(value)}</option>`)
    .join("");
}

function renderChips() {
  els.outletChips.innerHTML = state.outlets
    .map((outlet) => `<button class="chip ${outlet === state.outlet ? "active" : ""}" data-outlet="${outlet}">${outlet}</button>`)
    .join("");
  els.categoryChips.innerHTML = categories()
    .map((category) => `<button class="chip ${category === state.category ? "active" : ""}" data-category="${category}">${category}</button>`)
    .join("");
}

function renderFilters() {
  setOptions(els.type, "Tipo", unique("type"), state.filters.type);
  setOptions(els.country, "País", unique("country"), state.filters.country);
  setOptions(els.region, "Región", unique("region"), state.filters.region);
  setOptions(els.producer, "Productor", unique("producer"), state.filters.producer);
  setOptions(els.vintage, "Añada", unique("vintage"), state.filters.vintage);
  renderFilterSummary();
}

function activeFilterCount() {
  return Object.values(state.filters).filter(Boolean).length;
}

function setFiltersOpen(open) {
  els.filtersPanel.hidden = !open;
  els.filtersToggle.setAttribute("aria-expanded", String(open));
  els.filtersChevron.textContent = open ? "⌃" : "⌄";
  try {
    localStorage.setItem("wosFiltersOpen", open ? "1" : "0");
  } catch (error) {
    // Ignore storage restrictions in embedded browsers.
  }
}

function renderFilterSummary() {
  const count = activeFilterCount();
  els.filtersLabel.textContent = count ? `Filtros · ${count} activo${count === 1 ? "" : "s"}` : "Filtros";
}

function renderResults() {
  const wines = filteredWines();
  els.count.textContent = `${wines.length} vinos en ${state.outlet}${state.category !== "Todas" ? " · " + state.category : ""}`;
  els.empty.style.display = wines.length ? "none" : "block";
  els.results.innerHTML = wines.map(cardHtml).join("");
  renderFilterSummary();
}

function cardHtml(wine) {
  const location = visibleOutlet(wine)[0] || wine.outlets[0] || {};
  const subtitle = [wine.producer, wine.vintage].filter(Boolean).join(" — ");
  const region = [wine.region, wine.grapes].filter(Boolean).join(" · ");
  const locations = wine.outlets.length > 1 ? wine.outlets : [location];
  const glass = isByTheGlass(wine);
  return `
    <article class="wine-card" data-id="${wine.id}">
      <div class="wine-heading">
        <h2 class="wine-title">${escapeHtml(wine.name)}</h2>
        ${glass ? `<span class="glass-badge">POR COPA</span>` : ""}
      </div>
      <p class="meta">${escapeHtml(subtitle || "Sin productor")}</p>
      <p class="meta">${escapeHtml(region || wine.appellation || "")}</p>
      <div class="card-locations">
        ${locations.map((item) => `
          <div class="card-location">
            <strong>${escapeHtml(item.outlet || "")}</strong>
            <span>${glass ? `<strong class="inline-glass">POR COPA</strong> ` : ""}${escapeHtml(item.location || "Sin ubicación")}</span>
            <strong class="price">${escapeHtml(item.price || "")}</strong>
          </div>
        `).join("")}
      </div>
      <span class="badge">${escapeHtml(wine.category || wine.type || "")}</span>
    </article>
  `;
}

function renderDialog(wine) {
  const glass = isByTheGlass(wine);
  const rows = [
    ["Productor", wine.producer],
    ["Añada", wine.vintage],
    ["Tipo", wine.type],
    ["País", wine.country],
    ["Región", wine.region],
    ["Denominación", wine.appellation],
    ["Uvas", wine.grapes],
    ["Formato", wine.format],
  ].filter(([, value]) => value);
  els.dialogContent.innerHTML = `
    <div class="dialog-heading">
      <h2 class="dialog-title">${escapeHtml(wine.name)}</h2>
      ${glass ? `<span class="glass-badge">POR COPA</span>` : ""}
    </div>
    <dl class="detail-grid">
      ${rows.map(([label, value]) => `<dt>${label}</dt><dd>${escapeHtml(value)}</dd>`).join("")}
    </dl>
    <div class="locations">
      ${wine.outlets.map((item) => `
        <div class="location-row">
          <div class="location-row-head">
            <strong>${escapeHtml(item.outlet)}</strong>
            <strong class="location-price">${escapeHtml(item.price || "")}</strong>
          </div>
          ${glass ? `<strong class="location-glass">POR COPA</strong>` : ""}
          <span class="location-place">${escapeHtml(item.location || "Sin ubicación")}</span>
        </div>
      `).join("")}
    </div>
  `;
  els.dialog.showModal();
}

function escapeHtml(value) {
  return String(value || "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  }[char]));
}

function renderAll() {
  if (!categories().includes(state.category)) state.category = "Todas";
  renderChips();
  renderFilters();
  renderResults();
}

async function loadData() {
  let data = { wines: [], outlets: [] };
  try {
    const response = await fetch("/api/wines");
    if (response.status === 401) {
      location.href = "/login";
      return;
    }
    if (response.ok) data = await response.json();
  } catch (error) {
    data = { wines: [], outlets: [] };
  }
  state.wines = (data.wines || []).map(normalizeWine);
  if (data.outlets?.length) state.outlets = ["TODOS", ...data.outlets];
  renderAll();
}

els.search.addEventListener("input", (event) => {
  state.query = event.target.value;
  renderResults();
});

els.outletChips.addEventListener("click", (event) => {
  const outlet = event.target.dataset.outlet;
  if (!outlet) return;
  state.outlet = outlet;
  state.category = "Todas";
  state.filters = { type: "", country: "", region: "", producer: "", vintage: "" };
  renderAll();
});

els.categoryChips.addEventListener("click", (event) => {
  const category = event.target.dataset.category;
  if (!category) return;
  state.category = category;
  renderAll();
});

[
  ["type", els.type],
  ["country", els.country],
  ["region", els.region],
  ["producer", els.producer],
  ["vintage", els.vintage],
].forEach(([key, select]) => {
  select.addEventListener("change", (event) => {
    state.filters[key] = event.target.value;
    renderResults();
  });
});

els.results.addEventListener("click", (event) => {
  const card = event.target.closest(".wine-card");
  if (!card) return;
  const wine = state.wines.find((item) => String(item.id) === card.dataset.id);
  if (wine) renderDialog(wine);
});

els.closeDialog.addEventListener("click", () => els.dialog.close());

els.filtersToggle.addEventListener("click", () => {
  setFiltersOpen(els.filtersPanel.hidden);
});

els.fileInput.addEventListener("change", async (event) => {
  const file = event.target.files[0];
  if (!file) return;
  if (!["127.0.0.1", "localhost"].includes(location.hostname)) {
    alert("Para importar Excel, abre WOS con el servidor: python3 app.py");
    event.target.value = "";
    return;
  }
  const outlet = state.outlet === "TODOS" ? "SHIMA" : state.outlet;
  try {
    const response = await fetch(`/api/import?outlet=${encodeURIComponent(outlet)}`, {
      method: "POST",
      body: await file.arrayBuffer(),
      headers: {
        "X-Filename": file.name,
      },
    });
    if (response.status === 401) {
      location.href = "/login";
      return;
    }
    const result = await response.json();
    if (!response.ok) {
      alert(result.error || "No se pudo importar el Excel");
      return;
    }
    await loadData();
    alert(`${result.imported} vinos importados en ${result.outlet}`);
  } catch (error) {
    alert("No se pudo conectar con el servidor de importación.");
  } finally {
    event.target.value = "";
  }
});

try {
  setFiltersOpen(localStorage.getItem("wosFiltersOpen") === "1");
} catch (error) {
  setFiltersOpen(false);
}

loadData();
