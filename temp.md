{
  "_id": {
    "$oid": "696177eeb4cd6597a337adf2"
  },
  "name": "Pump Water SIM",
  "analyticsLabel": "Помпа Вода Домати",
  "type": "ACTUATOR",
  "isEnabled": true,
  "status": "offline",
  "hardware": {
    "pins": [
      {
        "role": "Relay",
        "portId": "D9",
        "gpio": 9,
        "_id": {
          "$oid": "696177eeb4cd6597a337adf3"
        }
      }
    ],
    "parentId": "695d88037dff83164c8abac9"
  },
  "config": {
    "driverId": "pump_generic",
    "variantId": "relay",
    "pollInterval": 5000,
    "invertedLogic": false,
    "conversionStrategy": "linear",
    "validation": {
      "retryCount": 3,
      "retryDelayMs": 100,
      "fallbackAction": "error",
      "staleLimit": 1,
      "staleTimeoutMs": 30000
    },
    "sampling": {
      "count": 1,
      "delayMs": 0
    },
    "compensation": {
      "temperature": {
        "enabled": false,
        "source": "default"
      }
    }
  },
  "metadata": {
    "description": ""
  },
  "tags": [
    "Pump",
    "Water"
  ],
  "group": "Water",
  "dashboardPinned": false,
  "dashboardOrder": 0,
  "resourceRole": "water",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T21:49:34.105Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T21:49:34.105Z"
  },
  "__v": 0
}