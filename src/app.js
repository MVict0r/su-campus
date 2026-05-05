import { BUILDINGS, buildingUrl, formatArea, formatNumber } from "./campus-data.js";
import { escapeHtml, getParsedBuildingData, statusClass, statusLabel } from "./view-utils.js";

const listElement = document.querySelector("#buildingList");
const searchElement = document.querySelector("#buildingSearch");
const mapContent = document.querySelector("#mapContent");
const viewport = document.querySelector("#mapViewport");
const tooltip = document.querySelector("#mapTooltip");

const state = {
  scale: 1,
  x: 0,
  y: 0,
  activeId: null,
  dragging: false,
  moved: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  downBuildingId: null,
};

let mapGroups = new Map();

function renderBuildingList(query = "") {
  const normalized = query.trim().toLowerCase();
  const buildings = BUILDINGS.filter((building) => {
    const content = `${building.name} ${building.code} ${building.number}`.toLowerCase();
    return content.includes(normalized);
  });

  if (!buildings.length) {
    listElement.innerHTML = `<div class="empty-state">Корпус не найден</div>`;
    return;
  }

  listElement.innerHTML = buildings
    .map((building) => {
      const badgeClass = statusClass(building.id, building.status);
      return `
        <button class="building-item" type="button" data-building-id="${escapeHtml(building.id)}">
          <span class="building-item__number">${escapeHtml(building.number || "—")}</span>
          <span class="building-item__main">
            <span class="building-item__name">${escapeHtml(building.name)}</span>
            <span class="building-item__meta">${escapeHtml(building.code)} · ${escapeHtml(building.type)}</span>
          </span>
          <span class="badge ${badgeClass}">${escapeHtml(statusLabel(building.id, building.status))}</span>
        </button>
      `;
    })
    .join("");

  listElement.querySelectorAll("[data-building-id]").forEach((button) => {
    const id = button.dataset.buildingId;
    button.addEventListener("mouseenter", () => setActiveBuilding(id));
    button.addEventListener("mouseleave", () => clearActiveBuilding(id));
    button.addEventListener("focus", () => setActiveBuilding(id));
    button.addEventListener("blur", () => clearActiveBuilding(id));
    button.addEventListener("click", () => {
      window.location.href = buildingUrl(id);
    });
  });

  syncListActive();
}

async function loadMap() {
  const response = await fetch("./assets/campus.svg");
  if (!response.ok) throw new Error("SVG map could not be loaded.");

  mapContent.innerHTML = await response.text();
  const svg = mapContent.querySelector("svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", "Карта кампуса университета");
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");

  BUILDINGS.forEach((building) => {
    const group = svg.getElementById(building.svgId);
    if (!group) return;

    group.classList.add("map-building");
    group.dataset.buildingId = building.id;
    group.setAttribute("tabindex", "0");
    group.setAttribute("role", "link");
    group.setAttribute("aria-label", building.name);
    mapGroups.set(building.id, group);

    group.addEventListener("mouseenter", (event) => {
      setActiveBuilding(building.id);
      showTooltip(building, event.clientX, event.clientY);
    });
    group.addEventListener("mousemove", (event) => moveTooltip(event.clientX, event.clientY));
    group.addEventListener("mouseleave", () => {
      clearActiveBuilding(building.id);
      hideTooltip();
    });
    group.addEventListener("focus", () => setActiveBuilding(building.id));
    group.addEventListener("blur", () => clearActiveBuilding(building.id));
    group.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        window.location.href = buildingUrl(building.id);
      }
    });
  });
}

function setActiveBuilding(id) {
  state.activeId = id;
  mapGroups.forEach((group, groupId) => {
    group.classList.toggle("is-active", groupId === id);
    group.classList.toggle("is-hovered", groupId === id);
  });
  syncListActive();
}

function clearActiveBuilding(id) {
  if (state.activeId !== id) return;
  state.activeId = null;
  mapGroups.forEach((group) => {
    group.classList.remove("is-active", "is-hovered");
  });
  syncListActive();
}

function syncListActive() {
  listElement.querySelectorAll("[data-building-id]").forEach((button) => {
    button.classList.toggle("is-active", button.dataset.buildingId === state.activeId);
  });
}

