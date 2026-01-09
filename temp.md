programdailylogs:

{
  "_id": {
    "$oid": "696111613ca221d45d6c22ce"
  },
  "programId": "prog_bigtest",
  "date": "2026-01-09",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-09T14:32:01.332Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:01.330Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-09T14:32:01.329Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:01.345Z"
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
        "$date": "2026-01-09T14:32:01.990Z"
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
        "$date": "2026-01-09T14:32:02.057Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "6961116256dc065e983bfdbf",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:02.163Z"
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:02.155Z"
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
          "durationMs": 68,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:02.219Z"
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
          "analyticsLabel": "Помпа  поливане домати",
          "flowId": "rezervoar",
          "resourceRole": "water"
        },
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:02.226Z"
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:02.383Z"
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
          "durationMs": 86,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:07.403Z"
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:07.450Z"
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
          "durationMs": 35,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:12.461Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 50.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 3
        },
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:12.528Z"
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
          "durationMs": 30,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.532Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 100.00 < 100.00 => FALSE (Done)",
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
          "iteration": 4
        },
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.582Z"
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
          "analyticsLabel": "Помпа  поливане домати",
          "flowId": "rezervoar",
          "resourceRole": "water"
        },
        "sessionId": "6961116256dc065e983bfdbf",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6961116256dc065e983bfdbf"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.651Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: EC SIM",
      "metadata": {
        "sessionId": "6961117156dc065e983bfe48",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6961117156dc065e983bfe48"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.742Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 2.70 > 2.60 => TRUE",
      "metadata": {
        "blockId": "IF_1767860729844",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 2.7,
          "rightValue": 2.6,
          "operator": ">",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6961117156dc065e983bfe48",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6961117156dc065e983bfe48"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.735Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ЕС: Read 2.70 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767860723368",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ЕС",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.7,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 55,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "analyticsLabel": "Сензор за ЕС Домати",
          "flowId": "ec_sim",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2700,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 553.4158018662249,
            "baseHwValue": 553.4158018662249,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2700,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2704.9,
            "temp": 25,
            "ecRaw": 2700,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "6961117156dc065e983bfe48",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6961117156dc065e983bfe48"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.929Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "6961117156dc065e983bfe71",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.999Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 1: 2.00 <= 6.20 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 2,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.988Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 2 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767602172874",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 49,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "analyticsLabel": "Сензор за рН домати",
          "flowId": "ph_sim",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 2,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 66.66666666666666,
            "baseHwValue": 66.66666666666666,
            "baseHwUnit": "adc",
            "baseLogValue": 2,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 325.8,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 2
          }
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.997Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 2.00 < 6.20 => TRUE",
      "metadata": {
        "blockId": "IF_1767603252978",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 2,
          "rightValue": 6.2,
          "operator": "<",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:17.993Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 2.00 == 6.20 => FALSE",
      "metadata": {
        "blockId": "IF_1767603196469",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 2,
          "rightValue": 6.2,
          "operator": "==",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:19.088Z"
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
          "analyticsLabel": "pH+ помпа домати",
          "flowId": "ph_sim",
          "resourceRole": "ph_up"
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:29.165Z"
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
          "analyticsLabel": "Помпа разбъркване домати",
          "flowId": "ph_sim",
          "resourceRole": "mixer"
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:29.212Z"
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
          "durationMs": 36,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "analyticsLabel": "Сензор за рН домати",
          "flowId": "ph_sim",
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
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:30.221Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 2: 4.00 <= 6.20 => TRUE (Continuing)",
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
          "iteration": 2
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:31.264Z"
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
          "analyticsLabel": "pH+ помпа домати",
          "flowId": "ph_sim",
          "resourceRole": "ph_up"
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:41.318Z"
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
          "analyticsLabel": "Помпа разбъркване домати",
          "flowId": "ph_sim",
          "resourceRole": "mixer"
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:41.373Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.30 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 44,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "analyticsLabel": "Сензор за рН домати",
          "flowId": "ph_sim",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.3,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 353.33333333333337,
            "baseHwValue": 353.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.3,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1726.9,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.3
          }
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:42.392Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 3: 6.30 <= 6.20 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 6.3,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "6961117156dc065e983bfe71",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6961117156dc065e983bfe71"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:42.441Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Поливане SIM",
      "metadata": {
        "sessionId": "6961118a56dc065e983bff10",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:57.502Z"
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
          "analyticsLabel": "Помпа  поливане домати",
          "flowId": "polivane",
          "resourceRole": "water"
        },
        "sessionId": "6961118a56dc065e983bff10",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:57.564Z"
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
          "durationMs": 45,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "polivane",
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
        "sessionId": "6961118a56dc065e983bff10",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:57.659Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 2.70 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767703139531",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.7,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 48,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "analyticsLabel": "Сензор за ЕС Домати",
          "flowId": "polivane",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 2700,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 553.4158018662249,
            "baseHwValue": 553.4158018662249,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 2700,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 2704.9,
            "temp": 25,
            "ecRaw": 2700,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "6961118a56dc065e983bff10",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:57.830Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 6.30 pH",
      "metadata": {
        "blockId": "generic_1767703161625",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 147,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "analyticsLabel": "Сензор за рН домати",
          "flowId": "polivane",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.3,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 353.33333333333337,
            "baseHwValue": 353.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.3,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1726.9,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.3
          }
        },
        "sessionId": "6961118a56dc065e983bff10",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:57.905Z"
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
          "durationMs": 31,
          "deviceId": "695cfa4e09a10176b895f731",
          "deviceName": "Mois SIM",
          "analyticsLabel": "Влажност почва домати",
          "flowId": "polivane",
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
        "sessionId": "6961118a56dc065e983bff10",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:32:58.018Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 24 C",
      "metadata": {
        "blockId": "SENSOR_READ_1767861446467",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 24,
          "primaryUnit": "C",
          "strategy": "linear",
          "durationMs": 55,
          "deviceId": "695f6c8f8e054fae1649b275",
          "deviceName": "DS18 SIM",
          "flowId": "polivane",
          "resourceRole": "temp",
          "measurements": [
            {
              "key": "temp",
              "value": 24,
              "unit": "C",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "temp": 24,
            "baseHwValue": 24,
            "baseHwUnit": "C",
            "baseLogValue": 24,
            "baseLogUnit": "C",
            "activeStrategy": "linear"
          }
        },
        "sessionId": "6961118a56dc065e983bff10",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6961118a56dc065e983bff10"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T14:33:00.020Z"
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
    "$date": "2026-01-09T14:33:00.021Z"
  }
}

