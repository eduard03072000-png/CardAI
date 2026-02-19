# CardAI — AI-генератор карточек товаров

<div align="center">

![CardAI](https://img.shields.io/badge/CardAI-FF4D6D?style=for-the-badge&logo=sparkles&logoColor=white)
![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=for-the-badge&logo=next.js&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white)
![Tailwind](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-22d3a0?style=for-the-badge)

**Генерируй карточки товаров для WB, Ozon и Авито за 30 секунд**

[🚀 Демо](http://198.13.184.39) · [🐛 Баги](https://github.com/eduard03072000-png/CardAI/issues) · [💡 Предложения](https://github.com/eduard03072000-png/CardAI/issues)

</div>

---

## ✦ О проекте

**CardAI** — это веб-приложение на базе AI, которое автоматически генерирует продающие карточки товаров для маркетплейсов. Просто укажи название товара, характеристики и нажми кнопку — через 30 секунд получишь готовый заголовок, описание, SEO-ключи и файл Excel для загрузки.

### Для кого

| Кто | Зачем |
|-----|-------|
| 🏪 Продавцы на WB | Экономия 38+ минут на каждой карточке |
| 🔵 Продавцы на Ozon | Автозаполнение всех обязательных полей |
| 🟡 Продавцы на Авито | SEO-оптимизированные описания |
| 📦 Оптовики | Массовая генерация через Excel-шаблон |

---

## 🎯 Возможности

- **🤖 AI-генерация** — заголовок, описание, ключевые слова и характеристики одним кликом
- **📸 Анализ фотографий** — загрузи до 15 фото, AI распознает товар сам
- **🛍 WB + Ozon + Авито** — отдельные шаблоны под требования каждого маркетплейса
- **📊 SEO-анализ** — оценка карточки по 100-балльной шкале с рекомендациями
- **📝 3 варианта заголовков** — под разные стратегии продаж
- **📥 Excel-экспорт** — готовый файл для загрузки в личный кабинет WB/Ozon
- **🔐 Авторизация по SMS/email** — без паролей
- **🌐 Открытый доступ** — примеры карточек видны без регистрации

---

## 🖥 Скриншоты

<div align="center">

| Генератор | Готовая карточка |
|-----------|-----------------|
| Форма с полями товара | Заголовок + описание + SEO |

| SEO-анализ | История |
|------------|---------|
| Оценка по 100 баллов | Все сгенерированные карточки |

</div>

---

## 🛠 Технологии

```
Frontend:    Next.js 15 (App Router) + TypeScript + Tailwind CSS
Auth:        OTP по SMS/email (без паролей)
AI:          Claude API (Anthropic)
Storage:     File-based (JSON) — для dev/MVP
Deploy:      VPS + PM2 + Nginx
```

---

## 🚀 Запуск локально

### Требования

- Node.js 18+
- npm / yarn

### Установка

```bash
# Клонировать репозиторий
git clone https://github.com/eduard03072000-png/CardAI.git
cd CardAI

# Установить зависимости
npm install

# Создать .env.local (скопировать пример)
cp .env.local.example .env.local
# Заполнить переменные окружения
```

### Переменные окружения

```env
# Anthropic API для генерации карточек
ANTHROPIC_API_KEY=sk-ant-...

# Режим разработки (показывает OTP-код прямо на экране)
DEV_MODE=true

# SMS-провайдер (опционально, без него работает в DEV_MODE)
SMS_API_KEY=...
```

### Запуск

```bash
# Разработка
npm run dev

# Продакшн
npm run build
npm start
```

Открой [http://localhost:3000](http://localhost:3000)

---

## 📁 Структура проекта

```
CardAI/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-otp/     # Отправка кода подтверждения
│   │   │   ├── verify-otp/   # Проверка кода
│   │   │   └── logout/       # Выход
│   │   └── generate/         # AI-генерация карточки
│   ├── dashboard/            # Главная страница (генератор)
│   ├── login/                # Страница входа
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── types.ts              # TypeScript типы
│   ├── session.ts            # Управление сессиями
│   ├── otp.ts                # OTP логика
│   ├── sms.ts                # SMS-отправка
│   ├── store.ts              # File-based хранилище
│   └── excel.ts              # Генерация Excel
├── public/
├── deploy.py                 # Деплой на VPS одной командой
└── next.config.js
```

---

## 🚢 Деплой на VPS

В проекте есть готовый скрипт `deploy.py` — он загружает файлы, собирает проект и перезапускает PM2:

```bash
python deploy.py
```

Скрипт автоматически:
1. Загружает файлы по SFTP
2. Запускает `npm install` и `npm run build`
3. Перезапускает процесс в PM2
4. Проверяет конфиг Nginx и перезагружает его

---

## 🗺 Roadmap

- [ ] Массовая загрузка через CSV
- [ ] История карточек в базе данных
- [ ] Интеграция с WB API (авто-загрузка)
- [ ] Интеграция с Ozon API
- [ ] Личный кабинет со статистикой
- [ ] Telegram-бот
- [ ] Мобильное приложение

---

## 🤝 Вклад в проект

Pull request'ы приветствуются! Для крупных изменений сначала открой issue.

1. Fork проекта
2. Создай ветку (`git checkout -b feature/cool-feature`)
3. Commit изменения (`git commit -m 'Add cool feature'`)
4. Push в ветку (`git push origin feature/cool-feature`)
5. Открой Pull Request

---

## 📄 Лицензия

MIT © [Eduard](https://github.com/eduard03072000-png)

---

<div align="center">

Сделано с ❤️ для продавцов на маркетплейсах

**[⭐ Поставь звезду, если проект полезен!](https://github.com/eduard03072000-png/CardAI)**

</div>
