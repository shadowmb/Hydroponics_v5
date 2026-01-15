---
name: hydro-diagnostics
description: Expert Troubleshooter and System Doctor for Hydroponics v5. Use this skill when the user reports bugs, crashes, "Zombie" processes, or data inconsistencies.
---

# Hydroponics v5 - Diagnostics & Troubleshooting Specialist

This skill provides a structured approach and toolset for diagnosing complex system issues. When you are in "Medical Mode" (fixing bugs), follow these protocols.

## 🩺 Diagnostic Protocols

### 1. The "Zombie" Protocol (Stuck Sessions)
**Symptoms:** System Health says "Zombie", Program is running but nothing happens, Logs stop abruptly.
**Diagnosis:**
1.  **Check DB vs Memory:** Compare `ActiveProgramModel`/`ExecutionSessionModel` status in DB against `automation.getStatus()` in runtime.
2.  **Check Logs:** Look for `Safe Shutdown` logs. If missing, the process crashed before cleanup.
3.  **Remedy:**
    - Use API: `POST /api/system/state/fix` (Backend SystemController).
    - Use Script: Run `npm run verify-zombies` (if available) or create a targeted script.

### 2. The "Ghost Data" Protocol (Missing/Corrupt Data)
**Symptoms:** "Item not found", `null` in logs, Mongoose CastError.
**Diagnosis:**
1.  **ID Inspection:** Check if the ID is a String (`"some-id"`) or ObjectId (`65a...`). Legacy data often mixes these.
2.  **Raw DB Check:** Mongoose often hides data that doesn't match the Schema. Use `mongoose.connection.db.collection('...').findOne()` to see the *raw* truth.

### 3. The "Silent Failure" Protocol (Frontend)
**Symptoms:** Button clicked, nothing happens, no Toast error.
**Diagnosis:**
1.  **Console Check:** Check Browser Console for 404s or JS errors.
2.  **Network Tab:** Did the request go out? Was the payload correct?
3.  **Docker Logs:** Check `docker compose logs -f backend`. Backend might have crashed silently (or updated status to 'error' without notifying frontend).

## 🛠️ Diagnostic Toolkit (Scripts)

When debugging, prefer creating **Temporary Diagnostic Scripts** over guessing.

### Script Template: `diagnose_state.js`
Use this template to bypass the API layers and inspect the raw DB state.

```javascript
// diagnose_state.js
const mongoose = require('mongoose');

// CONFIG
const MONGO_URI = "mongodb://localhost:27017/hydroponics";

async function run() {
    await mongoose.connect(MONGO_URI);
    console.log("🔌 Connected to DB");

    // 1. Inspect Raw Sessions
    const sessions = await mongoose.connection.db.collection('executionsessions').find({ status: 'running' }).toArray();
    console.log("🏃 Running Sessions (Raw):", sessions);

    // 2. Inspect Programs
    const programs = await mongoose.connection.db.collection('activeprograms').find({ status: 'running' }).toArray();
    console.log("📅 Running Programs:", programs);

    await mongoose.disconnect();
}

run().catch(console.error);
```

## 🚨 Emergency Procedures

### Force Shutdown (Backend)
If the backend is stuck in a loop:
1.  **Kill Port:** `npx kill-port 3000` (Windows/Linux).
2.  **Docker Restart:** `docker compose restart backend`.

### Clear "Dirty" State
If testing data is corrupting the view:
1.  **Soft Delete Cleanup:** Run a script to set `deletedAt` for all suspected corrupt records.
2.  **Hard Reset (Dev Only):** Drop collection: `db.collection.drop()`.

## 🧠 Mindset
- **Trust No One:** The Frontend lies. The Cache lies. The DB is usually the truth, but sometimes even Mongoose lies (Schema filtering).
- **Verify First:** Don't write a fix until you have **reproduced** the issue or seen the error log.
- **Log Everything:** If you can't see it, you can't fix it. Add `logger.info` with specific context IDs before fixing.
