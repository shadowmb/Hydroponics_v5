{
  "_id": {
    "$oid": "695aca87ef1bc74ee6cf4351"
  },
  "date": "2026-01-04",
  "programId": "prog_test_advansed",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-04T20:16:07.449Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:07.447Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-04T20:16:07.447Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:07.457Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" стартира",
      "metadata": {
        "windowId": "tw_1767397161163_4sw62wba9"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:09.575Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер:  Ultrasonic (205.3) > 150",
      "metadata": {
        "windowId": "tw_1767397161163_4sw62wba9",
        "value": 205.3
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:09.597Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Тест темп",
      "metadata": {
        "sessionId": "695aca890d1d6b55814a3a12",
        "flowId": "prog_test_advansed"
      },
      "executionSessionId": "695aca890d1d6b55814a3a12"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:11.554Z"
      },
      "type": "INFO",
      "message": "❓ Проверка: 205.30 > [130–150] => TRUE",
      "metadata": {
        "blockId": "IF_1767540099917",
        "blockType": "IF",
        "blockLabel": "Проверка",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 205.3,
          "rightValue": 140,
          "operator": ">",
          "tolerance": 10,
          "strategy": "comparison"
        },
        "sessionId": "695aca890d1d6b55814a3a12"
      },
      "executionSessionId": "695aca890d1d6b55814a3a12"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:11.551Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Distance: Read 205.30 cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767397080404",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Distance",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 205.3,
          "primaryUnit": "cm",
          "strategy": "linear",
          "durationMs": 1952
        },
        "sessionId": "695aca890d1d6b55814a3a12"
      },
      "executionSessionId": "695aca890d1d6b55814a3a12"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:21.339Z"
      },
      "type": "INFO",
      "message": "⚡ Pump A: Dosed 8doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767540068441",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Pump A",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 8,
          "primaryUnit": "doses",
          "durationMs": 9230.76923076923,
          "calculatedVolumeMl": 8
        },
        "sessionId": "695aca890d1d6b55814a3a12"
      },
      "executionSessionId": "695aca890d1d6b55814a3a12"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:21.354Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH",
      "metadata": {
        "sessionId": "695aca950d1d6b55814a3a5c",
        "flowId": "prog_test_advansed"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:22.286Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 1.09 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767341830216",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1.09,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 931
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:22.292Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл Ниско: Iteration 1: 1.09 < [6–10] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767341931585",
        "blockType": "LOOP",
        "blockLabel": "Цикъл Ниско",
        "success": true,
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:22.288Z"
      },
      "type": "INFO",
      "message": "❓ Условие 1: 1.09 == [6–10] => FALSE",
      "metadata": {
        "blockId": "condition_1767342192686",
        "blockType": "IF",
        "blockLabel": "Условие 1",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 1.09,
          "rightValue": 8,
          "operator": "==",
          "tolerance": 2,
          "strategy": "comparison"
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:22.290Z"
      },
      "type": "INFO",
      "message": "❓ Условие 2: 1.09 < [6–10] => TRUE",
      "metadata": {
        "blockId": "IF_1767341895819",
        "blockType": "IF",
        "blockLabel": "Условие 2",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 1.09,
          "rightValue": 8,
          "operator": "<",
          "tolerance": 2,
          "strategy": "comparison"
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:30.791Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа pH+: Dosed 7doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767341926368",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа pH+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 7,
          "primaryUnit": "doses",
          "durationMs": 8076.923076923076,
          "calculatedVolumeMl": 7
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:51.262Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 20.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767342128576",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 20,
          "primaryUnit": "s",
          "durationMs": 20000
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:51.507Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 1.11 pH",
      "metadata": {
        "blockId": "generic_1767342414991",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1.11,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 243
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:16:52.524Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл Ниско: Iteration 2: 1.11 < [6–10] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767341931585",
        "blockType": "LOOP",
        "blockLabel": "Цикъл Ниско",
        "success": true,
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:00.958Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа pH+: Dosed 7doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767341926368",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа pH+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 7,
          "primaryUnit": "doses",
          "durationMs": 8076.923076923076,
          "calculatedVolumeMl": 7
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:21.251Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 20.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767342128576",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 20,
          "primaryUnit": "s",
          "durationMs": 20000
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:21.315Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 1.08 pH",
      "metadata": {
        "blockId": "generic_1767342414991",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1.08,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 62
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:22.332Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл Ниско: Iteration 3: 1.08 < [6–10] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767341931585",
        "blockType": "LOOP",
        "blockLabel": "Цикъл Ниско",
        "success": true,
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:30.639Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа pH+: Dosed 7doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767341926368",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа pH+",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 7,
          "primaryUnit": "doses",
          "durationMs": 8076.923076923076,
          "calculatedVolumeMl": 7
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:51.056Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 20.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767342128576",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 20,
          "primaryUnit": "s",
          "durationMs": 20000
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:51.292Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 1.08 pH",
      "metadata": {
        "blockId": "generic_1767342414991",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1.08,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 235
        },
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:17:52.299Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл Ниско: Iteration 4: 1.08 < 8.00 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767341931585",
        "blockType": "LOOP",
        "blockLabel": "Цикъл Ниско",
        "success": true,
        "sessionId": "695aca950d1d6b55814a3a5c"
      },
      "executionSessionId": "695aca950d1d6b55814a3a5c"
    },
    {
      "timestamp": {
        "$date": "2026-01-04T20:18:00.004Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 1\" завърши (Изтекло време)",
      "metadata": {
        "windowId": "tw_1767397161163_4sw62wba9"
      }
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-04T20:18:00.005Z"
  }
}