# Singularity

Личный учебный веб-трекер достижения цели: глобальная мечта → честная точка А → этапы → рубежи и практики → недельный обзор.

Модель вдохновлена путём Ника из серии «Землянин» (Р. Злотников) и совмещена с проверенными методиками целеполагания и привычек.

## Статус

Рабочий MVP в браузере. Данные хранятся локально (`localStorage`); бэкап персонажа — JSON-файл.

## Запуск

```bash
npm install
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000).

## Экраны

| Путь | Назначение |
| --- | --- |
| `/` | Сегодня — практики активного этапа |
| `/map` | Карта пути: старт → этапы → мечта |
| `/dream` | Мечта, «где я сейчас», этапы, препятствия/планы |
| `/stage` | Рубежи, практики, источники роста (в т.ч. ИИ) |
| `/review` | Недельный обзор + окна обучения |
| `/data` | Экспорт / импорт сейва персонажа |

## Документация

| Документ | О чём |
| --- | --- |
| [docs/vision.md](docs/vision.md) | Зачем проект, для кого, границы |
| [docs/methodology.md](docs/methodology.md) | Лестница Ника + методики |
| [docs/mythology-network.md](docs/mythology-network.md) | Сеть, базы, капсула — продуктовый канон |
| [docs/glossary.md](docs/glossary.md) | Термины |
| [docs/requirements-mvp.md](docs/requirements-mvp.md) | User stories MVP |
| [docs/data-model.md](docs/data-model.md) | Сущности и связи |
| [docs/backlog.md](docs/backlog.md) | Идеи после MVP |
| [docs/art-direction.md](docs/art-direction.md) | Визуальный канон moment-диалогов |
| [docs/decisions/](docs/decisions/) | ADR |

## Хранение данных

- Живые данные: браузерный `localStorage` (ключ `singularity.appData.v1`)
- Бэкап: JSON «сейв персонажа» (не код проекта) — кнопки на экране **Данные**
- Импорт полностью заменяет текущие данные
