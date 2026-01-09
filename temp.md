DEvice data in DB:{
  "_id": {
    "$oid": "695e2f57c434325f8fcb40d1"
  },
  "name": "Pump A SIM",
  "type": "ACTUATOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "Relay",
        "portId": "D7",
        "gpio": 7,
        "_id": {
          "$oid": "695e2f57c434325f8fcb40d2"
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
    "conversionStrategy": "volumetric_flow",
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
    },
    "activeRole": "dosing",
    "calibrations": {
      "volumetric_flow": {
        "lastCalibrated": {
          "$date": "2026-01-07T10:03:40.145Z"
        },
        "data": {
          "duration_seconds": 10,
          "measuredValue": 100,
          "measuredUnit": "ml",
          "flowRate": 10,
          "flowRateUnit": "ml/sec",
          "doseSize": 50,
          "doseSizeDisplay": 50,
          "doseUnit": "ml",
          "unit": "ml"
        }
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
  "resourceRole": "nutrient_a",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-07T10:03:03.261Z"
  },
  "updatedAt": {
    "$date": "2026-01-08T08:37:02.859Z"
  },
  "__v": 0,
  "lastReading": {
    "value": 0,
    "raw": 0,
    "timestamp": {
      "$date": "2026-01-07T10:03:14.097Z"
    }
  },
  "lastConnectionCheck": {
    "$date": "2026-01-08T08:37:02.859Z"
  }
}


Запис на данни от сензорите в DB resourcedailysummaries:

{
  "_id": {
    "$oid": "696030d8ac697d8f12b8625b"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-08T22:34:00.041Z"
  },
  "context": {
    "programId": "prog_bigtest",
    "programName": "prog_bigtest",
    "windowId": "tw_1767861565496_ku2rqdpw9",
    "windowName": "Прозорец 1",
    "executionType": "WINDOW"
  },
  "resources": {
    "volume": {
      "value": 60,
      "unit": "L",
      "type": "DELTA",
      "startValue": 40,
      "endValue": 100,
      "count": 7,
      "average": 68.28571428571429,
      "min": 40,
      "max": 100
    },
    "ec": {
      "value": 1.4500000000000002,
      "unit": "mS/cm",
      "type": "TREND",
      "startValue": 1,
      "endValue": 2.45,
      "count": 4,
      "average": 1.975,
      "min": 1,
      "max": 2.45
    },
    "nutrient_a": {
      "value": 100,
      "unit": "ml",
      "type": "SUM",
      "count": 2,
      "average": 50,
      "min": 50,
      "max": 50
    },
    "nutrient_b": {
      "value": 200,
      "unit": "ml",
      "type": "SUM",
      "count": 2,
      "average": 100,
      "min": 100,
      "max": 100
    },
    "mixer": {
      "value": 20,
      "unit": "s",
      "type": "NONE",
      "count": 4,
      "average": 17.5,
      "min": 15,
      "max": 20
    },
    "ph": {
      "value": 2.25,
      "unit": "pH",
      "type": "TREND",
      "startValue": 4,
      "endValue": 6.25,
      "count": 4,
      "average": 5.375,
      "min": 4,
      "max": 6.25
    },
    "ph_up": {
      "value": 6,
      "unit": "ml",
      "type": "SUM",
      "count": 2,
      "average": 3,
      "min": 3,
      "max": 3
    },
    "soil_moisture": {
      "value": 30,
      "unit": "%",
      "type": "NONE",
      "count": 1,
      "average": 30,
      "min": 30,
      "max": 30
    },
    "temp": {
      "value": 0,
      "unit": "C",
      "type": "TREND",
      "startValue": 24,
      "endValue": 24,
      "count": 1,
      "average": 24,
      "min": 24,
      "max": 24
    },
    "water": {
      "value": 60,
      "unit": "L",
      "type": "DELTA",
      "startValue": 40,
      "endValue": 100
    }
  },
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-08T22:34:00.042Z"
  },
  "updatedAt": {
    "$date": "2026-01-08T22:34:00.042Z"
  },
  "__v": 0
}

