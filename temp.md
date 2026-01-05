{
  "_id": {
    "$oid": "695af103ef1bc74ee6cf4354"
  },
  "programId": "prog_test_advansed",
  "date": "2026-01-05",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-04T23:00:19.224Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:19.224Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-04T23:00:19.223Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:19.234Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" стартира",
      "metadata": {
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:21.116Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер:  Ultrasonic (205.1) > 150",
      "metadata": {
        "windowId": "tw_1767397161163_4sw62wba9",
        "value": 205.1
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:21.146Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Тест темп",
      "metadata": {
        "sessionId": "695af105b92254a650a26a79",
        "flowId": "prog_test_advansed"
      },
      "executionSessionId": "695af105b92254a650a26a79"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:22.317Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер:  Ultrasonic (204.85) > 150",
      "metadata": {
        "windowId": "tw_1767397161163_4sw62wba9",
        "value": 204.85
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:23.619Z"
      },
      "type": "INFO",
      "message": "❓ Проверка: 204.80 > [90–110] => TRUE",
      "metadata": {
        "blockId": "IF_1767540099917",
        "blockType": "IF",
        "blockLabel": "Проверка",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 204.8,
          "rightValue": 100,
          "operator": ">",
          "tolerance": 10,
          "strategy": "comparison"
        },
        "sessionId": "695af105b92254a650a26a79",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "Тест темп"
      },
      "executionSessionId": "695af105b92254a650a26a79"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:23.617Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Distance: Read 204.80 cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767397080404",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Distance",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 204.8,
          "primaryUnit": "cm",
          "strategy": "linear",
          "durationMs": 2468
        },
        "sessionId": "695af105b92254a650a26a79",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "Тест темп"
      },
      "executionSessionId": "695af105b92254a650a26a79"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:25.415Z"
      },
      "type": "INFO",
      "message": "⚡ Pump A: Dosed 1doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767540068441",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Pump A",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1153.8461538461538,
          "calculatedVolumeMl": 1
        },
        "sessionId": "695af105b92254a650a26a79",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "Тест темп"
      },
      "executionSessionId": "695af105b92254a650a26a79"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:25.430Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH",
      "metadata": {
        "sessionId": "695af109b92254a650a26ac9",
        "flowId": "prog_test_advansed"
      },
      "executionSessionId": "695af109b92254a650a26ac9"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:26.789Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 1.06 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767341830216",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1.06,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 1357
        },
        "sessionId": "695af109b92254a650a26ac9",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "pH"
      },
      "executionSessionId": "695af109b92254a650a26ac9"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:26.795Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл Ниско: Iteration 1: 1.06 < [6–8] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767341931585",
        "blockType": "LOOP",
        "blockLabel": "Цикъл Ниско",
        "success": true,
        "sessionId": "695af109b92254a650a26ac9",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "pH"
      },
      "executionSessionId": "695af109b92254a650a26ac9"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:26.793Z"
      },
      "type": "INFO",
      "message": "❓ Условие 2: 1.06 < [6–8] => TRUE",
      "metadata": {
        "blockId": "IF_1767341895819",
        "blockType": "IF",
        "blockLabel": "Условие 2",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 1.06,
          "rightValue": 7,
          "operator": "<",
          "tolerance": 1,
          "strategy": "comparison"
        },
        "sessionId": "695af109b92254a650a26ac9",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "pH"
      },
      "executionSessionId": "695af109b92254a650a26ac9"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:26.791Z"
      },
      "type": "INFO",
      "message": "❓ Условие 1: 1.06 == [6–8] => FALSE",
      "metadata": {
        "blockId": "condition_1767342192686",
        "blockType": "IF",
        "blockLabel": "Условие 1",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 1.06,
          "rightValue": 7,
          "operator": "==",
          "tolerance": 1,
          "strategy": "comparison"
        },
        "sessionId": "695af109b92254a650a26ac9",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "pH"
      },
      "executionSessionId": "695af109b92254a650a26ac9"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T23:00:29.499Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа pH+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767341926368",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа pH+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 2307.6923076923076,
          "calculatedVolumeMl": 2
        },
        "sessionId": "695af109b92254a650a26ac9",
        "windowId": "tw_1767397161163_4sw62wba9",
        "windowName": "Прозорец 1",
        "flowName": "pH"
      },
      "executionSessionId": "695af109b92254a650a26ac9"
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-04T23:00:29.501Z"
  }
}