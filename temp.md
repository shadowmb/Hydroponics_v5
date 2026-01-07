{
  "_id": {
    "$oid": "695b6a468b53afd2c818732e"
  },
  "name": "pH",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Signal",
        "portId": "A3",
        "gpio": 17,
        "_id": {
          "$oid": "695b700f8b53afd2c8187f56"
        }
      }
    ],
    "parentId": "695b65e78b53afd2c818686c"
  },
  "config": {
    "driverId": "dfrobot_ph_pro",
    "activeRole": "ph",
    "pollInterval": 5000,
    "conversionStrategy": "ph_smart",
    "calibrations": {
      "ph_smart": {
        "lastCalibrated": {
          "$date": "2026-01-05T07:38:41.646Z"
        },
        "data": {
          "points": [
            {
              "raw": 201,
              "value": 4
            },
            {
              "raw": 393,
              "value": 7
            }
          ]
        }
      }
    },
    "compensation": {
      "temperature": {
        "enabled": false,
        "source": "external",
        "externalDeviceId": "695b69608b53afd2c818719f"
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
  "tags": [
    "pH",
    "Water",
    "Acidity"
  ],
  "group": "Water",
  "dashboardPinned": false,
  "dashboardOrder": 0,
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-05T07:37:42.840Z"
  },
  "updatedAt": {
    "$date": "2026-01-05T08:23:02.371Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2026-01-05T08:23:02.370Z"
  },
  "lastReading": {
    "value": 1.38,
    "raw": 33,
    "timestamp": {
      "$date": "2026-01-05T07:38:44.099Z"
    }
  },
  "metadata": {
    "description": "Сензор за измерване нивото на рН"
  }
}