programdailylogs :

{
  "_id": {
    "$oid": "695f9e103ca221d45d6aff63"
  },
  "date": "2026-01-08",
  "programId": "prog_bigtest",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-08T12:07:44.778Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:44.776Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-08T12:07:44.776Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:44.789Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" стартира",
      "metadata": {
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.273Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер: PAR SIM (155) >= 150",
      "metadata": {
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "value": 155
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.340Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "695f9e11a24d420eac888640",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.415Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 20.00 >= [95.00–105.00] => FALSE",
      "metadata": {
        "blockId": "IF_1767702486445",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 20,
          "rightValue": 100,
          "operator": ">=",
          "tolerance": 5,
          "strategy": "comparison"
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.411Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 20 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767702436022",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 20,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 48,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 84,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 20,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 84,
            "baseHwValue": 84,
            "baseHwUnit": "mm",
            "baseLogValue": 20,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.446Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа Пълнене ON: Set ON (State: 1)",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767702615341",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа Пълнене ON",
        "success": true,
        "logData": {
          "action": "ON",
          "strategy": "simple",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "deviceId": "695e1e1592c768e3f5d013a3",
          "deviceName": "Pump Irrigation SIM",
          "resourceRole": "water"
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.450Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 1: 20.00 < [95.00–105.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 20,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 5,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:45.519Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 20 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 20,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 58,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 84,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 20,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 84,
            "baseHwValue": 84,
            "baseHwUnit": "mm",
            "baseLogValue": 20,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:50.525Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 2: 20.00 < [95.00–105.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 20,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 5,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:50.561Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 20 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 20,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 23,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 84,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 20,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 84,
            "baseHwValue": 84,
            "baseHwUnit": "mm",
            "baseLogValue": 20,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:55.577Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 20.00 < [95.00–105.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 20,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 5,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:07:55.607Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 21,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:00.614Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 60.00 < [95.00–105.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 5,
          "strategy": "loop_check",
          "iteration": 4
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:00.647Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 80 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 80,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 23,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 246,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 80,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 246,
            "baseHwValue": 246,
            "baseHwUnit": "mm",
            "baseLogValue": 80,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:05.665Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 80.00 < [95.00–105.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 80,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 5,
          "strategy": "loop_check",
          "iteration": 5
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:05.690Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 100 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 100,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 17,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 300,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 100,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 300,
            "baseHwValue": 300,
            "baseHwUnit": "mm",
            "baseLogValue": 100,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:10.700Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 6: 100.00 < [95.00–105.00] => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 100,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 5,
          "strategy": "loop_check",
          "iteration": 6
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:10.717Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа Пълнене OFF: Set OFF (State: 0)",
      "metadata": {
        "blockId": "generic_1767702678873",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа Пълнене OFF",
        "success": true,
        "logData": {
          "action": "OFF",
          "strategy": "simple",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "deviceId": "695e1e1592c768e3f5d013a3",
          "deviceName": "Pump Irrigation SIM",
          "resourceRole": "water"
        },
        "sessionId": "695f9e11a24d420eac888640",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f9e11a24d420eac888640"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:10.744Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: EC SIM",
      "metadata": {
        "sessionId": "695f9e2aa24d420eac8886f8",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:10.786Z"
      },
      "type": "INFO",
      "message": "🔄 Loop: Iteration 1: 2.00 < 2.60 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767860820148",
        "blockType": "LOOP",
        "blockLabel": "Loop",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 2,
          "rightValue": 2.6,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:10.781Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ЕС: Read 2 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767860723368",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ЕС",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 29,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2000,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 410.1438039591872,
            "baseHwValue": 410.1438039591872,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2000,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2004.6,
            "temp": 25,
            "ecRaw": 2000,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:10.784Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 2.00 > 2.60 => FALSE",
      "metadata": {
        "blockId": "IF_1767860729844",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 2,
          "rightValue": 2.6,
          "operator": ">",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:20.838Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767860849786",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 10000,
          "calculatedVolumeMl": 100,
          "deviceId": "695e2f57c434325f8fcb40d1",
          "deviceName": "Pump A SIM",
          "resourceRole": "nutrient_a"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:30.874Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Dosed 100ml",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767861042261",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 100,
          "primaryUnit": "ml",
          "durationMs": 10000,
          "calculatedVolumeMl": 100,
          "deviceId": "695e3634f65986265d5506f9",
          "deviceName": "Pump B SIM",
          "resourceRole": "nutrient_b"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:40.912Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 10.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767861065835",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 10,
          "primaryUnit": "s",
          "durationMs": 10000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:40.944Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 2.20 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767861135267",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.2,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 22,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2200,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 451.07866050405516,
            "baseHwValue": 451.07866050405516,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2200,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2204.7,
            "temp": 25,
            "ecRaw": 2200,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:41.954Z"
      },
      "type": "INFO",
      "message": "🔄 Loop: Iteration 2: 2.20 < 2.60 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767860820148",
        "blockType": "LOOP",
        "blockLabel": "Loop",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 2.2,
          "rightValue": 2.6,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:08:52.008Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767860849786",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 10000,
          "calculatedVolumeMl": 100,
          "deviceId": "695e2f57c434325f8fcb40d1",
          "deviceName": "Pump A SIM",
          "resourceRole": "nutrient_a"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:02.046Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Dosed 100ml",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767861042261",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 100,
          "primaryUnit": "ml",
          "durationMs": 10000,
          "calculatedVolumeMl": 100,
          "deviceId": "695e3634f65986265d5506f9",
          "deviceName": "Pump B SIM",
          "resourceRole": "nutrient_b"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:12.112Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 10.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767861065835",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 10,
          "primaryUnit": "s",
          "durationMs": 10000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:12.150Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 2.80 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767861135267",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.8,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 26,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2800,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 573.8832301386587,
            "baseHwValue": 573.8832301386587,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2800,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2804.9,
            "temp": 25,
            "ecRaw": 2800,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:13.167Z"
      },
      "type": "INFO",
      "message": "🔄 Loop: Iteration 3: 2.80 < 2.60 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767860820148",
        "blockType": "LOOP",
        "blockLabel": "Loop",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 2.8,
          "rightValue": 2.6,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "695f9e2aa24d420eac8886f8",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "695f9e2aa24d420eac8886f8"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:13.203Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "695f9e69a24d420eac8887af",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:13.254Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 1: 4.00 <= 6.20 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 4,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:13.246Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 4 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767602172874",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 4,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 25,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 4,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 200,
            "baseHwValue": 200,
            "baseHwUnit": "adc",
            "baseLogValue": 4,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 977.5,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 4
          }
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:13.251Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 4.00 < 6.20 => TRUE",
      "metadata": {
        "blockId": "IF_1767603252978",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 4,
          "rightValue": 6.2,
          "operator": "<",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:13.249Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 4.00 == 6.20 => FALSE",
      "metadata": {
        "blockId": "IF_1767603196469",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 4,
          "rightValue": 6.2,
          "operator": "==",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:15.331Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 2000,
          "calculatedVolumeMl": 2,
          "deviceId": "695e15240b9faf24ff1c06ff",
          "deviceName": "Pump рН+ SIM",
          "resourceRole": "ph_up"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:25.385Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 10.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 10,
          "primaryUnit": "s",
          "durationMs": 10000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:25.420Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 21,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 5,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 266.6666666666667,
            "baseHwValue": 266.6666666666667,
            "baseHwUnit": "adc",
            "baseLogValue": 5,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1303.4,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 5
          }
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:26.427Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 2: 5.00 <= 6.20 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 5,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:28.468Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 2000,
          "calculatedVolumeMl": 2,
          "deviceId": "695e15240b9faf24ff1c06ff",
          "deviceName": "Pump рН+ SIM",
          "resourceRole": "ph_up"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:38.510Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 10.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 10,
          "primaryUnit": "s",
          "durationMs": 10000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:38.539Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 18,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 5,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 266.6666666666667,
            "baseHwValue": 266.6666666666667,
            "baseHwUnit": "adc",
            "baseLogValue": 5,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1303.4,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 5
          }
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:39.553Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 3: 5.00 <= 6.20 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 5,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:41.604Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 2000,
          "calculatedVolumeMl": 2,
          "deviceId": "695e15240b9faf24ff1c06ff",
          "deviceName": "Pump рН+ SIM",
          "resourceRole": "ph_up"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:51.675Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 10.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 10,
          "primaryUnit": "s",
          "durationMs": 10000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:51.709Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.50 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.5,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 23,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.5,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 366.6666666666667,
            "baseHwValue": 366.6666666666667,
            "baseHwUnit": "adc",
            "baseLogValue": 6.5,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1792.1,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.5
          }
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:52.722Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 4: 6.50 <= 6.20 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 6.5,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 4
        },
        "sessionId": "695f9e69a24d420eac8887af",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695f9e69a24d420eac8887af"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:09:52.752Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Поливане SIM",
      "metadata": {
        "sessionId": "695f9e90a24d420eac888887",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:07.804Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767702971972",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000,
          "deviceId": "695e1e1592c768e3f5d013a3",
          "deviceName": "Pump Irrigation SIM",
          "resourceRole": "water"
        },
        "sessionId": "695f9e90a24d420eac888887",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:07.834Z"
      },
      "type": "INFO",
      "message": "📊 Ниво на водата ГР: Read 100 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767703007579",
        "blockType": "SENSOR_READ",
        "blockLabel": "Ниво на водата ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 100,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 20,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 300,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 100,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 300,
            "baseHwValue": 300,
            "baseHwUnit": "mm",
            "baseLogValue": 100,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f9e90a24d420eac888887",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:07.863Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 2.80 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767703139531",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.8,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 18,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2800,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 573.8832301386587,
            "baseHwValue": 573.8832301386587,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2800,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2804.9,
            "temp": 25,
            "ecRaw": 2800,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "695f9e90a24d420eac888887",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:07.891Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 6.50 pH",
      "metadata": {
        "blockId": "generic_1767703161625",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.5,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 19,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.5,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 366.6666666666667,
            "baseHwValue": 366.6666666666667,
            "baseHwUnit": "adc",
            "baseLogValue": 6.5,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1792.1,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.5
          }
        },
        "sessionId": "695f9e90a24d420eac888887",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:07.918Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 30 %",
      "metadata": {
        "blockId": "SENSOR_READ_1767861255645",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 30,
          "primaryUnit": "%",
          "strategy": "linear",
          "durationMs": 17,
          "deviceId": "695cfa4e09a10176b895f731",
          "deviceName": "Mois SIM",
          "resourceRole": "soil_moisture",
          "measurements": [],
          "rawContext": {
            "ok": 1,
            "value": 30,
            "baseHwValue": 30,
            "baseHwUnit": "adc",
            "baseLogValue": 30,
            "baseLogUnit": "adc",
            "activeStrategy": "linear"
          }
        },
        "sessionId": "695f9e90a24d420eac888887",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:07.961Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 21 C",
      "metadata": {
        "blockId": "SENSOR_READ_1767861446467",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 21,
          "primaryUnit": "C",
          "strategy": "linear",
          "durationMs": 29,
          "deviceId": "695f6c8f8e054fae1649b275",
          "deviceName": "DS18 SIM",
          "resourceRole": "temp",
          "measurements": [
            {
              "key": "temp",
              "value": 21,
              "unit": "C",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "temp": 21,
            "baseHwValue": 21,
            "baseHwUnit": "C",
            "baseLogValue": 21,
            "baseLogUnit": "C",
            "activeStrategy": "linear"
          }
        },
        "sessionId": "695f9e90a24d420eac888887",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "695f9e90a24d420eac888887"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T12:10:10.023Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" завърши (Изтекло време)",
      "metadata": {
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1"
      }
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-08T12:10:10.025Z"
  }
}