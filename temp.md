{
  "_id": {
    "$oid": "695e30043ca221d45d69e1fd"
  },
  "programId": "prog_test_programa_seznori",
  "date": "2026-01-07",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-07T10:05:56.776Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:56.775Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-07T10:05:56.774Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:56.788Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" стартира",
      "metadata": {
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:56.824Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер: PAR SIM (150) between 100-300",
      "metadata": {
        "windowId": "tw_1767776775372_o36rrx0ta",
        "value": 150
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:56.872Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: StartStop NEW",
      "metadata": {
        "sessionId": "695e3004c434325f8fcb437e",
        "flowId": "prog_test_programa_seznori"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:56.936Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Темп: Read 22 C",
      "metadata": {
        "blockId": "SENSOR_READ_1767776471991",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Темп",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 22,
          "primaryUnit": "C",
          "strategy": "linear",
          "durationMs": 39,
          "deviceId": "695e20bb92c768e3f5d01e0d",
          "deviceName": "DTH22 SIM",
          "resourceRole": "temp",
          "measurements": [
            {
              "key": "temp",
              "value": 22,
              "unit": "C",
              "isPrimary": true
            },
            {
              "key": "humidity",
              "value": 80,
              "unit": "%",
              "isPrimary": false
            }
          ],
          "rawContext": {
            "ok": 1,
            "temp": 22,
            "humidity": 80,
            "baseHwValue": 22,
            "baseHwUnit": "C",
            "baseLogValue": 22,
            "baseLogUnit": "C",
            "activeStrategy": "linear"
          }
        },
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:56.980Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.35 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767776623104",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.35,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 25,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.35,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 356.66666666666663,
            "baseHwValue": 356.66666666666663,
            "baseHwUnit": "adc",
            "baseLogValue": 6.35,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1743.2,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.35
          }
        },
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:57.024Z"
      },
      "type": "INFO",
      "message": "📊 Сенозор ЕС: Read 2.15 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767776646455",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сенозор ЕС",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.15,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 33,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2150,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 440.84494636783813,
            "baseHwValue": 440.84494636783813,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2150,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2154.7,
            "temp": 25,
            "ecRaw": 2150,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:57.092Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ГР: Read 88 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767776711990",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 88,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 49,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 267.6,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 88,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 267.6,
            "baseHwValue": 267.6,
            "baseHwUnit": "mm",
            "baseLogValue": 88,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:05:59.191Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767778082120",
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
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:06:19.234Z"
      },
      "type": "INFO",
      "message": "⚡ Разтвор А Доза: Dosed 4doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767780233428",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разтвор А Доза",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 4,
          "primaryUnit": "doses",
          "durationMs": 20000,
          "calculatedVolumeMl": 200,
          "deviceId": "695e2f57c434325f8fcb40d1",
          "deviceName": "Pump A SIM",
          "resourceRole": "nutrient_a"
        },
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:06:29.280Z"
      },
      "type": "INFO",
      "message": "⚡ Разтвор А мл: Dosed 100ml",
      "metadata": {
        "blockId": "generic_1767780255185",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разтвор А мл",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 100,
          "primaryUnit": "ml",
          "durationMs": 10000,
          "calculatedVolumeMl": 100,
          "deviceId": "695e2f57c434325f8fcb40d1",
          "deviceName": "Pump A SIM",
          "resourceRole": "nutrient_a"
        },
        "sessionId": "695e3004c434325f8fcb437e",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3004c434325f8fcb437e"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T10:06:30.013Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" завърши (Изтекло време)",
      "metadata": {
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1"
      }
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-07T10:06:30.014Z"
  }
}