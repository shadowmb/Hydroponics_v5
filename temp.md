{
  "_id": {
    "$oid": "695ceb183ca221d45d68b3da"
  },
  "date": "2026-01-06",
  "programId": "prog_testph_sim",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-06T10:59:36.393Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-06T10:59:36.392Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-06T10:59:36.392Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:00.046Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "695ceb3009a10176b895eff5",
        "flowId": "prog_testph_sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:00.165Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 3.30 == [5.80–6.20] => FALSE",
      "metadata": {
        "blockId": "IF_1767603196469",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 3.3,
          "rightValue": 6,
          "operator": "==",
          "tolerance": 0.2,
          "strategy": "comparison"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:00.163Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 3.30 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767602172874",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 3.3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 109
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:00.170Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 3.30 < [5.80–6.20] => TRUE",
      "metadata": {
        "blockId": "IF_1767603252978",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 3.3,
          "rightValue": 6,
          "operator": "<",
          "tolerance": 0.2,
          "strategy": "comparison"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:00.174Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 1: 3.30 <= [5.80–6.20] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 3.3,
          "rightValue": 6,
          "operator": "<=",
          "tolerance": 0.2,
          "strategy": "loop_check"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:01.604Z"
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
          "durationMs": 1153.8461538461538,
          "calculatedVolumeMl": 1
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:16.888Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:16.934Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 4 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 4,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 43
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:17.940Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 2: 4.00 <= [5.80–6.20] => TRUE (Continuing)",
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
          "rightValue": 6,
          "operator": "<=",
          "tolerance": 0.2,
          "strategy": "loop_check"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:19.205Z"
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
          "durationMs": 1153.8461538461538,
          "calculatedVolumeMl": 1
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:34.520Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:34.547Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 4.60 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 4.6,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 25
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:35.554Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 3: 4.60 <= [5.80–6.20] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 4.6,
          "rightValue": 6,
          "operator": "<=",
          "tolerance": 0.2,
          "strategy": "loop_check"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:36.938Z"
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
          "durationMs": 1153.8461538461538,
          "calculatedVolumeMl": 1
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:52.226Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:52.252Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5.30 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5.3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 24
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:53.260Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 4: 5.30 <= [5.80–6.20] => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 5.3,
          "rightValue": 6,
          "operator": "<=",
          "tolerance": 0.2,
          "strategy": "loop_check"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:00:54.533Z"
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
          "durationMs": 1153.8461538461538,
          "calculatedVolumeMl": 1
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:01:09.840Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603706936",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:01:09.893Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5.90 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5.9,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 50
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    },
    {
      "timestamp": {
        "$date": "2026-01-06T11:01:10.911Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 5: 5.90 <= [5.80–6.20] => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 5.9,
          "rightValue": 6,
          "operator": "<=",
          "tolerance": 0.2,
          "strategy": "loop_check"
        },
        "sessionId": "695ceb3009a10176b895eff5",
        "windowId": null,
        "windowName": null,
        "flowName": "pH Sim"
      },
      "executionSessionId": "695ceb3009a10176b895eff5"
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-06T11:01:10.916Z"
  }
}