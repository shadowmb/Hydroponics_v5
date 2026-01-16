{
  "_id": {
    "$oid": "696968055d5501142dd5a854"
  },
  "name": "Помпа тест",
  "analyticsLabel": "тестт",
  "type": "ACTUATOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Relay",
        "portId": "D13",
        "gpio": 13,
        "_id": {
          "$oid": "696968055d5501142dd5a855"
        }
      }
    ],
    "parentId": "6966c55b1202eaa1d5f3c98c"
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
  "resourceRole": "none",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-15T22:19:49.283Z"
  },
  "updatedAt": {
    "$date": "2026-01-16T18:05:21.049Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2026-01-16T17:58:03.922Z"
  },
  "lastReading": {
    "value": 1,
    "raw": 1,
    "timestamp": {
      "$date": "2026-01-16T18:05:21.048Z"
    }
  }
}


{
  "_id": {
    "$oid": "69673868571cb443c36d55c5"
  },
  "name": "EC SIM",
  "analyticsLabel": "ЕС_Домати",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Signal",
        "portId": "A1",
        "gpio": 15,
        "_id": {
          "$oid": "696777c76faa954025d662e8"
        }
      }
    ],
    "parentId": "6966c55b1202eaa1d5f3c98c"
  },
  "config": {
    "driverId": "dfrobot_ec_k1",
    "activeRole": "ec",
    "pollInterval": 5000,
    "conversionStrategy": "ec_smart",
    "calibrations": {
      "ec_smart": {
        "lastCalibrated": {
          "$date": "2026-01-14T07:30:12.597Z"
        },
        "data": {
          "points": [
            {
              "raw": 300,
              "value": 1413
            },
            {
              "raw": 2600,
              "value": 12880
            }
          ]
        }
      }
    },
    "compensation": {
      "temperature": {
        "enabled": false,
        "source": "external",
        "externalDeviceId": "69673845571cb443c36d559d"
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
    "EC",
    "Conductivity",
    "Water"
  ],
  "group": "Water",
  "dashboardPinned": true,
  "dashboardOrder": 1,
  "resourceRole": "ec",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-14T06:32:08.177Z"
  },
  "updatedAt": {
    "$date": "2026-01-16T17:58:03.914Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2026-01-16T17:58:03.914Z"
  },
  "lastReading": {
    "value": 941.7,
    "raw": 205.46952123484783,
    "timestamp": {
      "$date": "2026-01-15T12:00:10.057Z"
    }
  },
  "displayUnit": "mS/cm"
}

{
  "_id": {
    "$oid": "69673889571cb443c36d55f3"
  },
  "name": "pH SIM",
  "analyticsLabel": "рН_Домати",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Signal",
        "portId": "A0",
        "gpio": 14,
        "_id": {
          "$oid": "696777cd6faa954025d66312"
        }
      }
    ],
    "parentId": "6966c55b1202eaa1d5f3c98c"
  },
  "config": {
    "driverId": "dfrobot_ph_pro",
    "activeRole": "ph",
    "pollInterval": 5000,
    "conversionStrategy": "ph_smart",
    "calibrations": {
      "ph_smart": {
        "lastCalibrated": {
          "$date": "2026-01-14T07:31:08.267Z"
        },
        "data": {
          "points": [
            {
              "raw": 400,
              "value": 4
            },
            {
              "raw": 700,
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
        "externalDeviceId": "69673845571cb443c36d559d"
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
    "pH",
    "Water",
    "Acidity"
  ],
  "group": "Water",
  "dashboardPinned": true,
  "dashboardOrder": 3,
  "resourceRole": "ph",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-14T06:32:41.379Z"
  },
  "updatedAt": {
    "$date": "2026-01-16T17:58:03.916Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2026-01-16T17:58:03.916Z"
  },
  "lastReading": {
    "value": 5,
    "raw": 500,
    "timestamp": {
      "$date": "2026-01-15T20:11:35.007Z"
    }
  }
}