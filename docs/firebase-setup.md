# Firebase setup (N17)

Личный облачный сейв: Auth + один документ Firestore на пользователя.

## 1. Создай проект

1. Открой [Firebase Console](https://console.firebase.google.com/)
2. **Add project** → имя например `singularity-personal`
3. Google Analytics можно выключить

## 2. Зарегистрируй Web app

1. Project overview → **Web** (`</>`)
2. Nickname: `singularity-web`
3. Скопируй config (`apiKey`, `authDomain`, `projectId`, …)

## 3. Auth

1. **Build → Authentication → Get started**
2. Включи **Email/Password**
3. Включи **Google** (укажи support email)

**Authorized domains** (Authentication → Settings):
- `localhost`
- `singularity-eight-dusky.vercel.app`
- (если сменишь домен Vercel — добавь его)

## 4. Firestore

1. **Build → Firestore Database → Create database**
2. Режим: **production**
3. Регион: ближайший (например `europe-west`)

Правила (**Rules** → Publish):

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

Документ: `users/{uid}` = `{ kind, savedAt, data }` (тот же сейв, что JSON-бэкап).

## 5. Env локально

Скопируй `.env.example` → `.env.local` и заполни:

```bash
cp .env.example .env.local
```

Перезапусти `npm run dev`.

## 6. Env на Vercel

Project **singularity** → **Settings → Environment Variables** → добавь те же `NEXT_PUBLIC_FIREBASE_*` для Production (и Preview по желанию).

**Deployments → … → Redeploy** последнего деплоя (чтобы подтянуть env).

## 7. Проверка

1. Открой сайт → **Данные** → «Облачный сейв»
2. Регистрация / Google
3. На втором устройстве войди тем же аккаунтом — сейв подтянется (last-write-wins по `savedAt`)
