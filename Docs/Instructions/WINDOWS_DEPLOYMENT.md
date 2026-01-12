# 🪟 Инструкции за Деплой на Windows (Docker Desktop)

Това ръководство описва стъпките за стартиране на Hydroponics v5 системата върху Windows машина (Сървър или Workstation), използвайки Docker.

## 📋 Изисквания
- **OS:** Windows 10/11 Pro/Enterprise или Windows Server 2019/2022.
- **CPU:** Модерен процесор (поддържащ AVX инструкции - почти всички след 2011 г.).
- **Docker:** Инсталиран Docker Desktop за Windows.
- **Virtualization:** Включена виртуализация (Hyper-V / WSL2) в BIOS.

---

## 1. Инсталиране на Docker Desktop

Ако нямате инсталиран Docker:
1. Изтеглете [Docker Desktop for Windows](https://www.docker.com/products/docker-desktop/).
2. Инсталирайте го, като се уверите, че опцията за **WSL 2 backend** е избрана (препоръчително за по-добра производителност).
3. След инсталация, стартирайте Docker Desktop и изчакайте зелената икона.

---

## 2. Клониране на Репозиторито

Използвайте Git Bash, PowerShell или Command Prompt:

```powershell
# Отидете в работна директория
cd C:\Projects

# Клонирайте проекта
git clone https://github.com/YOUR_USER/Hydroponics_v5.git
cd Hydroponics_v5
```

---

## 3. Стартиране на Системата

Използваме файла `docker-compose.win.yml`, който е оптимизиран за Windows с модерна база данни (`mongo:7.0`), избягвайки проблемите със стари версии.

**ВАЖНО:** Преди старт се уверете, че Docker Desktop работи.

```powershell
# Стартиране на основните услуги (Backend, Frontend, DB)
docker compose -f docker-compose.win.yml up --build -d
```

⏳ *Първото стартиране ще отнеме няколко минути.*

**Адреси за достъп:**
- **Web Интерфейс:** `http://localhost`
- **Backend API:** `http://localhost:3000`

---

## 4. Стартиране със Симулатор (Опционално)

Ако искате да пуснете и хардуерния симулатор:

```powershell
# Стартиране с профил 'sim'
docker compose -f docker-compose.win.yml --profile sim up --build -d
```

- **Симулатор GUI:** `http://localhost:3001`

---

## 5. Управление и Поддръжка

### 🔍 Преглед на логовете
Можете да гледате логовете директно в **Docker Desktop Dashboard** (като кликнете на контейнера) или чрез конзола:

```powershell
# Всички логове
docker compose -f docker-compose.win.yml logs -f

# Логове на Backend
docker compose -f docker-compose.win.yml logs -f backend
```

### 🛑 Спиране на системата
```powershell
docker compose -f docker-compose.win.yml down
```
*(Това спира контейнерите, но запазва базата данни).*

### 🧹 Изчистване на данни (Пълно нулиране)
Ако искате да изтриете базата данни и да започнете на чисто:
```powershell
docker compose -f docker-compose.win.yml down -v
```
*(Внимание: `-v` изтрива всички данни в MongoDB!)*

---

## 💡 Бележки
- **Mongo Версия:** Този setup използва `mongo:7.0`, което изисква процесор с AVX. Ако сте на много стара машина (преди 2011) и контейнерът на MongoDB се рестартира с код 132, трябва да използвате `docker-compose.yml` (със старата версия 4.4).
- **Firewall:** При първо стартиране Windows Firewall може да поиска разрешение за Docker vEthernet мрежата. Разрешете го.
