import { buildingUrl, floorUrl, formatArea, formatNumber, getBuilding } from "./campus-data.js";
import {
  escapeHtml,
  getParsedBuildingData,
  getQueryParam,
  renderRoomRows,
  renderRoomsTable,
  roomMatches,
} from "./view-utils.js";

const page = document.querySelector("#floorPage");
const buildingId = getQueryParam("building", "gmk");
const requestedFloorId = getQueryParam("floor", "floor-1");
const building = getBuilding(buildingId);
const parsed = getParsedBuildingData(buildingId);
const floor = parsed?.floors.find((item) => item.id === requestedFloorId) || parsed?.floors[0] || null;
const rooms = floor ? parsed.rooms.filter((room) => room.floorId === floor.id) : [];
const FLOOR_PLAN_ASSETS = {
  gmk: {
    basement: "./assets/floors/gmk-basement.svg",
    "floor-1": "./assets/floors/gmk-1.svg",
    "floor-2": "./assets/floors/gmk-2.svg",
    "floor-3": "./assets/floors/gmk-3.svg",
  },
  gyk: {
    "floor-1": "./assets/floors/gyk-1.svg",
    "floor-2": "./assets/floors/gyk-2.svg",
  },
};
const floorPlanAsset = FLOOR_PLAN_ASSETS[buildingId]?.[floor?.id] || "";
const roomsByNumber = buildRoomsByNumber(rooms);

const PLAN_OWNER_BY_COLOR = {
  "#BEDCFF": { code: "ГМК", label: "ГМК", className: "owner-gmk" },
  "#C8EFE1": { code: "ТТК", label: "ТТК", className: "owner-ttk" },
  "#FFBEBE": { code: "ГУК", label: "ГУК", className: "owner-gyk" },
};

const planState = {
  scale: 1,
  x: 0,
  y: 0,
  dragging: false,
  moved: false,
  startX: 0,
  startY: 0,
  lastX: 0,
  lastY: 0,
  selectedRoom: "",
  fullViewBox: null,
  viewBox: null,
};

if (!building) {
  page.innerHTML = `
    <nav class="breadcrumbs"><a href="./index.html">Карта</a><span>/</span><span>Этаж не найден</span></nav>
    <div class="empty-state">Такого корпуса пока нет в карте.</div>
  `;
} else {
  document.title = `${floor?.label || "Этаж"} · ${building.name}`;
  renderPage();
}

function renderPage() {
  const interactivePlan = Boolean(floorPlanAsset);
  page.classList.toggle("page-inner--viewer", interactivePlan);
  page.innerHTML = `
    <nav class="breadcrumbs">
      <a href="./index.html">Карта</a>
      <span>/</span>
      <a href="${buildingUrl(building.id)}">${escapeHtml(building.name)}</a>
      <span>/</span>
      <span>${escapeHtml(floor?.label || "Этаж")}</span>
    </nav>

    <header class="page-header ${interactivePlan ? "page-header--compact" : ""}">
      <div class="page-title">
        <h1>${escapeHtml(floor?.label || "Этаж")}</h1>
        <p>${escapeHtml(building.name)} · ${escapeHtml(building.code)}</p>
      </div>
      <div class="topbar__actions">
        <a class="button" href="${buildingUrl(building.id)}">← Корпус</a>
        <a class="button" href="./index.html">На карту</a>
      </div>
    </header>

    ${interactivePlan ? renderFloorViewControls() : renderStats()}
    ${parsed && !interactivePlan ? renderFloorNav() : ""}
    ${parsed ? renderFloorPlan() : renderEmptyData()}
    ${parsed ? renderRoomsSection() : ""}
  `;

  if (parsed) {
    attachRoomFilters();
    if (floorPlanAsset) {
      initInteractiveFloorPlan();
    }
  }
}

