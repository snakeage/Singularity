# ADR 0003: Firebase Auth + Firestore character save

## Status

Accepted

## Context

После деплоя на Vercel нужен один сейв на телефон и комп. localStorage остаётся быстрым кэшем; ручной JSON-бэкап сохраняем.

## Decision

1. Firebase Spark: Email/Password + Google Auth.
2. Один документ Firestore `users/{uid}` с обёрткой бэкапа (`kind`, `savedAt`, `data: AppData`).
3. localStorage — источник правды на устройстве; при входе — merge last-write-wins по `savedAt`.
4. Пока пользователь вошёл, локальные изменения debounce-пушатся в облако (~1.2 с).
5. Без Firebase env приложение работает как раньше (только localStorage).

## Consequences

- Плюс: sync между устройствами без своего бэкенда.
- Плюс: бесплатно для одного пользователя (Spark quotas).
- Минус: нужен аккаунт Firebase + env на Vercel.
- Минус: v1 не мержит поля — побеждает более новый `savedAt`.
