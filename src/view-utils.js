import { GMI_DATA } from "./gmi-data.js";

export { GMI_DATA };

export function getParsedBuildingData(buildingId) {
  return GMI_DATA.buildings[buildingId] || null;
}

export function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function getQueryParam(name, fallback = "") {
  return new URLSearchParams(window.location.search).get(name) || fallback;
}

export function statusLabel(buildingId, status) {
  const data = getParsedBuildingData(buildingId);
  if (data && status === "ready") return "Данные";
  if (data) return "Частично";
  return "Позже";
}

export function statusClass(buildingId, status) {
  const data = getParsedBuildingData(buildingId);
  if (data && status === "ready") return "badge--ready";
  if (data) return "badge--partial";
  return "";
}

export function roomMatches(room, query) {
  if (!query) return true;
  const haystack = [
    room.room,
    room.purpose,
    room.department,
    room.responsible,
    room.sourceFloor,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query.toLowerCase());
}

export function renderRoomRows(rooms) {
  if (!rooms.length) {
    return `<tr><td colspan="7">Нет аудиторий по текущему фильтру</td></tr>`;
  }

  return rooms
    .map(
      (room) => `
        <tr data-room-row="${escapeHtml(room.room)}">
          <td>${escapeHtml(room.room)}</td>
          <td>${escapeHtml(room.sourceFloor)}</td>
          <td>${escapeHtml(room.area || "—")}</td>
          <td>${escapeHtml(room.seats ?? "—")}</td>
          <td class="room-purpose">${escapeHtml(room.purpose || "—")}</td>
          <td>${escapeHtml(room.department || "—")}</td>
          <td>${escapeHtml(room.responsible || "—")}</td>
        </tr>
      `,
    )
    .join("");
}

export function renderRoomsTable(rooms) {
  return `
    <div class="table-wrap">
      <table>
        <thead>
          <tr>
            <th>Аудитория</th>
            <th>Этаж</th>
            <th>Площадь</th>
            <th>Места</th>
            <th>Назначение</th>
            <th>Кафедра</th>
            <th>Ответственный</th>
          </tr>
        </thead>
        <tbody id="roomsTableBody">${renderRoomRows(rooms)}</tbody>
      </table>
    </div>
  `;
}
