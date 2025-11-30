Рестартирах сървъра и това е схемата на помпата в ДБ:{
  "_id": {
    "$oid": "692b82f86cac3d9a9e401840"
  },
  "name": "Pump A",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "relayId": "692751843f62c7df1f01329d",
    "channel": 1,
    "pins": []
  },
  "config": {
    "driverId": "pump_generic",
    "pollInterval": 5000,
    "calibration": {
      "multiplier": 1,
      "offset": 0,
      "points": []
    },
    "conversionStrategy": "linear"
  },
  "tags": [],
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-11-29T23:34:16.013Z"
  },
  "updatedAt": {
    "$date": "2025-11-30T01:21:14.284Z"
  },
  "__v": 3,
  "lastConnectionCheck": {
    "$date": "2025-11-30T00:00:41.428Z"
  },
  "lastReading": {
    "value": 0,
    "raw": 0,
    "timestamp": {
      "$date": "2025-11-30T01:21:14.277Z"
    }
  },
  "metadata": {
    "description": ""
  }
}


Това е от конзолата Network:

{
  "code": "INTERNAL_ERROR",
  "message": "ERR_INVALID_COMMAND"
}

towa e от SYSTEM CONSOLE:
[3:22:47 AM] [INFO] [SENT] DIGITAL_WRITE {"state":1,"driverId":"pump_generic","pin":"D6","pins":[]}
[3:22:28 AM] [INFO] [SENT] DIGITAL_WRITE {"state":1,"driverId":"pump_generic","pin":"D6","pins":[]}
[3:22:22 AM] [INFO] Read Result: {"raw":0,"value":0,"details":{"ok":1,"pin":"D6","state":0}}
[3:22:22 AM] [INFO] [SENT] DIGITAL_READ {"pin":"D6","pins":[]}