export const BUILDINGS = [
  {
    id: "gyk",
    svgId: "gyk",
    number: "1-3",
    code: "ГУК",
    name: "Главный учебный корпус",
    type: "Учебный корпус",
    status: "partial",
  },
  {
    id: "group-4",
    svgId: "Group 4",
    number: "4",
    code: "К4",
    name: "Корпус №4",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "nk",
    svgId: "nk",
    number: "5",
    code: "НК",
    name: "Нефтяной корпус",
    type: "Учебный корпус",
    status: "partial",
  },
  {
    id: "gmk",
    svgId: "gmk",
    number: "6",
    code: "ГМК",
    name: "Горно-металлургический корпус",
    type: "Учебный корпус",
    status: "ready",
  },
  {
    id: "uni-hub",
    svgId: "uni-hub",
    number: "7",
    code: "Uni Hub",
    name: "Uni Hub",
    type: "Студенческое пространство",
    status: "placeholder",
  },
  {
    id: "group-8",
    svgId: "Group 8",
    number: "8",
    code: "К8",
    name: "Корпус №8",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "msk",
    svgId: "msk",
    number: "9",
    code: "МСК",
    name: "МСК",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "myk",
    svgId: "myk",
    number: "10",
    code: "МУК",
    name: "МУК",
    type: "Учебный корпус",
    status: "placeholder",
  },
  {
    id: "ims",
    svgId: "ims",
    number: "11",
    code: "ИМС",
    name: "ИМС",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "fab-lab",
    svgId: "fab-lab",
    number: "12",
    code: "Fab Lab",
    name: "Fab Lab",
    type: "Лабораторный корпус",
    status: "placeholder",
  },
  {
    id: "ictt",
    svgId: "ictt",
    number: "13",
    code: "ИЦТТ",
    name: "ИЦТТ",
    type: "Инженерный центр",
    status: "placeholder",
  },
  {
    id: "training-ground",
    svgId: "training-ground",
    number: "14",
    code: "Полигон",
    name: "Учебный полигон",
    type: "Практическая зона",
    status: "placeholder",
  },
  {
    id: "technopark",
    svgId: "technopark",
    number: "15",
    code: "Технопарк",
    name: "Технопарк",
    type: "Инновационный корпус",
    status: "placeholder",
  },
  {
    id: "ttk",
    svgId: "ttk",
    number: "16",
    code: "ТТК",
    name: "ТТК",
    type: "Учебно-лабораторный корпус",
    status: "partial",
  },
  {
    id: "voenka",
    svgId: "voenka",
    number: "17",
    code: "ВК",
    name: "Военная кафедра",
    type: "Учебный корпус",
    status: "placeholder",
  },
  {
    id: "group-18",
    svgId: "Group 18",
    number: "18",
    code: "К18",
    name: "Корпус №18",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "group-19",
    svgId: "Group 19",
    number: "19",
    code: "К19",
    name: "Корпус №19",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "dms",
    svgId: "dms",
    number: "20",
    code: "ДМС",
    name: "ДМС",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "group-22",
    svgId: "Group 22",
    number: "22",
    code: "К22",
    name: "Корпус №22",
    type: "Корпус",
    status: "placeholder",
  },
  {
    id: "field",
    svgId: "field",
    number: "",
    code: "Поле",
    name: "Спортивное поле",
    type: "Территория",
    status: "placeholder",
  },
];

export function getBuilding(id) {
  return BUILDINGS.find((building) => building.id === id);
}

export function getBuildingBySvgId(svgId) {
  return BUILDINGS.find((building) => building.svgId === svgId);
}

export function buildingUrl(id) {
  return `building.html?id=${encodeURIComponent(id)}`;
}

export function floorUrl(buildingId, floorId) {
  return `floor.html?building=${encodeURIComponent(buildingId)}&floor=${encodeURIComponent(floorId)}`;
}

export function formatArea(value) {
  if (!Number.isFinite(value)) return "—";
  return `${value.toLocaleString("ru-RU", { maximumFractionDigits: 1 })} м²`;
}

export function formatNumber(value) {
  if (!Number.isFinite(value)) return "—";
  return value.toLocaleString("ru-RU");
}
