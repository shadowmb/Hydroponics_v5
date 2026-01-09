programdailylogs:
{
  "_id": {
    "$oid": "6960fa433ca221d45d6c0852"
  },
  "date": "2026-01-09",
  "programId": "prog_bigtest",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-09T12:53:23.251Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.250Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-09T12:53:23.250Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.260Z"
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
        "$date": "2026-01-09T12:53:23.685Z"
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
        "$date": "2026-01-09T12:53:23.783Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "6960fa43c4cb8e01378176bb",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.892Z"
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
          "durationMs": 54,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.898Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 30.00 >= 100.00 => FALSE",
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
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.926Z"
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.931Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 1: 30.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 1
        },
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:23.988Z"
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
          "durationMs": 36,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:29.006Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 2: 30.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 2
        },
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:29.043Z"
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
          "durationMs": 21,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "analyticsLabel": "Сензор ниво ГР домати",
          "flowId": "rezervoar",
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:34.059Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 30.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 3
        },
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:34.119Z"
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
          "durationMs": 24,
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:39.131Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 50.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 4
        },
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:39.164Z"
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
          "durationMs": 19,
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:44.182Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 100.00 < 100.00 => FALSE (Done)",
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
          "iteration": 5
        },
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:44.200Z"
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
        "sessionId": "6960fa43c4cb8e01378176bb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Резервоар"
      },
      "executionSessionId": "6960fa43c4cb8e01378176bb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:44.225Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: EC SIM",
      "metadata": {
        "sessionId": "6960fa58c4cb8e013781775a",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:44.276Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 1.00 > 2.60 => FALSE",
      "metadata": {
        "blockId": "IF_1767860729844",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 1,
          "rightValue": 2.6,
          "operator": ">",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:44.277Z"
      },
      "type": "INFO",
      "message": "🔄 Loop: Iteration 1: 1.00 < 2.60 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767860820148",
        "blockType": "LOOP",
        "blockLabel": "Loop",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 1,
          "rightValue": 2.6,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:44.273Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ЕС: Read 1 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767860723368",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ЕС",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 33,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
          "analyticsLabel": "Сензор за ЕС Домати",
          "flowId": "ec_sim",
          "resourceRole": "ec",
          "measurements": [
            {
              "key": "ec",
              "value": 1000,
              "unit": "µS/cm",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 205.46952123484783,
            "baseHwValue": 205.46952123484783,
            "baseHwUnit": "µS/cm",
            "baseLogValue": 1000,
            "baseLogUnit": "µS/cm",
            "activeStrategy": "ec_smart",
            "vMeas": 1004.2,
            "temp": 25,
            "ecRaw": 1000,
            "points": 2,
            "beta": 0.02
          }
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:49.329Z"
      },
      "type": "INFO",
      "message": "⚡ Set Actuator: Dosed 1doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767860849786",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Set Actuator",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 5000,
          "calculatedVolumeMl": 50,
          "deviceId": "695e2f57c434325f8fcb40d1",
          "deviceName": "Pump A SIM",
          "analyticsLabel": "Помпа Разтвор А домати",
          "flowId": "default",
          "resourceRole": "nutrient_a"
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:53:59.369Z"
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
          "analyticsLabel": "Помпа Разтвор Б домати",
          "flowId": "default",
          "resourceRole": "nutrient_b"
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:09.419Z"
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
          "analyticsLabel": "Помпа разбъркване домати",
          "flowId": "default",
          "resourceRole": "mixer"
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:09.450Z"
      },
      "type": "INFO",
      "message": "📊 Read Sensor: Read 2.70 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767861135267",
        "blockType": "SENSOR_READ",
        "blockLabel": "Read Sensor",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 2.7,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 20,
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
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:10.458Z"
      },
      "type": "INFO",
      "message": "🔄 Loop: Iteration 2: 2.70 < 2.60 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767860820148",
        "blockType": "LOOP",
        "blockLabel": "Loop",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 2.7,
          "rightValue": 2.6,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "6960fa58c4cb8e013781775a",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "EC SIM"
      },
      "executionSessionId": "6960fa58c4cb8e013781775a"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:10.501Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "6960fa72c4cb8e01378177cb",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:10.544Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 5.00 < 6.20 => TRUE",
      "metadata": {
        "blockId": "IF_1767603252978",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 5,
          "rightValue": 6.2,
          "operator": "<",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:10.542Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 5.00 == 6.20 => FALSE",
      "metadata": {
        "blockId": "IF_1767603196469",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 5,
          "rightValue": 6.2,
          "operator": "==",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:10.539Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767602172874",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 24,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "analyticsLabel": "Сензор за рН домати",
          "flowId": "ph_sim",
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
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:10.546Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 1: 5.00 <= 6.20 => TRUE (Continuing)",
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
          "iteration": 1
        },
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:11.592Z"
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
          "flowId": "default",
          "resourceRole": "ph_up"
        },
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:21.645Z"
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
          "flowId": "default",
          "resourceRole": "mixer"
        },
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:21.679Z"
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
          "durationMs": 20,
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
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:22.694Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 2: 6.30 <= 6.20 => FALSE (Done)",
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
          "iteration": 2
        },
        "sessionId": "6960fa72c4cb8e01378177cb",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "pH Sim"
      },
      "executionSessionId": "6960fa72c4cb8e01378177cb"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:22.718Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Поливане SIM",
      "metadata": {
        "sessionId": "6960fa7ec4cb8e0137817835",
        "flowId": "prog_bigtest"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:37.784Z"
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
          "flowId": "default",
          "resourceRole": "water"
        },
        "sessionId": "6960fa7ec4cb8e0137817835",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:37.813Z"
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
          "durationMs": 18,
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
        "sessionId": "6960fa7ec4cb8e0137817835",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:37.840Z"
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
          "durationMs": 17,
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
        "sessionId": "6960fa7ec4cb8e0137817835",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:37.867Z"
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
          "durationMs": 20,
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
        "sessionId": "6960fa7ec4cb8e0137817835",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:37.903Z"
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
          "durationMs": 26,
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
        "sessionId": "6960fa7ec4cb8e0137817835",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:37.938Z"
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
          "durationMs": 22,
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
        "sessionId": "6960fa7ec4cb8e0137817835",
        "windowId": "tw_1767861565496_ku2rqdpw9",
        "windowName": "Прозорец 1",
        "flowName": "Поливане SIM"
      },
      "executionSessionId": "6960fa7ec4cb8e0137817835"
    },
    {
      "timestamp": {
        "$date": "2026-01-09T12:54:40.011Z"
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
    "$date": "2026-01-09T12:54:40.012Z"
  }
}