function renderFloorViewControls() {
  return `
    <section class="floor-view-controls" aria-label="Навигация и показатели этажа">
      <div class="metric-strip">
        <span><strong>${floor ? formatNumber(floor.roomCount) : "—"}</strong> помещений</span>
        <span><strong>${floor ? formatArea(floor.areaM2) : "—"}</strong> площадь</span>
        <span><strong>${floor ? formatNumber(floor.seats) : "—"}</strong> мест</span>
      </div>
      <div class="floor-tabs" aria-label="Выбор этажа">
        ${parsed.floors
          .map(
            (item) => `
              <a class="floor-tab ${item.id === floor?.id ? "is-active" : ""}" href="${floorUrl(building.id, item.id)}">
                ${escapeHtml(item.label)}
              </a>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderStats() {
  return `
    <section class="stats-grid" aria-label="Показатели этажа">
      <div class="stat">
        <span>Помещения</span>
        <strong>${floor ? formatNumber(floor.roomCount) : "—"}</strong>
      </div>
      <div class="stat">
        <span>Площадь</span>
        <strong>${floor ? formatArea(floor.areaM2) : "—"}</strong>
      </div>
      <div class="stat">
        <span>Посадочные места</span>
        <strong>${floor ? formatNumber(floor.seats) : "—"}</strong>
      </div>
      <div class="stat">
        <span>Источник</span>
        <strong>${floor ? "DOCX" : "—"}</strong>
      </div>
    </section>
  `;
}

function renderFloorNav() {
  return `
    <section class="section">
      <h2>Выбор этажа</h2>
      <div class="floor-grid">
        ${parsed.floors
          .map(
            (item) => `
              <a class="floor-card" href="${floorUrl(building.id, item.id)}">
                <strong>${escapeHtml(item.label)}</strong>
                <span>${formatNumber(item.roomCount)} помещений</span>
                <span>${item.id === floor?.id ? "Открыт сейчас" : "Открыть этаж"}</span>
              </a>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderFloorPlan() {
  if (floorPlanAsset) {
    return `
      <section class="section section--floor-viewer">
        <div class="floor-layout floor-layout--interactive">
          <div class="floor-plan floor-plan--interactive" id="floorPlanViewer" aria-label="Интерактивная схема этажа">
            <div class="floor-plan-toolbar" aria-label="Масштаб схемы">
              <button class="icon-button" id="floorZoomIn" type="button" title="Приблизить" aria-label="Приблизить">+</button>
              <button class="icon-button" id="floorZoomOut" type="button" title="Отдалить" aria-label="Отдалить">−</button>
              <button class="icon-button" id="floorReset" type="button" title="Сбросить схему" aria-label="Сбросить схему">⌂</button>
            </div>
            <div class="floor-plan-viewport" id="floorPlanViewport">
              <div class="floor-plan-content" id="floorPlanContent"></div>
            </div>
          </div>
          <aside class="floor-side-panel" aria-label="Кабинеты на схеме">
            <div class="floor-legend" aria-label="Цвета кабинетов">
              ${Object.entries(PLAN_OWNER_BY_COLOR)
                .map(
                  ([color, owner]) => `
                    <span><i style="background: ${color}"></i>${escapeHtml(owner.label)}</span>
                  `,
                )
                .join("")}
            </div>
            <div class="selected-room" id="selectedRoomPanel">
              <strong>Кабинет</strong>
              <span>—</span>
            </div>
            <div class="room-chips room-chips--interactive" aria-label="Аудитории этажа">
              ${rooms
                .map(
                  (room) => `
                    <button class="room-chip" type="button" data-room-chip="${escapeHtml(room.room)}">
                      ${escapeHtml(room.room)}
                    </button>
                  `,
                )
                .join("")}
            </div>
          </aside>
        </div>
      </section>
    `;
  }

  return `
    <section class="section">
      <h2>Схема этажа</h2>
      <div class="floor-layout">
        <div class="floor-plan" aria-label="Схема этажа">
          <div class="floor-plan__placeholder">
            <div>
              <strong>Схема кабинетов будет добавлена позже</strong><br />
              <span>Сейчас здесь показан список аудиторий этажа из документа.</span>
            </div>
          </div>
        </div>
        <div class="room-chips" aria-label="Аудитории этажа">
          ${rooms.map((room) => `<span class="room-chip">${escapeHtml(room.room)}</span>`).join("")}
        </div>
      </div>
    </section>
  `;
}

function normalizeRoomNumber(value) {
  return String(value ?? "")
    .toLowerCase()
    .replaceAll("а", "a")
    .replace(/\s+/g, "")
    .replace(/[.,]/g, "");
}

function getRoomAliases(room) {
  const raw = String(room.room ?? "");
  const aliases = new Set([normalizeRoomNumber(raw)]);
  raw.split(/[\\/]/).forEach((part) => {
    const normalized = normalizeRoomNumber(part);
    if (normalized) aliases.add(normalized);
  });
  return aliases;
}

function buildRoomsByNumber(roomList) {
  const map = new Map();
  roomList.forEach((room) => {
    getRoomAliases(room).forEach((alias) => map.set(alias, room));
  });
  return map;
}

function isRoomGroupId(id) {
  return /^\d+[a-zа-я]?$/i.test(id) || /^\d+-\d+$/.test(id);
}

function getRoomGroups(svg) {
  const scope = svg.querySelector("#kab") || svg;
  return [...scope.querySelectorAll("g[id]")].filter((group) => isRoomGroupId(group.id));
}

function getRoomData(roomId) {
  return roomsByNumber.get(normalizeRoomNumber(roomId)) || null;
}

function normalizeFillColor(value) {
  const color = String(value || "").trim().toUpperCase();
  return /^#[0-9A-F]{6}$/.test(color) ? color : "";
}

function getElementFillColor(element) {
  const fill = normalizeFillColor(element.getAttribute("fill"));
  if (fill) return fill;

  const styleFill = element.getAttribute("style")?.match(/fill:\s*(#[0-9a-f]{6})/i)?.[1] || "";
  return normalizeFillColor(styleFill);
}

function getOwnerSurfaceElements(group) {
  return [...group.querySelectorAll("path, rect, polygon, circle, ellipse")].filter((element) => {
    return Boolean(PLAN_OWNER_BY_COLOR[getElementFillColor(element)]);
  });
}

function getFallbackSurfaceElements(group) {
  const shapes = [...group.querySelectorAll(":scope > path, :scope > rect, :scope > polygon, :scope > circle, :scope > ellipse")];
  const filledRoomShape = shapes.find((element) => {
    const fill = getElementFillColor(element);
    return fill && fill !== "#2B2A29" && fill !== "#000000";
  });
  if (filledRoomShape) return [filledRoomShape];

  const closedRoomShape = shapes.find((element) => {
    const stroke = element.getAttribute("stroke");
    const d = element.getAttribute("d") || "";
    return stroke && stroke !== "none" && /z/i.test(d);
  });
  if (closedRoomShape) return [closedRoomShape];

  const strokedShape = shapes.find((element) => {
    const stroke = element.getAttribute("stroke");
    return stroke && stroke !== "none";
  });
  return strokedShape ? [strokedShape] : [];
}

function getOwnerFromGroup(group) {
  const colored = getOwnerSurfaceElements(group)[0];
  const color = colored ? getElementFillColor(colored) : "";
  return PLAN_OWNER_BY_COLOR[color] ? { ...PLAN_OWNER_BY_COLOR[color], color } : null;
}

function ensureFloorTooltip() {
  let tooltip = document.querySelector("#floorTooltip");
  if (!tooltip) {
    tooltip = document.createElement("div");
    tooltip.id = "floorTooltip";
    tooltip.className = "map-tooltip";
    tooltip.setAttribute("role", "status");
    document.body.append(tooltip);
  }
  return tooltip;
}

async function initInteractiveFloorPlan() {
  const viewport = document.querySelector("#floorPlanViewport");
  const content = document.querySelector("#floorPlanContent");
  if (!viewport || !content) return;

  try {
    const response = await fetch(floorPlanAsset);
    if (!response.ok) throw new Error("Floor SVG could not be loaded.");
    content.innerHTML = await response.text();
  } catch (error) {
    content.innerHTML = `<div class="empty-state">Не удалось загрузить схему этажа.</div>`;
    console.error(error);
    return;
  }

  const svg = content.querySelector("svg");
  svg.setAttribute("role", "img");
  svg.setAttribute("aria-label", `${building.name}, ${floor.label}`);
  svg.setAttribute("preserveAspectRatio", "xMidYMid meet");
  cropSvgToPlan(svg);
  setInitialFloorViewBox(svg);

  const roomGroups = getRoomGroups(svg);
  roomGroups.forEach((group) => prepareRoomGroup(group));
  renderSchemeRoomChips(roomGroups.map((group) => group.id));
  attachFloorPlanControls(viewport);
  attachRoomChipControls();
  resetFloorPlan();
}

function cropSvgToPlan(svg) {
  const groups = [
    ...["#lobby", "#stairs", "#arrows", "#kab"]
    .map((selector) => svg.querySelector(selector))
      .filter(Boolean),
    ...getRoomGroups(svg),
  ];
  if (!groups.length) return;

  const boxes = groups
    .map((group) => group.getBBox())
    .filter((box) => box.width > 0 && box.height > 0);
  if (!boxes.length) return;
  const minX = Math.min(...boxes.map((box) => box.x));
  const minY = Math.min(...boxes.map((box) => box.y));
  const maxX = Math.max(...boxes.map((box) => box.x + box.width));
  const maxY = Math.max(...boxes.map((box) => box.y + box.height));
  const width = maxX - minX;
  const height = maxY - minY;
  const padX = width * 0.04;
  const padY = height * 0.07;

  svg.setAttribute("viewBox", `${minX - padX} ${minY - padY} ${width + padX * 2} ${height + padY * 2}`);
}

function prepareRoomGroup(group) {
  const roomId = group.id;
  const owner = getOwnerFromGroup(group);
  const room = getRoomData(roomId);

  group.classList.add("floor-room");
  if (owner) group.classList.add(owner.className);
  if (!owner) group.classList.add("floor-room--unassigned");
  if (room) group.classList.add("has-room-data");
  group.dataset.roomId = roomId;
  group.dataset.roomKey = normalizeRoomNumber(roomId);
  group.setAttribute("tabindex", "0");
  group.setAttribute("role", "button");
  group.setAttribute("aria-label", `Кабинет ${roomId}`);

  const surfaces = owner ? getOwnerSurfaceElements(group) : getFallbackSurfaceElements(group);
  surfaces.forEach((surface) => {
    surface.classList.add("floor-room-surface");
  });

  group.addEventListener("mouseenter", (event) => {
    setActiveRoom(roomId, false);
    showRoomTooltip(roomId, event.clientX, event.clientY);
  });
  group.addEventListener("mousemove", (event) => moveRoomTooltip(event.clientX, event.clientY));
  group.addEventListener("mouseleave", () => {
    hideRoomTooltip();
    if (planState.selectedRoom !== roomId) clearHoverRooms();
  });
  group.addEventListener("focus", () => setActiveRoom(roomId, false));
  group.addEventListener("blur", () => {
    if (planState.selectedRoom !== roomId) clearHoverRooms();
  });
  group.addEventListener("click", () => {
    if (planState.moved) return;
    selectRoom(roomId);
  });
  group.addEventListener("keydown", (event) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      selectRoom(roomId, true);
    }
  });
}

function attachFloorPlanControls(viewport) {
  document.querySelector("#floorZoomIn")?.addEventListener("click", () => zoomFloorPlan(1.18));
  document.querySelector("#floorZoomOut")?.addEventListener("click", () => zoomFloorPlan(0.84));
  document.querySelector("#floorReset")?.addEventListener("click", resetFloorPlan);

  viewport.addEventListener(
    "wheel",
    (event) => {
      event.preventDefault();
      zoomFloorPlan(event.deltaY < 0 ? 1.12 : 0.9, event.clientX, event.clientY);
    },
    { passive: false },
  );

  viewport.addEventListener("pointerdown", (event) => {
    planState.dragging = true;
    planState.moved = false;
    planState.startX = event.clientX;
    planState.startY = event.clientY;
    planState.lastX = event.clientX;
    planState.lastY = event.clientY;
    viewport.setPointerCapture(event.pointerId);
  });

  viewport.addEventListener("pointermove", (event) => {
    if (!planState.dragging) return;
    const svg = getFloorSvg();
    const viewBox = planState.viewBox;
    if (!svg || !viewBox) return;

    const dx = event.clientX - planState.lastX;
    const dy = event.clientY - planState.lastY;
    if (Math.hypot(event.clientX - planState.startX, event.clientY - planState.startY) > 4) {
      planState.moved = true;
      hideRoomTooltip();
    }
    const rect = viewport.getBoundingClientRect();
    viewBox.x -= (dx * viewBox.width) / rect.width;
    viewBox.y -= (dy * viewBox.height) / rect.height;
    planState.lastX = event.clientX;
    planState.lastY = event.clientY;
    applyFloorViewBox(svg);
  });

  viewport.addEventListener("pointerup", (event) => {
    planState.dragging = false;
    viewport.releasePointerCapture(event.pointerId);
    window.setTimeout(() => {
      planState.moved = false;
    }, 0);
  });

  viewport.addEventListener("pointercancel", () => {
    planState.dragging = false;
    planState.moved = false;
  });
}

function renderSchemeRoomChips(roomIds) {
  const chips = document.querySelector(".room-chips--interactive");
  if (!chips || rooms.length || !roomIds.length) return;

  const sortedRoomIds = [...roomIds].sort((a, b) => a.localeCompare(b, "ru", { numeric: true }));
  chips.innerHTML = sortedRoomIds
    .map(
      (roomId) => `
        <button class="room-chip" type="button" data-room-chip="${escapeHtml(roomId)}">
          ${escapeHtml(roomId)}
        </button>
      `,
    )
    .join("");
}

function attachRoomChipControls() {
  document.querySelectorAll("[data-room-chip]").forEach((chip) => {
    chip.addEventListener("click", () => selectRoom(chip.dataset.roomChip, true));
  });
}

function getFloorSvg() {
  return document.querySelector("#floorPlanContent svg");
}

function getSvgViewBox(svg) {
  const viewBox = svg.viewBox.baseVal;
  return {
    x: viewBox.x,
    y: viewBox.y,
    width: viewBox.width,
    height: viewBox.height,
  };
}

function setInitialFloorViewBox(svg) {
  planState.fullViewBox = getSvgViewBox(svg);
  planState.viewBox = { ...planState.fullViewBox };
  planState.scale = 1;
  applyFloorViewBox(svg);
}

function applyFloorViewBox(svg = getFloorSvg()) {
  if (!svg || !planState.viewBox) return;
  const { x, y, width, height } = planState.viewBox;
  svg.setAttribute("viewBox", `${x} ${y} ${width} ${height}`);
}

function clientPointToSvg(svg, clientX, clientY) {
  const point = svg.createSVGPoint();
  point.x = clientX;
  point.y = clientY;
  const matrix = svg.getScreenCTM();
  if (!matrix) {
    const viewBox = planState.viewBox || getSvgViewBox(svg);
    return { x: viewBox.x + viewBox.width / 2, y: viewBox.y + viewBox.height / 2 };
  }
  return point.matrixTransform(matrix.inverse());
}

function zoomFloorPlan(factor, clientX, clientY) {
  const svg = getFloorSvg();
  if (!svg || !planState.fullViewBox || !planState.viewBox) return;

  const oldViewBox = { ...planState.viewBox };
  const oldScale = planState.scale || 1;
  const nextScale = Math.max(1, Math.min(8, oldScale * factor));
  const anchor =
    clientX == null || clientY == null
      ? { x: oldViewBox.x + oldViewBox.width / 2, y: oldViewBox.y + oldViewBox.height / 2 }
      : clientPointToSvg(svg, clientX, clientY);
  const ratioX = (anchor.x - oldViewBox.x) / oldViewBox.width;
  const ratioY = (anchor.y - oldViewBox.y) / oldViewBox.height;
  const nextWidth = planState.fullViewBox.width / nextScale;
  const nextHeight = planState.fullViewBox.height / nextScale;

  planState.viewBox = {
    x: anchor.x - ratioX * nextWidth,
    y: anchor.y - ratioY * nextHeight,
    width: nextWidth,
    height: nextHeight,
  };
  planState.scale = nextScale;
  applyFloorViewBox(svg);
}

function resetFloorPlan() {
  const svg = getFloorSvg();
  if (!svg || !planState.fullViewBox) return;
  planState.scale = 1;
  planState.viewBox = { ...planState.fullViewBox };
  applyFloorViewBox(svg);
}

function selectRoom(roomId, center = false) {
  planState.selectedRoom = roomId;
  setActiveRoom(roomId, true);
  renderSelectedRoom(roomId);
  if (center) centerRoom(roomId);
  const row = document.querySelector(`[data-room-row="${CSS.escape(roomId)}"]`);
  row?.scrollIntoView({ block: "center", behavior: "smooth" });
}

function setActiveRoom(roomId, selected) {
  clearHoverRooms();
  const key = normalizeRoomNumber(roomId);
  document.querySelectorAll(`[data-room-key="${CSS.escape(key)}"]`).forEach((group) => {
    group.classList.add(selected ? "is-selected" : "is-hovered");
  });
  document.querySelectorAll("[data-room-chip]").forEach((chip) => {
    chip.classList.toggle("is-active", normalizeRoomNumber(chip.dataset.roomChip) === key);
  });
}

function clearHoverRooms() {
  document.querySelectorAll(".floor-room.is-hovered").forEach((group) => group.classList.remove("is-hovered"));
  document.querySelectorAll(".floor-room.is-selected").forEach((group) => {
    if (normalizeRoomNumber(group.dataset.roomId) !== normalizeRoomNumber(planState.selectedRoom)) {
      group.classList.remove("is-selected");
    }
  });
}

function renderSelectedRoom(roomId) {
  const panel = document.querySelector("#selectedRoomPanel");
  if (!panel) return;
  const room = getRoomData(roomId);
  const group = document.querySelector(`[data-room-key="${CSS.escape(normalizeRoomNumber(roomId))}"]`);
  const owner = group ? getOwnerFromGroup(group) : null;
  panel.innerHTML = roomCardHtml(roomId, room, owner);
}

function roomCardHtml(roomId, room, owner) {
  if (!room) {
    return `
      <strong>Кабинет ${escapeHtml(roomId)}</strong>
      ${owner ? `<span>Связано с: ${escapeHtml(owner.label)}</span>` : ""}
      <span>Данные будут добавлены позже</span>
    `;
  }

  return `
    <strong>Кабинет ${escapeHtml(room.room)}</strong>
    ${owner ? `<span>Связано с: ${escapeHtml(owner.label)}</span>` : ""}
    <span>${escapeHtml(room.area || "—")} · ${escapeHtml(room.seats ?? "—")} мест</span>
    <span>${escapeHtml(room.department || "—")}</span>
    <span>${escapeHtml(room.responsible || "—")}</span>
  `;
}

function showRoomTooltip(roomId, x, y) {
  const tooltip = ensureFloorTooltip();
  const room = getRoomData(roomId);
  const group = document.querySelector(`[data-room-key="${CSS.escape(normalizeRoomNumber(roomId))}"]`);
  const owner = group ? getOwnerFromGroup(group) : null;
  tooltip.innerHTML = room
    ? `
      <strong>Кабинет ${escapeHtml(room.room)}</strong>
      ${owner ? `<span>Связано с: ${escapeHtml(owner.label)}</span>` : ""}
      <span>${escapeHtml(room.area || "—")} · ${escapeHtml(room.seats ?? "—")} мест</span>
      <span>${escapeHtml(room.purpose || "—")}</span>
      <span>${escapeHtml(room.department || "—")} · ${escapeHtml(room.responsible || "—")}</span>
    `
    : `
      <strong>Кабинет ${escapeHtml(roomId)}</strong>
      ${owner ? `<span>Связано с: ${escapeHtml(owner.label)}</span>` : ""}
      <span>Данные будут добавлены позже</span>
    `;
  tooltip.classList.add("is-visible");
  moveRoomTooltip(x, y);
}

function moveRoomTooltip(x, y) {
  const tooltip = ensureFloorTooltip();
  const offset = 16;
  const rect = tooltip.getBoundingClientRect();
  const left = Math.min(x + offset, window.innerWidth - rect.width - 12);
  const top = Math.min(y + offset, window.innerHeight - rect.height - 12);
  tooltip.style.left = `${Math.max(12, left)}px`;
  tooltip.style.top = `${Math.max(12, top)}px`;
}

function hideRoomTooltip() {
  document.querySelector("#floorTooltip")?.classList.remove("is-visible");
}

function centerRoom(roomId) {
  const svg = getFloorSvg();
  const group = document.querySelector(`[data-room-key="${CSS.escape(normalizeRoomNumber(roomId))}"]`);
  if (!svg || !group || typeof group.getBBox !== "function" || !planState.fullViewBox) return;

  const bbox = group.getBBox();
  const nextScale = Math.max(planState.scale || 1, 2.2);
  const width = planState.fullViewBox.width / nextScale;
  const height = planState.fullViewBox.height / nextScale;

  planState.scale = nextScale;
  planState.viewBox = {
    x: bbox.x + bbox.width / 2 - width / 2,
    y: bbox.y + bbox.height / 2 - height / 2,
    width,
    height,
  };
  applyFloorViewBox(svg);
}

function uniqueRoomValues(field) {
  return [...new Set(rooms.map((room) => room[field]).filter(Boolean))].sort((a, b) =>
    String(a).localeCompare(String(b), "ru", { numeric: true }),
  );
}

function renderFilterOptions(values) {
  return values.map((value) => `<option value="${escapeHtml(value)}">${escapeHtml(value)}</option>`).join("");
}

function renderRoomsSection() {
  const purposes = uniqueRoomValues("purpose");
  const departments = uniqueRoomValues("department");

  return `
    <section class="section">
      <div class="data-toolbar">
        <h2>Аудитории этажа</h2>
        <div class="topbar__actions">
          <select class="input" id="purposeFilter" aria-label="Фильтр по назначению аудитории">
            <option value="">Все назначения</option>
            ${renderFilterOptions(purposes)}
          </select>
          <select class="input" id="departmentFilter" aria-label="Фильтр по кафедре">
            <option value="">Все кафедры</option>
            ${renderFilterOptions(departments)}
          </select>
          <input class="input" id="roomSearch" type="search" placeholder="Найти аудиторию на этаже" autocomplete="off" />
        </div>
      </div>
      ${renderRoomsTable(rooms)}
    </section>
  `;
}

function renderEmptyData() {
  return `
    <section class="section">
      <h2>Схема этажа</h2>
      <div class="empty-state">
        <strong>Этажи для этого корпуса пока не заполнены</strong>
        <span>После добавления данных здесь появятся схема кабинетов и список аудиторий.</span>
      </div>
    </section>
  `;
}

function attachRoomFilters() {
  const search = document.querySelector("#roomSearch");
  const purposeFilter = document.querySelector("#purposeFilter");
  const departmentFilter = document.querySelector("#departmentFilter");
  const tbody = document.querySelector("#roomsTableBody");

  if (!search || !purposeFilter || !departmentFilter || !tbody) return;

  function applyFilters() {
    const query = search.value.trim();
    const purpose = purposeFilter.value;
    const department = departmentFilter.value;
    const filtered = rooms.filter((room) => {
      const samePurpose = !purpose || room.purpose === purpose;
      const sameDepartment = !department || room.department === department;
      return samePurpose && sameDepartment && roomMatches(room, query);
    });
    tbody.innerHTML = renderRoomRows(filtered);
  }

  purposeFilter.addEventListener("change", applyFilters);
  departmentFilter.addEventListener("change", applyFilters);
  search.addEventListener("input", () => {
    applyFilters();
  });
}
