{
  "_id": {
    "$oid": "6956db4e06968f74a3d46e18"
  },
  "name": "Pump A",
  "type": "ACTUATOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "relayId": "6956e1b0a505c7320d94b91f",
    "channel": 1,
    "pins": []
  },
  "config": {
    "driverId": "pump_generic",
    "variantId": "relay",
    "pollInterval": 5000,
    "compensation": {
      "temperature": {
        "enabled": false,
        "source": "default"
      }
    },
    "invertedLogic": false,
    "activeRole": "dosing",
    "conversionStrategy": "volumetric_flow",
    "sampling": {
      "count": 1,
      "delayMs": 0
    },
    "validation": {
      "fallbackAction": "error",
      "retryCount": 3,
      "retryDelayMs": 100,
      "staleLimit": 1,
      "staleTimeoutMs": 30000
    },
    "calibrations": {
      "volumetric_flow": {
        "lastCalibrated": {
          "$date": "2026-01-02T19:15:31.839Z"
        },
        "data": {
          "duration_seconds": 10,
          "measuredValue": 40,
          "measuredUnit": "ml",
          "flowRate": 4,
          "flowRateUnit": "ml/sec",
          "doseSize": 5,
          "doseSizeDisplay": 5,
          "doseUnit": "ml",
          "unit": "ml"
        }
      }
    }
  },
  "tags": [
    "Pump",
    "Water"
  ],
  "group": "Water",
  "dashboardPinned": false,
  "dashboardOrder": 0,
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-01T20:38:38.442Z"
  },
  "updatedAt": {
    "$date": "2026-01-02T19:15:31.840Z"
  },
  "__v": 4,
  "lastConnectionCheck": {
    "$date": "2026-01-02T08:37:48.299Z"
  },
  "lastReading": {
    "value": 0,
    "raw": 0,
    "timestamp": {
      "$date": "2026-01-02T19:14:47.637Z"
    }
  },
  "metadata": {
    "description": ""
  }
}