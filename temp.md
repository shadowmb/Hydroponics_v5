{
  "_id": {
    "$oid": "695f536f3ca221d45d6ac05a"
  },
  "date": "2026-01-08",
  "programId": "prog_test_programa_seznori",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-08T06:49:19.236Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.235Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-08T06:49:19.235Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.245Z"
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
        "$date": "2026-01-08T06:49:19.278Z"
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
        "$date": "2026-01-08T06:49:19.314Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "695f536f8e054fae1649a6f6",
        "flowId": "prog_test_programa_seznori"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.369Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 30 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767702436022",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 30,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 34,
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
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.374Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 30.00 >= [97.00–103.00] => FALSE",
      "metadata": {
        "blockId": "IF_1767702486445",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 30,
          "rightValue": 100,
          "operator": ">=",
          "tolerance": 3,
          "strategy": "comparison"
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.400Z"
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
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.404Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 1: 30.00 < [97.00–103.00] => TRUE (Continuing)",
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
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:19.520Z"
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
          "durationMs": 57,
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
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:24.536Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 2: 30.00 < [97.00–103.00] => TRUE (Continuing)",
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
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:24.565Z"
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
          "durationMs": 20,
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
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:29.573Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 30.00 < [97.00–103.00] => TRUE (Continuing)",
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
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:29.600Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 40 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 40,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 19,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 138,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 40,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 138,
            "baseHwValue": 138,
            "baseHwUnit": "mm",
            "baseLogValue": 40,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:34.617Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 40.00 < [97.00–103.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 40,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 4
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:34.644Z"
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
          "durationMs": 19,
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
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:39.650Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 50.00 < [97.00–103.00] => TRUE (Continuing)",
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
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 5
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:39.677Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 90 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 90,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 19,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 273,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 90,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 273,
            "baseHwValue": 273,
            "baseHwUnit": "mm",
            "baseLogValue": 90,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:44.684Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 6: 90.00 < [97.00–103.00] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 90,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 6
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:44.714Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 98 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 98,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 20,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 294.6,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 98,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 294.6,
            "baseHwValue": 294.6,
            "baseHwUnit": "mm",
            "baseLogValue": 98,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:49.724Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 7: 98.00 < [97.00–103.00] => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 98,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 3,
          "strategy": "loop_check",
          "iteration": 7
        },
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:49.743Z"
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
        "sessionId": "695f536f8e054fae1649a6f6",
        "windowId": "tw_1767776775372_o36rrx0ta",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695f536f8e054fae1649a6f6"
    },
    {
      "timestamp": {
        "$date": "2026-01-08T06:49:50.010Z"
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
    "$date": "2026-01-08T06:49:50.011Z"
  }
}