resourcedailysummaries:

{
  "_id": {
    "$oid": "6961119c56dc065e983bff8a"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-09T14:33:00.101Z"
  },
  "context": {
    "programId": "prog_bigtest",
    "programName": "prog_bigtest",
    "windowId": "tw_1767861565496_ku2rqdpw9",
    "windowName": "Прозорец 1",
    "flowId": "rezervoar",
    "flowName": "rezervoar",
    "executionType": "WINDOW"
  },
  "resources": {
    "volume": {
      "value": 80,
      "unit": "L",
      "type": "DELTA",
      "startValue": 20,
      "endValue": 100,
      "count": 4,
      "average": 47.5,
      "min": 20,
      "max": 100
    },
    "water": {
      "value": 80,
      "unit": "L",
      "type": "DELTA",
      "startValue": 20,
      "endValue": 100
    }
  },
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T14:33:00.103Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T14:33:00.103Z"
  },
  "__v": 0
}

{
  "_id": {
    "$oid": "6961119c56dc065e983bff8c"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-09T14:33:00.108Z"
  },
  "context": {
    "programId": "prog_bigtest",
    "programName": "prog_bigtest",
    "windowId": "tw_1767861565496_ku2rqdpw9",
    "windowName": "Прозорец 1",
    "flowId": "ec_sim",
    "flowName": "rezervoar",
    "executionType": "WINDOW"
  },
  "resources": {
    "ec": {
      "value": 0,
      "unit": "mS/cm",
      "type": "TREND",
      "startValue": 2.7,
      "endValue": 2.7,
      "count": 1,
      "average": 2.7,
      "min": 2.7,
      "max": 2.7
    }
  },
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T14:33:00.109Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T14:33:00.109Z"
  },
  "__v": 0
}

{
  "_id": {
    "$oid": "6961119c56dc065e983bff8e"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-09T14:33:00.114Z"
  },
  "context": {
    "programId": "prog_bigtest",
    "programName": "prog_bigtest",
    "windowId": "tw_1767861565496_ku2rqdpw9",
    "windowName": "Прозорец 1",
    "flowId": "ph_sim",
    "flowName": "rezervoar",
    "executionType": "WINDOW"
  },
  "resources": {
    "ph": {
      "value": 4.3,
      "unit": "pH",
      "type": "TREND",
      "startValue": 2,
      "endValue": 6.3,
      "count": 3,
      "average": 4.1000000000000005,
      "min": 2,
      "max": 6.3
    },
    "ph_up": {
      "value": 2,
      "unit": "ml",
      "type": "SUM",
      "count": 2,
      "average": 1,
      "min": 1,
      "max": 1
    },
    "mixer": {
      "value": 10,
      "unit": "s",
      "type": "NONE",
      "count": 2,
      "average": 10,
      "min": 10,
      "max": 10
    }
  },
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T14:33:00.115Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T14:33:00.115Z"
  },
  "__v": 0
}

{
  "_id": {
    "$oid": "6961119c56dc065e983bff90"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-09T14:33:00.124Z"
  },
  "context": {
    "programId": "prog_bigtest",
    "programName": "prog_bigtest",
    "windowId": "tw_1767861565496_ku2rqdpw9",
    "windowName": "Прозорец 1",
    "flowId": "polivane",
    "flowName": "rezervoar",
    "executionType": "WINDOW"
  },
  "resources": {
    "volume": {
      "value": 0,
      "unit": "L",
      "type": "DELTA",
      "startValue": 100,
      "endValue": 100,
      "count": 1,
      "average": 100,
      "min": 100,
      "max": 100
    },
    "ec": {
      "value": 0,
      "unit": "mS/cm",
      "type": "TREND",
      "startValue": 2.7,
      "endValue": 2.7,
      "count": 1,
      "average": 2.7,
      "min": 2.7,
      "max": 2.7
    },
    "ph": {
      "value": 0,
      "unit": "pH",
      "type": "TREND",
      "startValue": 6.3,
      "endValue": 6.3,
      "count": 1,
      "average": 6.3,
      "min": 6.3,
      "max": 6.3
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
      "value": 0,
      "unit": "L",
      "type": "DELTA",
      "startValue": 100,
      "endValue": 100
    }
  },
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T14:33:00.125Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T14:33:00.125Z"
  },
  "__v": 0
}