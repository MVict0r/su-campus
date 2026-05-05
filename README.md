# SU Campus Map

Статический сайт с интерактивной SVG-картой кампуса.

## Запуск

```powershell
python -m http.server 8000 --bind 127.0.0.1
```

После запуска открыть:

```text
http://127.0.0.1:8000/index.html
```

## Структура

- `index.html` — главная страница с интерактивной картой.
- `building.html?id=gmk` — страница корпуса.
- `floor.html?building=gmk&floor=basement` — страница этажа.
- `assets/campus.svg` — SVG-карта кампуса.
- `assets/floors/` — схемы этажей, сейчас подключена `gmk-1.svg` для 1 этажа ГМК.
- `src/campus-data.js` — список корпусов и связь с SVG-группами.
- `src/gmi-data.js` — данные, извлеченные из Word-документа.
- `scripts/extract_gmi_data.py` — повторная генерация данных из DOCX.

## Обновление данных из Word

```powershell
python .\scripts\extract_gmi_data.py
```

Скрипт ищет документ с названием `Аудиторный фонд` в папке Downloads и обновляет `src/gmi-data.js`.
