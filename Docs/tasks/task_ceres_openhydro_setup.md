# Task: Ceres - OpenHydro Distribution Setup

## 🎯 Objective
Establish a secure and automated workflow to publish the "Hydroponics v5" codebase as a clean, open-source project named "**Ceres - OpenHydro**". This involves creating a synchronization mechanism that selectively copies files from the development repository to a distribution repository, ensuring no sensitive data or development history is leaked.

## 📦 Project Identity
- **Internal Name:** Hydroponics v5
- **Public Name:** Ceres
- **Tagline:** OpenHydro Platform
- **Public Repo Name:** `ceres-openhydro`

## 🛠 Architecture
We will use a **"One-Way Sync"** strategy:
1.  **Source (Dev):** `C:\Projects\Hydroponics_v5` (Contains full history, secrets, agent memory).
2.  **Middleware:** A custom Node.js script (`scripts/publish-ceres.js`) to filter and verify files.
3.  **Destination (Dist):** `C:\Projects\Ceres-OpenHydro` (Clean folder, linked to public GitHub).

## 📋 Implementation Plan

### Phase 1: The Publisher Script (`scripts/publish-ceres.js`)
Create a robust Node.js script that handles the "build" process for the public release.

#### 1. Configuration & Safety
- [ ] Define `SOURCE_DIR` and `DEST_DIR` (must be configurable or relative).
- [ ] Implement a **"Dry Run"** mode (default) to show what will be copied without touching files.
- [ ] Safety Check: Ensure `DEST_DIR` is NOT the same as `SOURCE_DIR`.

#### 2. Filtering Logic (The Whitelist)
Only explicitly allowed folders/files will be copied.
- **Include:**
    - `src/` (The core application code)
    - `public/` (Static assets)
    - `scripts/` (Only specific public scripts, NOT the publisher itself if possible, or maybe include it for transparency)
    - `package.json`, `tsconfig.json`, `.eslintrc.json`, `vite.config.ts`, `tailwind.config.js`
    - `README.md`, `LICENSE`
- **Exclude (Blacklist):**
    - `node_modules/`
    - `.git/` (CRITICAL)
    - `.env` (CRITICAL)
    - `.agent/` (Internal agent memory)
    - `docs/tasks/` (Internal task management)
    - `tmp/`, `backups/`, `logs/`
    - `*.log`
    - `creds/` or any other sensitive folders

#### 3. Data Sanitization & Transformation
- [ ] **Package.json:**
    - Read `package.json`.
    - Change `name` to `ceres-openhydro`.
    - Reset `version` to `1.0.0-beta.1` (or keep synced).
    - Remove private scripts if any.
- [ ] **Config Files:**
    - Ensure `config/` doesn't contain hardcoded local IP addresses or keys.
    - Generate a sample `.env.example` if one doesn't exist.

### Phase 2: Execution & Git Setup
#### 1. Prepare Destination
- [ ] Create `C:\Projects\Ceres-OpenHydro` manually or via script.
- [ ] Initialize new Git repo: `git init`.

#### 2. Run Sync
- [ ] Execute `node scripts/publish-ceres.js`.
- [ ] Verify content in Destination.
- [ ] Check for leaked secrets manually.

#### 3. Public Release
- [ ] Create GitHub Repository: `ceres-openhydro`.
- [ ] Commit in Destination: `git add . && git commit -m "Initial Release: Ceres v1.0 (Beta)"`.
- [ ] Add Remote & Push: `git remote add origin ... && git push -u origin main`.

## 🛡 Security Rules (Agent Protocol)
1.  **Never push from Source (`_v5`) to Public Remote.**
2.  **Always `dry-run` the script first.**
3.  **Double-check `.gitignore` in the Destination repo.**

## 📝 Next Steps
1.  Create the `scripts/publish-ceres.js` file.
2.  Review the file list it produces in Dry Run.
3.  Execute the migration.
