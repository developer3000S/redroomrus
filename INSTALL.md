# Руководство по развертыванию: Docker и Продакшн

Это руководство содержит инструкции по развертыванию платформы Redroom с использованием Docker-контейнеров.

## 1. Предварительные требования
- **Docker** и **Docker Compose** (рекомендуется V2).
- Доступ к интернету (для загрузки образов и зависимостей).
- Директория `server/_core` должна присутствовать в репозитории (она содержит движок рантайма).

## 2. Настройка окружения
Скопируйте файл `.env.example` в `.env` и заполните необходимые секреты:

```bash
cp .env.example .env
```

Основные переменные для настройки:
- `JWT_SECRET`: Случайная строка для подписи сессий.
- `ADMIN_SECRET_KEY`: Случайная строка для доступа к CMS.
- `DATABASE_URL`: При использовании Docker Compose этот параметр предварительно настроен как `postgres://redroom_user:redroom_password@db:5432/redroom`.

## 3. Быстрый старт (Docker Compose)

Чтобы собрать и запустить весь стек (приложение + PostgreSQL):

```bash
docker compose up -d --build
```

Приложение будет доступно по адресу `http://localhost:5000`.

## 4. Миграции базы данных
После запуска контейнеров выполните миграции для настройки схемы базы данных:

```bash
docker compose exec app pnpm db:push
```

## 5. Начальное наполнение данными (Опционально)
Чтобы наполнить базу данных начальными разведданными, агентствами и объектами:

```bash
# Общий сид
docker compose exec app pnpm exec tsx server/seed.ts

# Специфические сиды (примеры)
docker compose exec app pnpm exec tsx scripts/seed-all-countries.mjs
docker compose exec app pnpm exec tsx scripts/seed-global-agencies.mjs
```

## 6. Мониторинг и логи
Для просмотра логов:
```bash
docker compose logs -f app
```

Чтобы проверить статус контейнеров:
```bash
docker compose ps
```

## 7. Ручная сборка Docker
Если вы хотите собрать образ вручную без Docker Compose:

```bash
docker build -t redroom-app .
docker run -p 5000:5000 --env-file .env redroom-app
```

## 8. Автономное развертывание (Air-Gapped)
Для развертывания в изолированных сетях обратитесь к [Руководству по Air-Gapped развертыванию](./docs/AIRGAP.md).