function showTooltip(building, x, y) {
  const parsed = getParsedBuildingData(building.id);
  const details = parsed
    ? `${formatNumber(parsed.roomCount)} помещений · ${formatArea(parsed.areaM2)} · ${formatNumber(parsed.seats)} мест`
    : "Информация о здании будет добавлена позже";

  tooltip.innerHTML = `
    <strong>${escapeHtml(building.name)}</strong>
    <span>${escapeHtml(building.code)} · ${escapeHtml(building.type)}</span>
    <span>${escapeHtml(details)}</span>
  `;
  tooltip.classList.add("is-visible");
  moveTooltip(x, y);
}

function moveTooltip(x, y) {
  const offset = 16;
  const tooltipRect = tooltip.getBoundingClientRect();
  const left = Math.min(x + offset, window.innerWidth - tooltipRect.width - 12);
  const top = Math.min(y + offset, window.innerHeight - tooltipRect.height - 12);
  tooltip.style.left = `${Math.max(12, left)}px`;
  tooltip.style.top = `${Math.max(12, top)}px`;
}

function hideTooltip() {
  tooltip.classList.remove("is-visible");
}

function applyTransform() {
  mapContent.style.transform = `translate(${state.x}px, ${state.y}px) scale(${state.scale})`;
}

function zoomAt(factor, clientX, clientY) {
  const rect = viewport.getBoundingClientRect();
  const oldScale = state.scale;
  const nextScale = Math.max(0.55, Math.min(3.4, oldScale * factor));
  const localX = (clientX - rect.left - state.x) / oldScale;
  const localY = (clientY - rect.top - state.y) / oldScale;

  state.x = clientX - rect.left - localX * nextScale;
  state.y = clientY - rect.top - localY * nextScale;
  state.scale = nextScale;
  applyTransform();
}

function resetMap() {
  state.scale = 0.74;
  state.x = 0;
  state.y = -110;
  applyTransform();
}

function attachMapControls() {
  document.querySelector("#zoomIn").addEventListener("click", () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(1.18, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  document.querySelector("#zoomOut").addEventListener("click", () => {
    const rect = viewport.getBoundingClientRect();
    zoomAt(0.84, rect.left + rect.width / 2, rect.top + rect.height / 2);
  });

  document.querySelector("#resetMap").addEventListener("click", resetMap);

  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomAt(event.deltaY < 0 ? 1.12 : 0.9, event.clientX, event.clientY);
    },
    { passive: false },
  );

  viewport.addEventListener("pointerdown", (event) => {
    const targetGroup = event.target.closest?.(".map-building");
    state.dragging = true;
    state.moved = false;
    state.downBuildingId = targetGroup?.dataset.buildingId || null;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!state.dragging) return;
    const dx = event.clientX - state.lastX;
    const dy = event.clientY - state.lastY;
    const total = Math.hypot(event.clientX - state.startX, event.clientY - state.startY);
    if (total > 4) {
      state.moved = true;
      hideTooltip();
    }
    state.x += dx;
    state.y += dy;
    state.lastX = event.clientX;
    state.lastY = event.clientY;
    applyTransform();
  });

  viewport.addEventListener("pointerup", (event) => {
    const targetId = state.downBuildingId;
    state.dragging = false;
    state.downBuildingId = null;
    viewport.releasePointerCapture(event.pointerId);
    if (targetId && !state.moved) {
      window.location.href = buildingUrl(targetId);
      return;
    }
    window.setTimeout(() => {
      state.moved = false;
    }, 0);
  });

  viewport.addEventListener("pointercancel", () => {
    state.dragging = false;
    state.moved = false;
  });
}

async function init() {
  renderBuildingList();
  attachMapControls();
  searchElement.addEventListener("input", () => renderBuildingList(searchElement.value));
  resetMap();

  try {
    await loadMap();
  } catch (error) {
    mapContent.innerHTML = `<div class="empty-state">Не удалось загрузить SVG-карту. Проверьте файл assets/campus.svg.</div>`;
    console.error(error);
  }
}

init();
