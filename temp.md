Реле:

{
  "_id": {
    "$oid": "69673971571cb443c36d56f7"
  },
  "name": "Реле 8 Домати",
  "controllerId": "6966c55b1202eaa1d5f3c98c",
  "type": "8-channel",
  "triggerLogic": "HIGH",
  "channels": [
    {
      "channelIndex": 1,
      "controllerPortId": "D4",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "6967399f571cb443c36d574c",
        "name": "Помпа А SIM"
      }
    },
    {
      "channelIndex": 2,
      "controllerPortId": "D5",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "696739b5571cb443c36d577a",
        "name": "Помпа Б SIM"
      }
    },
    {
      "channelIndex": 3,
      "controllerPortId": "D6",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "696739ea571cb443c36d57b0",
        "name": "Помпа рН+ SIM"
      }
    },
    {
      "channelIndex": 4,
      "controllerPortId": "D7",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "69673a09571cb443c36d57e0",
        "name": "Помпа рН- SIM"
      }
    },
    {
      "channelIndex": 5,
      "controllerPortId": "D8",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "69673a44571cb443c36d581c",
        "name": "Помпа Резервоар SIM"
      }
    },
    {
      "channelIndex": 6,
      "controllerPortId": "D9",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "69673bf4571cb443c36d58c6",
        "name": "Помпа Разбъркване SIM"
      }
    },
    {
      "channelIndex": 7,
      "controllerPortId": "D12",
      "state": false,
      "isOccupied": true,
      "occupiedBy": {
        "type": "device",
        "id": "69673c11571cb443c36d58f6",
        "name": "Помпа Поливане SIM"
      }
    },
    {
      "channelIndex": 8,
      "controllerPortId": "D13",
      "state": false,
      "isOccupied": false
    }
  ],
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-14T06:36:33.879Z"
  },
  "updatedAt": {
    "$date": "2026-01-15T11:46:39.328Z"
  },
  "__v": 0
}

Актуатор:

{
  "_id": {
    "$oid": "69673c11571cb443c36d58f6"
  },
  "name": "Помпа Поливане SIM",
  "analyticsLabel": "Помпа_Поливане",
  "type": "ACTUATOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "relayId": "69673971571cb443c36d56f7",
    "channel": 7,
    "pins": []
  },
  "config": {
    "driverId": "pump_generic",
    "variantId": "relay",
    "pollInterval": 5000,
    "conversionStrategy": "linear",
    "compensation": {
      "temperature": {
        "enabled": false,
        "source": "default"
      }
    },
    "invertedLogic": false,
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
    "$date": "2026-01-14T06:47:45.213Z"
  },
  "updatedAt": {
    "$date": "2026-01-14T10:59:02.925Z"
  },
  "__v": 1,
  "lastConnectionCheck": {
    "$date": "2026-01-14T10:59:02.924Z"
  }
}