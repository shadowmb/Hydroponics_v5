const fs = require('fs');
const path = require('path');

const BACKUP_FILE = 'c:\\Projects\\hydroponics_backup_2.json';

// Detect if value is { "$oid": "..." } wrapper
function isOidWrapper(val) {
    return val && typeof val === 'object' && val.$oid && typeof val.$oid === 'string';
}

// Convert to { "$oid": "..." } if strictly 24-char hex string
function toOidObject(val) {
    if (typeof val === 'string' && /^[0-9a-fA-F]{24}$/.test(val)) {
        return { "$oid": val };
    }
    // Already wrapped?
    if (isOidWrapper(val)) return val;
    return val;
}

// Unwrap to plain String if it's a wrapper, or keep string
function toPlainString(val) {
    if (isOidWrapper(val)) {
        return val.$oid;
    }
    return val;
}

function processFile() {
    try {
        const raw = fs.readFileSync(BACKUP_FILE, 'utf8');
        const json = JSON.parse(raw);
        const data = json.data;

        // 1. Controllers
        // Schema: _id (ObjectId)
        if (data.controllers) {
            data.controllers.forEach(c => {
                c._id = toOidObject(c._id);
            });
        }

        // 2. Relays
        // Schema: _id (ObjectId), controllerId (String ref based on pattern, likely StringSchema)
        if (data.relays) {
            data.relays.forEach(r => {
                r._id = toOidObject(r._id);
                // Refs -> String
                r.controllerId = toPlainString(r.controllerId);
            });
        }

        // 3. Devices
        // Schema: _id (ObjectId), hardware.parentId (String), hardware.relayId (String)
        if (data.devices) {
            data.devices.forEach(d => {
                d._id = toOidObject(d._id);

                if (d.hardware) {
                    // Refs -> String
                    if (d.hardware.parentId) d.hardware.parentId = toPlainString(d.hardware.parentId);
                    if (d.hardware.relayId) d.hardware.relayId = toPlainString(d.hardware.relayId);

                    // Pins: _id usually ObjectId substructure
                    if (d.hardware.pins && Array.isArray(d.hardware.pins)) {
                        d.hardware.pins.forEach(p => {
                            if (p._id) p._id = toOidObject(p._id);
                        });
                    }
                }

                // Config compensation externalDeviceId -> String
                if (d.config && d.config.compensation && d.config.compensation.temperature) {
                    if (d.config.compensation.temperature.externalDeviceId) {
                        d.config.compensation.temperature.externalDeviceId = toPlainString(d.config.compensation.temperature.externalDeviceId);
                    }
                }
            });
        }

        // 4. Flows
        if (data.flows) {
            data.flows.forEach(f => {
                f._id = toOidObject(f._id);
                // Nodes might have deviceId refs -> String
                if (f.nodes && Array.isArray(f.nodes)) {
                    f.nodes.forEach(n => {
                        if (n.params && n.params.deviceId) {
                            n.params.deviceId = toPlainString(n.params.deviceId);
                        }
                    });
                }
            });
        }

        // 5. Programs
        // Schema: _id (ObjectId), windows.triggers.sensorId (String)
        if (data.programs) {
            data.programs.forEach(p => {
                p._id = toOidObject(p._id);

                if (p.windows && Array.isArray(p.windows)) {
                    p.windows.forEach(w => {
                        if (w.triggers && Array.isArray(w.triggers)) {
                            w.triggers.forEach(t => {
                                if (t.sensorId) t.sensorId = toPlainString(t.sensorId);
                                if (t.conditions && Array.isArray(t.conditions)) {
                                    t.conditions.forEach(c => {
                                        if (c.sensorId) c.sensorId = toPlainString(c.sensorId);
                                    });
                                }
                            });
                        }
                    });
                }
            });
        }

        fs.writeFileSync(BACKUP_FILE, JSON.stringify(json, null, 2), 'utf8');
        console.log('✅ Backup file fixed (Hybrid Mode: OID Keys, String Refs).');

    } catch (err) {
        console.error('❌ Error fixing backup file:', err);
    }
}

processFile();
