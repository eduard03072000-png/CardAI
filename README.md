<div align="center">

<img src="https://img.shields.io/badge/CardAI-FF4D6D?style=for-the-badge&logo=sparkles&logoColor=white" alt="CardAI" height="40"/>

# CardAI — AI-генератор карточек товаров

**Генерируй карточки для Wildberries, Ozon и Авито за 30 секунд**

[![Next.js](https://img.shields.io/badge/Next.js_15-black?style=flat-square&logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Groq AI](https://img.shields.io/badge/Groq_AI-F55036?style=flat-square&logo=lightning&logoColor=white)](https://groq.com)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow?style=flat-square)](LICENSE)

[🚀 Демо](http://198.13.184.39) · [📖 Документация](#документация) · [🐛 Баги](https://github.com/eduard03072000-png/CardAI/issues)

![CardAI Preview](https://img.shields.io/badge/Live-198.13.184.39-22D3A0?style=for-the-badge&logo=vercel)

</div>

---

## ✨ Что умеет

| Фича | Описание |
|------|----------|
| 🤖 **AI-генерация** | Заголовок, описание, SEO-ключи — через Groq (LLaMA 3) |
| 📸 **Анализ фото** | Загрузи до 15 фотографий — AI сам распознает товар |
| 📊 **SEO-оценка** | Скоринг карточки с рекомендациями по улучшению |
| 📝 **3 варианта заголовков** | Под разные маркетинговые стратегии |
| 📥 **Excel-экспорт** | Готовый файл для загрузки напрямую на WB / Ozon |
| 🛍 **WB + Ozon + Авито** | Адаптация под каждую платформу |
| 🔐 **Авторизация по SMS** | OTP через телефон или email |
| 👁 **Публичный просмотр** | Примеры карточек без регистрации |

---

## 🖥 Стек технологий

```
Frontend        Next.js 15 (App Router) · React 18 · TypeScript
Стили           Tailwind CSS · CSS-in-JS (inline styles)
AI              Groq API (LLaMA 3.3 70B) · Vision API
Авторизация     OTP (SMS / Email) · Cookie-сессии
Экспорт         SheetJS (xlsx)
Деплой          Ubuntu VPS · PM2 · Nginx · Node.js
```

---

## 🚀 Быстрый старт

### 1. Клонируй репозиторий

```bash
git clone https://github.com/eduard03072000-png/CardAI.git
cd CardAI
```

### 2. Установи зависимости

```bash
npm install
```

### 3. Настрой окружение

```bash
cp .env.example .env.local
```

Заполни `.env.local`:

```env
# Режим разработки (OTP-код виден в ответе API)
DEV_MODE=true

# Groq API — получи ключ на https://console.groq.com
GROQ_API_KEY=your_groq_api_key

# SMS (опционально, только для продакшна)
# SMSC_LOGIN=your_login
# SMSC_PASSWORD=your_password
```

### 4. Запусти

```bash
npm run dev
```

Открой [http://localhost:3000](http://localhost:3000)

---

## 📦 Деплой на сервер

В репозитории есть готовый скрипт `deploy.py` (требует `paramiko`):

```bash
pip install paramiko
python deploy.py
```

Скрипт автоматически:
- Загружает файлы на сервер по SFTP
- Запускает `npm install` и `npm run build`
- Перезапускает процесс через PM2
- Перезагружает Nginx

---

## 📁 Структура проекта

```
CardAI/
├── app/
│   ├── api/
│   │   ├── auth/
│   │   │   ├── send-otp/     # Отправка OTP-кода
│   │   │   ├── verify-otp/   # Верификация кода
│   │   │   └── logout/       # Выход
│   │   └── generate/         # AI-генерация карточки
│   ├── dashboard/
│   │   ├── page.tsx          # Серверная страница (сессия)
│   │   └── DashboardClient.tsx  # Главный UI (878 строк)
│   ├── login/
│   │   ├── page.tsx          # Страница входа
│   │   └── StarfieldBg.tsx   # Анимированный фон
│   ├── layout.tsx
│   └── page.tsx
├── lib/
│   ├── session.ts            # Управление сессиями
│   ├── store.ts              # Файловое хранилище (dev)
│   ├── otp.ts                # OTP логика
│   ├── sms.ts                # SMS-провайдеры
│   ├── excel.ts              # Экспорт в Excel
│   └── types.ts              # TypeScript типы
├── deploy.py                 # Скрипт деплоя
└── .env.example              # Пример конфига
```

---

## 🔑 API

### `POST /api/auth/send-otp`
Отправляет OTP на телефон или email.
```json
{ "phone": "+79991234567" }
```

### `POST /api/auth/verify-otp`
Верифицирует код и создаёт сессию.
```json
{ "phone": "+79991234567", "code": "1234" }
```

### `POST /api/generate`
Генерирует карточку товара через AI.
```json
{
  "platform": "wb",
  "productName": "Кроссовки Nike Air Max",
  "category": "Обувь / Кроссовки",
  "price": "3490",
  "images": ["data:image/jpeg;base64,..."]
}
```

---

## 🤝 Контрибьютинг

1. Fork репозитория
2. Создай ветку: `git checkout -b feature/amazing-feature`
3. Закоммить: `git commit -m 'Add amazing feature'`
4. Запушить: `git push origin feature/amazing-feature`
5. Открой Pull Request

---

## 📄 Лицензия

MIT © [Eduard](https://github.com/eduard03072000-png)

---

<div align="center">
<sub>Сделано с ❤️ для продавцов на маркетплейсах</sub>
</div>
