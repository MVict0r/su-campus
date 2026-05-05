import { buildingUrl, floorUrl, formatArea, formatNumber, getBuilding } from "./campus-data.js";
import {
  escapeHtml,
  getParsedBuildingData,
  getQueryParam,
  GMI_DATA,
  renderRoomRows,
  renderRoomsTable,
  roomMatches,
} from "./view-utils.js";

const page = document.querySelector("#buildingPage");
const buildingId = getQueryParam("id", "gmk");
const building = getBuilding(buildingId);
const parsed = getParsedBuildingData(buildingId);

if (!building) {
  page.innerHTML = `
    <nav class="breadcrumbs"><a href="./index.html">Карта</a><span>/</span><span>Корпус не найден</span></nav>
    <div class="empty-state">Такого корпуса пока нет в карте.</div>
  `;
} else {
  document.title = `${building.name} | Карта кампуса`;
  renderPage();
}

function renderPage() {
  const rooms = parsed?.rooms || [];
  const departments = new Set(rooms.map((room) => room.department).filter(Boolean));

  page.innerHTML = `
    <nav class="breadcrumbs">
      <a href="./index.html">Карта</a>
      <span>/</span>
      <span>${escapeHtml(building.name)}</span>
    </nav>

    <header class="page-header">
      <div class="page-title">
        <h1>${escapeHtml(building.name)}</h1>
        <p>${escapeHtml(building.code)} · ${escapeHtml(building.type)}</p>
      </div>
      <div class="topbar__actions">
        <a class="button" href="./index.html">← На карту</a>
        ${building.id !== "gmk" ? `<a class="button" href="${buildingUrl("gmk")}">Открыть ГМК</a>` : ""}
      </div>
    </header>

    ${renderStats(departments.size)}
    ${parsed ? renderFloorSection() : renderEmptyData()}
    ${parsed && building.id === "gmk" ? renderSummarySection() : ""}
    ${parsed ? renderRoomsSection() : ""}
  `;

  if (parsed) {
    attachRoomFilters();
  }
}

function renderStats(departmentCount) {
  return `
    <section class="stats-grid" aria-label="Показатели корпуса">
      <div class="stat">
        <span>Помещения</span>
        <strong>${parsed ? formatNumber(parsed.roomCount) : "—"}</strong>
      </div>
      <div class="stat">
        <span>Площадь</span>
        <strong>${parsed ? formatArea(parsed.areaM2) : "—"}</strong>
      </div>
      <div class="stat">
        <span>Посадочные места</span>
        <strong>${parsed ? formatNumber(parsed.seats) : "—"}</strong>
      </div>
      <div class="stat">
        <span>Кафедры</span>
        <strong>${parsed ? formatNumber(departmentCount) : "—"}</strong>
      </div>
    </section>
  `;
}

function renderFloorSection() {
  return `
    <section class="section">
      <h2>Этажи</h2>
      <div class="floor-grid">
        ${parsed.floors
          .map(
            (floor) => `
              <a class="floor-card" href="${floorUrl(building.id, floor.id)}">
                <strong>${escapeHtml(floor.label)}</strong>
                <span>${formatNumber(floor.roomCount)} помещений</span>
                <span>${formatArea(floor.areaM2)} · ${formatNumber(floor.seats)} мест</span>
              </a>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderSummarySection() {
  return `
    <section class="section">
      <h2>Сводка из документа</h2>
      <div class="floor-grid">
        ${GMI_DATA.summary
          .map(
            (row) => `
              <div class="summary-card">
                <strong>${escapeHtml(row.name)}</strong>
                <span>Количество: ${escapeHtml(row.count)}</span>
                <span>Площадь: ${escapeHtml(row.area)}</span>
              </div>
            `,
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderRoomsSection() {
  return `
    <section class="section">
      <div class="data-toolbar">
        <h2>Аудиторный фонд</h2>
        <div class="topbar__actions">
          <select class="input" id="floorFilter" aria-label="Фильтр по этажу">
            <option value="">Все этажи</option>
            ${parsed.floors.map((floor) => `<option value="${escapeHtml(floor.id)}">${escapeHtml(floor.label)}</option>`).join("")}
          </select>
          <input class="input" id="roomSearch" type="search" placeholder="Найти аудиторию, кафедру или ответственного" autocomplete="off" />
        </div>
      </div>
      ${renderRoomsTable(parsed.rooms)}
    </section>
  `;
}

function renderEmptyData() {
  return `
    <section class="section">
      <h2>Информация о корпусе</h2>
      <div class="empty-state">
        <strong>Данные будут добавлены позже</strong>
        <span>Страница уже готова для описания корпуса, этажей, аудиторий и схем кабинетов.</span>
      </div>
    </section>
  `;
}

function attachRoomFilters() {
  const floorFilter = document.querySelector("#floorFilter");
  const roomSearch = document.querySelector("#roomSearch");
  const tbody = document.querySelector("#roomsTableBody");

  function applyFilters() {
    const floorId = floorFilter.value;
    const query = roomSearch.value.trim();
    const filtered = parsed.rooms.filter((room) => {
      const sameFloor = !floorId || room.floorId === floorId;
      return sameFloor && roomMatches(room, query);
    });
    tbody.innerHTML = renderRoomRows(filtered);
  }

  floorFilter.addEventListener("change", applyFilters);
  roomSearch.addEventListener("input", applyFilters);
}