resourcedailysummaries:

{
  "_id": {
    "$oid": "6960fa90c4cb8e01378178af"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-09T12:54:40.029Z"
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
      "value": 70,
      "unit": "L",
      "type": "DELTA",
      "startValue": 30,
      "endValue": 100,
      "count": 6,
      "average": 56.666666666666664,
      "min": 30,
      "max": 100
    },
    "ec": {
      "value": 1.7000000000000002,
      "unit": "mS/cm",
      "type": "TREND",
      "startValue": 1,
      "endValue": 2.7,
      "count": 3,
      "average": 2.1333333333333333,
      "min": 1,
      "max": 2.7
    },
    "nutrient_a": {
      "value": 50,
      "unit": "ml",
      "type": "SUM",
      "count": 1,
      "average": 50,
      "min": 50,
      "max": 50
    },
    "nutrient_b": {
      "value": 100,
      "unit": "ml",
      "type": "SUM",
      "count": 1,
      "average": 100,
      "min": 100,
      "max": 100
    },
    "mixer": {
      "value": 10,
      "unit": "s",
      "type": "NONE",
      "count": 2,
      "average": 10,
      "min": 10,
      "max": 10
    },
    "ph": {
      "value": 1.2999999999999998,
      "unit": "pH",
      "type": "TREND",
      "startValue": 5,
      "endValue": 6.3,
      "count": 3,
      "average": 5.866666666666667,
      "min": 5,
      "max": 6.3
    },
    "ph_up": {
      "value": 1,
      "unit": "ml",
      "type": "SUM",
      "count": 1,
      "average": 1,
      "min": 1,
      "max": 1
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
      "value": 70,
      "unit": "L",
      "type": "DELTA",
      "startValue": 30,
      "endValue": 100
    }
  },
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T12:54:40.031Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T12:54:40.031Z"
  },
  "__v": 0
}