Това е схемата на устройството PumpB след съдаването му:
{
  "_id": {
    "$oid": "692c82aad32b5571d51c7213"
  },
  "name": "PumpB",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Control Pin",
        "portId": "D6",
        "gpio": 6,
        "_id": {
          "$oid": "692c82aad32b5571d51c7214"
        }
      }
    ],
    "parentId": "6926198161346dc01f570ae9"
  },
  "config": {
    "driverId": "pump_generic",
    "pollInterval": 5000,
    "conversionStrategy": "linear"
  },
  "tags": [],
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-11-30T17:45:14.806Z"
  },
  "updatedAt": {
    "$date": "2025-11-30T17:45:19.612Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2025-11-30T17:45:19.612Z"
  }
}

Това е след като записах калибрациятана стратегията Volumetric Flow (Dosing):
-=-=-==


{
  "_id": {
    "$oid": "692c82aad32b5571d51c7213"
  },
  "name": "PumpB",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Control Pin",
        "portId": "D6",
        "gpio": 6,
        "_id": {
          "$oid": "692c82aad32b5571d51c7214"
        }
      }
    ],
    "parentId": "6926198161346dc01f570ae9"
  },
  "config": {
    "driverId": "pump_generic",
    "pollInterval": 5000,
    "conversionStrategy": "linear",
    "calibrations": {
      "volumetric_flow": {
        "lastCalibrated": {
          "$date": "2025-11-30T17:47:31.471Z"
        },
        "data": {
          "duration_seconds": 4,
          "_isRunning": false,
          "_countdown": 0,
          "measuredValue": 56
        }
      }
    }
  },
  "tags": [],
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-11-30T17:45:14.806Z"
  },
  "updatedAt": {
    "$date": "2025-11-30T17:47:31.472Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2025-11-30T17:45:19.612Z"
  }
}