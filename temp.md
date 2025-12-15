{
  "_id": {
    "$oid": "693fbb260ee99362b105a288"
  },
  "name": "DS18B20",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "DATA",
        "portId": "D2",
        "gpio": 2,
        "_id": {
          "$oid": "693fbb260ee99362b105a289"
        }
      }
    ],
    "parentId": "693134db23b1320394ed43b5"
  },
  "config": {
    "driverId": "ds18b20",
    "pollInterval": 5000,
    "conversionStrategy": "linear",
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
    }
  },
  "tags": [
    "Temperature",
    "Water"
  ],
  "group": "Water",
  "dashboardPinned": false,
  "dashboardOrder": 0,
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-12-15T07:39:18.067Z"
  },
  "updatedAt": {
    "$date": "2025-12-15T08:21:13.104Z"
  },
  "__v": 0,
  "metadata": {
    "description": ""
  },
  "lastConnectionCheck": {
    "$date": "2025-12-15T08:21:13.103Z"
  }
}