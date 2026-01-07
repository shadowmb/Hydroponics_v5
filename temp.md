{
  "_id": {
    "$oid": "695e15240b9faf24ff1c06ff"
  },
  "name": "Помпа рН+",
  "type": "ACTUATOR",
  "isEnabled": true,
  "status": "offline",
  "hardware": {
    "pins": [
      {
        "role": "Relay",
        "portId": "D2",
        "gpio": 2,
        "_id": {
          "$oid": "695e15240b9faf24ff1c0700"
        }
      }
    ],
    "parentId": "695cbd98c9974a6943abdcd3"
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
  "resourceRole": "ph_up",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-07T08:11:16.894Z"
  },
  "updatedAt": {
    "$date": "2026-01-07T08:11:16.894Z"
  },
  "__v": 0
}