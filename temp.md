{
  "_id": {
    "$oid": "695e22773ca221d45d69d253"
  },
  "date": "2026-01-07",
  "programId": "prog_test_programa_seznori",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-07T09:08:07.517Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:07.516Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-07T09:08:07.516Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:07.526Z"
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
        "$date": "2026-01-07T09:08:07.555Z"
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
        "$date": "2026-01-07T09:08:07.580Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: StartStop",
      "metadata": {
        "sessionId": "695e227792c768e3f5d02573",
        "flowId": "prog_test_programa_seznori"
      },
      "executionSessionId": "695e227792c768e3f5d02573"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:07.616Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Темп: Read 23.39 C",
      "metadata": {
        "blockId": "SENSOR_READ_1767776471991",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Темп",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 23.3886821791526,
          "primaryUnit": "C",
          "strategy": "linear",
          "durationMs": 19,
          "deviceId": "695e20bb92c768e3f5d01e0d",
          "deviceName": "DTH22 SIM",
          "resourceRole": "temp",
          "allReadings": {
            "ok": 1,
            "temp": 23.3886821791526,
            "humidity": 28.3889598489476,
            "baseHwValue": 23.3886821791526,
            "baseHwUnit": "C",
            "baseLogValue": 23.3886821791526,
            "baseLogUnit": "C",
            "activeStrategy": "linear"
          }
        },
        "sessionId": "695e227792c768e3f5d02573",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop"
      },
      "executionSessionId": "695e227792c768e3f5d02573"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:07.646Z"
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
          "durationMs": 18,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "allReadings": {
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
        "sessionId": "695e227792c768e3f5d02573",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop"
      },
      "executionSessionId": "695e227792c768e3f5d02573"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:07.672Z"
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
          "durationMs": 17,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "resourceRole": "ec",
          "allReadings": {
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
        "sessionId": "695e227792c768e3f5d02573",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop"
      },
      "executionSessionId": "695e227792c768e3f5d02573"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:07.708Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ГР: Read 100 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767776711990",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 100,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 18,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 300,
            "baseHwValue": 300,
            "baseHwUnit": "mm",
            "baseLogValue": 100,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e227792c768e3f5d02573",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "StartStop"
      },
      "executionSessionId": "695e227792c768e3f5d02573"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T09:08:10.008Z"
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
    "$date": "2026-01-07T09:08:10.009Z"
  }
}


{
  "_id": {
    "$oid": "695e1fb43ca221d45d69cc8a"
  },
  "date": "2026-01-07",
  "programId": "prog_test_nov_ad",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-07T08:56:20.061Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-07T08:56:20.059Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-07T08:56:20.059Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:56:20.073Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Сутрин\" стартира",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:56:20.112Z"
      },
      "type": "TRIGGER_SKIP",
      "message": "Тригер: PAR SIM (49) between 100-300 - не съвпадна",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "triggerId": "tr_1767776080005_ucj6o18qp",
        "sensorValue": 49,
        "condition": "between 100-300"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.038Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер: PAR SIM (130) between 100-300",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "value": 130
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.087Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.152Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 45.00 >= 100.00 => FALSE",
      "metadata": {
        "blockId": "IF_1767702486445",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.148Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767702436022",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 37,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.182Z"
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
          "resourceRole": "none"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.185Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 1: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:30.226Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 16,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:31.238Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 2: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:31.271Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 23,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:32.289Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:32.317Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 18,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:33.329Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:33.361Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 20,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:34.366Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:34.396Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 21,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:35.402Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 6: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:35.434Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 22,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:36.439Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 7: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:36.464Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 45 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 45,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 17,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 151.5,
            "baseHwValue": 151.5,
            "baseHwUnit": "mm",
            "baseLogValue": 45,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:37.474Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 8: 45.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 45,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:37.498Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 111.06 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 111.06298167996405,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 17,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "allReadings": {
            "ok": 1,
            "distance": 329.870050535903,
            "baseHwValue": 329.870050535903,
            "baseHwUnit": "mm",
            "baseLogValue": 111.06298167996405,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.514Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 9: 111.06 < 100.00 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 111.06298167996405,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.532Z"
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
          "resourceRole": "none"
        },
        "sessionId": "695e1ffa92c768e3f5d01a5f",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e1ffa92c768e3f5d01a5f"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.560Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "695e200292c768e3f5d01b4d",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.602Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 4.00 == [6.10–6.30] => FALSE",
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
          "tolerance": 0.1,
          "strategy": "comparison"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.610Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 1: 4.00 <= [6.10–6.30] => TRUE (Continuing)",
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
          "tolerance": 0.1,
          "strategy": "loop_check"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.599Z"
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
          "durationMs": 26,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "allReadings": {
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
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:38.609Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 4.00 < [6.10–6.30] => TRUE",
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
          "tolerance": 0.1,
          "strategy": "comparison"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:39.670Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 1doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e15240b9faf24ff1c06ff",
          "deviceName": "Pump рН+ SIM",
          "resourceRole": "ph_up"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:59.704Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 20.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 20,
          "primaryUnit": "s",
          "durationMs": 20000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:57:59.733Z"
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
          "durationMs": 19,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "allReadings": {
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
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:00.750Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 2: 5.00 <= [6.10–6.30] => TRUE (Continuing)",
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
          "tolerance": 0.1,
          "strategy": "loop_check"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:01.798Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 1doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e15240b9faf24ff1c06ff",
          "deviceName": "Pump рН+ SIM",
          "resourceRole": "ph_up"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:21.840Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 20.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 20,
          "primaryUnit": "s",
          "durationMs": 20000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:21.873Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5.80 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5.8,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 21,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "allReadings": {
            "ok": 1,
            "value": 320,
            "baseHwValue": 320,
            "baseHwUnit": "adc",
            "baseLogValue": 5.8,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1564,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 5.8
          }
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:22.882Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 3: 5.80 <= [6.10–6.30] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 5.8,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0.1,
          "strategy": "loop_check"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:23.914Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 1doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e15240b9faf24ff1c06ff",
          "deviceName": "Pump рН+ SIM",
          "resourceRole": "ph_up"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:43.955Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 20.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 20,
          "primaryUnit": "s",
          "durationMs": 20000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:43.987Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.35 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.35,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 20,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "allReadings": {
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
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:45.002Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 4: 6.35 <= [6.10–6.30] => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 6.35,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0.1,
          "strategy": "loop_check"
        },
        "sessionId": "695e200292c768e3f5d01b4d",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e200292c768e3f5d01b4d"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T08:58:50.010Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Сутрин\" завърши (Изтекло време)",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин"
      }
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-07T08:58:50.011Z"
  }
}