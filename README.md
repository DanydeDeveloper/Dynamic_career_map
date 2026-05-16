# Dynamic Career Map

MVP веб-приложения для Private.Education: динамическая профориентационная карта школьника 5-7 класса.

Система помогает педагогу вести профиль ученика, фиксировать диагностику, планировать мероприятия, собирать обратную связь и согласовывать предложения изменений перед обновлением траектории.

## Стек

- Next.js + TypeScript
- Prisma + PostgreSQL
- Auth.js
- Supabase PostgreSQL для нормального окружения
- React server components

## Локальный запуск

```bash
npm install
copy .env.example .env
npm run prisma:generate
npm run db:init
npm run db:seed
npm run dev
```

Для локального запуска теперь нужен PostgreSQL/Supabase connection string в `DATABASE_URL`.

Тестовые аккаунты после seed:

```txt
admin@private.education / password123
curator@private.education / password123
parent@example.com / password123
student@example.com / password123
```

## Vercel

Для деплоя в Vercel нужно добавить переменные окружения:

```txt
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
AUTH_SECRET=...
AUTH_URL=https://your-project.vercel.app
```

После подключения Supabase/PostgreSQL нужно применить схему:

```bash
npm run db:init
npm run db:seed
```

## Принципы MVP

- Без авторизации: первый запуск работает как единый кабинет педагога.
- Данные хранятся локально в SQLite.
- AI-слой не изменяет профиль напрямую: он формирует предложения, педагог подтверждает решения.
- Автоматический парсинг сайтов не входит в первый этап.
