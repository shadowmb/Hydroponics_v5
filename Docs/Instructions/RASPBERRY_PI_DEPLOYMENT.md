# 🚀 Инструкции за Деплой на Raspberry Pi 5

Това ръководство описва стъпките за стартиране на Hydroponics v5 системата върху Raspberry Pi 5 (или 4 с 4GB+ RAM), използвайки Docker.

## 📋 Изисквания
- **Raspberry Pi 5** (препоръчително) или Pi 4.
- **ОС:** Raspberry Pi OS (64-bit) Bookworm или Ubuntu Server 22.04/24.04 LTS (64-bit).
- Връзка с интернет.

---

## 1. Свързване и Клониране

### Свързване чрез SSH
Преди да започнете, трябва да достъпите терминала на вашето Raspberry Pi. Ако не сте го направили:

1. Отворете Command Prompt (Windows) или Terminal (Mac/Linux).
2. Изпълнете командата:
   ```bash
   ssh user@raspberrypi.local
   # или ssh user@<IP-ADDRESS>
   ```
   *(Заменете `user` с вашия потребител, обикновено е `pi` или този, който сте създали при инсталацията).*
3. Въведете паролата си при поискване.

### Клониране на Репозиторито
След като сте вътре, изтеглете кода:

```bash
# Отидете в домашната директория
cd ~

# Клонирайте проекта (заменете URL с актуалния за вашето репо)
git clone https://github.com/YOUR_USER/Hydroponics_v5.git hydroponics

# Влезте в директорията
cd hydroponics
```

---

## 2. Инсталиране на Docker и Docker Compose

Най-лесният начин е чрез официалния скрипт на Docker:

```bash
# 1. Изтегляне и стартиране на инсталационния скрипт
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# 2. Добавяне на текущия потребител към групата docker (за да не ползвате sudo постоянно)
sudo usermod -aG docker $USER

# 3. ВАЖНО: Излезте и влезте отново (Logout/Login) или рестартирайте Pi-то
# sudo reboot
```

Проверка дали работи:
```bash
docker version
docker compose version
```

---

## 3. Стартиране на Системата

Използваме специално подготвения файл `docker-compose.rpi.yml`, който е оптимизиран за ARM64 архитектурата на Raspberry Pi (използва `mongo:7` вместо старите версии).

```bash
# Стартиране във фонов режим (-d) с изграждане на контейнерите (--build)
docker compose -f docker-compose.rpi.yml up --build -d
```

⏳ *Първото стартиране ще отнеме няколко минути, докато се изтеглят images и се компилира кода.*

**Адреси за достъп:**
- **Web Интерфейс:** `http://<IP-на-Raspberry-Pi>` (Port 80)
- **Backend API:** `http://<IP-на-Raspberry-Pi>:3000`

---

## 4. Опция: Стартиране със Симулатор

Ако нямате свързани сензори и искате да тествате логиката със софтуерния симулатор:

```bash
# Добавяме профил "sim"
docker compose -f docker-compose.rpi.yml --profile sim up --build -d
```

- **Симулатор GUI:** `http://<IP-на-Raspberry-Pi>:3001`
- **UDP Порт:** 8888

---

## 5. Полезни Команди и Поддръжка

### 🔍 Преглед на логовете (за дебъгване)
```bash
# Следене на всички логове в реално време
docker compose -f docker-compose.rpi.yml logs -f

# Логове само на Backend-а
docker compose -f docker-compose.rpi.yml logs -f backend
```

### 🛑 Спиране на системата
```bash
docker compose -f docker-compose.rpi.yml down
```

### 🔄 Обновяване (при промени в кода)
```bash
# 1. Изтегляне на новия код
git pull origin main

# 2. Рестарт с прекомпилиране
docker compose -f docker-compose.rpi.yml up --build -d
```

### 📦 База данни
Данните от MongoDB се запазват автоматично във Docker volume (`mongo-data`), така че не се губят при рестарт на контейнерите.

---

## 💡 Бележки за Deployment

- **Mongo Версия:** На Raspberry Pi 5 (ARM64) използваме модерната версия `mongo:7.0`. Няма нужда от старите версии (4.4), които ползвахме на PC заради AVX ограниченията.
- **Port 80:** Уверете се, че нямате друго работещо web приложение (като Apache/Nginx) на порт 80, или променете порта в `docker-compose.rpi.yml` (напр. `"8080:80"`).
