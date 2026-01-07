{
  "_id": {
    "$oid": "695e963e3ca221d45d6a404a"
  },
  "programId": "prog_test_programa_seznori",
  "date": "2026-01-07",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-07T17:22:06.995Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-07T17:22:06.993Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-07T17:22:06.993Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:22:07.006Z"
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
        "$date": "2026-01-07T17:22:07.527Z"
      },
      "type": "TRIGGER_SKIP",
      "message": "Тригер: PAR SIM (60) between 100-300 - не съвпадна",
      "metadata": {
        "windowId": "tw_1767776775372_o36rrx0ta",
        "triggerId": "tr_1767776796220_lmjxdc6dk",
        "sensorValue": 60,
        "condition": "between 100-300"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:10.033Z"
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
        "$date": "2026-01-07T17:23:10.078Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "695e967e0693b00a665941ba",
        "flowId": "prog_test_programa_seznori"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:10.169Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 20.00 >= 100.00 => FALSE",
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
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:10.165Z"
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
          "durationMs": 50,
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:10.204Z"
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:10.209Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 1: 20.00 < 100.00 => TRUE (Continuing)",
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
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:10.245Z"
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:15.252Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 2: 20.00 < 100.00 => TRUE (Continuing)",
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
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:15.286Z"
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
          "durationMs": 18,
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:20.293Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 20.00 < 100.00 => TRUE (Continuing)",
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
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:20.320Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 30 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 30,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 18,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 111,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 30,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 111,
            "baseHwValue": 111,
            "baseHwUnit": "mm",
            "baseLogValue": 30,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:25.327Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 30.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 30,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 4
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:25.370Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 30 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 30,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 29,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 111,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 30,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 111,
            "baseHwValue": 111,
            "baseHwUnit": "mm",
            "baseLogValue": 30,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:30.389Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 30.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 30,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 5
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:30.488Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 50 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 50,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 50,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 165,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 50,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 165,
            "baseHwValue": 165,
            "baseHwUnit": "mm",
            "baseLogValue": 50,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:35.507Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 6: 50.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 50,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 6
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:35.533Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 70 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 70,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 16,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 219,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 70,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 219,
            "baseHwValue": 219,
            "baseHwUnit": "mm",
            "baseLogValue": 70,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:40.540Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 7: 70.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 70,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 7
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:40.569Z"
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
          "durationMs": 17,
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:45.581Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 8: 80.00 < 100.00 => TRUE (Continuing)",
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
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 8
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:45.611Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 10 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 10,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 18,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 57,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 10,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 57,
            "baseHwValue": 57,
            "baseHwUnit": "mm",
            "baseLogValue": 10,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:50.627Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 9: 10.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 10,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 9
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:50.654Z"
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
          "durationMs": 18,
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:55.669Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 10: 100.00 < 100.00 => FALSE (Done)",
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
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 10
        },
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:23:55.690Z"
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
        "sessionId": "695e967e0693b00a665941ba",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e967e0693b00a665941ba"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T17:24:00.015Z"
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
    "$date": "2026-01-07T17:24:00.016Z"
  }
}