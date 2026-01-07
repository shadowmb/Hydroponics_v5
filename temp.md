{
  "_id": {
    "$oid": "695e59063ca221d45d6a0cec"
  },
  "date": "2026-01-07",
  "programId": "prog_test_nov_ad",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-07T13:00:54.559Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-07T13:00:54.556Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-07T13:00:54.556Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:00:54.569Z"
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
        "$date": "2026-01-07T13:00:55.237Z"
      },
      "type": "TRIGGER_SKIP",
      "message": "Тригер: PAR SIM (60) between 100-300 - не съвпадна",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "triggerId": "tr_1767776080005_ucj6o18qp",
        "sensorValue": 60,
        "condition": "between 100-300"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:00.127Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: StartStop NEW",
      "metadata": {
        "sessionId": "695e590c4a073efe9b2f9f66",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:00.309Z"
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
          "durationMs": 122,
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
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:00.388Z"
      },
      "type": "INFO",
      "message": "📊 Сензор: Read 6.21 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767776623104",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.21,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 35,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.21,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 347.33333333333337,
            "baseHwValue": 347.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.21,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1697.6,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.21
          }
        },
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:00.478Z"
      },
      "type": "INFO",
      "message": "📊 Сенозор ЕС: Read 1 mS/cm",
      "metadata": {
        "blockId": "SENSOR_READ_1767776646455",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сенозор ЕС",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 1,
          "primaryUnit": "mS/cm",
          "strategy": "ec_smart",
          "durationMs": 53,
          "deviceId": "695cf8f309a10176b895f574",
          "deviceName": "EC SIM",
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
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:00.517Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ГР: Read 20 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767776711990",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ГР",
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
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:02.580Z"
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
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:22.619Z"
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
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:32.658Z"
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
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:42.695Z"
      },
      "type": "INFO",
      "message": "⚡ Senzor: Dosed 2doses",
      "metadata": {
        "blockId": "generic_1767781988254",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Senzor",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 2,
          "primaryUnit": "doses",
          "durationMs": 10000,
          "calculatedVolumeMl": 100,
          "deviceId": "695e3634f65986265d5506f9",
          "deviceName": "Pump B SIM",
          "resourceRole": "nutrient_b"
        },
        "sessionId": "695e590c4a073efe9b2f9f66",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e590c4a073efe9b2f9f66"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:01:50.019Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Сутрин\" завърши (Изтекло време)",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.027Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 2\" стартира",
      "metadata": {
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.074Z"
      },
      "type": "TRIGGER_MATCH",
      "message": "Тригер: Mois SIM (15) < 20",
      "metadata": {
        "windowId": "tw_1767783940364_paws173s2",
        "value": 15
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.105Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "695e59844a073efe9b2fa1fc",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.293Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 6.21 == 6.00 => FALSE",
      "metadata": {
        "blockId": "IF_1767603196469",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6,
          "operator": "==",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.295Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 6.21 < 6.00 => FALSE",
      "metadata": {
        "blockId": "IF_1767603252978",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6,
          "operator": "<",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.256Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.21 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767602172874",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.21,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 84,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.21,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 347.33333333333337,
            "baseHwValue": 347.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.21,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1697.6,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.21
          }
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:00.299Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН-: Iteration 1: 6.21 >= 6.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "loop_1767603966706",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН-",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 1
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:01.427Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН-: Dosed 1doses",
      "metadata": {
        "blockId": "generic_1767603662823",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН-",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e1dad92c768e3f5d01280",
          "deviceName": "Pump pH- SIM",
          "resourceRole": "ph_down"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:16.460Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "generic_1767604016675",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:16.495Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.21 pH",
      "metadata": {
        "blockId": "generic_1767604021323",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.21,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 26,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.21,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 347.33333333333337,
            "baseHwValue": 347.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.21,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1697.6,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.21
          }
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:17.499Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН-: Iteration 2: 6.21 >= 6.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "loop_1767603966706",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН-",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 2
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:18.545Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН-: Dosed 1doses",
      "metadata": {
        "blockId": "generic_1767603662823",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН-",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e1dad92c768e3f5d01280",
          "deviceName": "Pump pH- SIM",
          "resourceRole": "ph_down"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:33.587Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "generic_1767604016675",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:33.622Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.21 pH",
      "metadata": {
        "blockId": "generic_1767604021323",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.21,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 25,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.21,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 347.33333333333337,
            "baseHwValue": 347.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.21,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1697.6,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.21
          }
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:34.641Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН-: Iteration 3: 6.21 >= 6.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "loop_1767603966706",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН-",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 3
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:35.673Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН-: Dosed 1doses",
      "metadata": {
        "blockId": "generic_1767603662823",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН-",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e1dad92c768e3f5d01280",
          "deviceName": "Pump pH- SIM",
          "resourceRole": "ph_down"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:50.726Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "generic_1767604016675",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:50.782Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.21 pH",
      "metadata": {
        "blockId": "generic_1767604021323",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.21,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 38,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 6.21,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 347.33333333333337,
            "baseHwValue": 347.33333333333337,
            "baseHwUnit": "adc",
            "baseLogValue": 6.21,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 1697.6,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 6.21
          }
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:51.802Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН-: Iteration 4: 6.21 >= 6.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "loop_1767603966706",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН-",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 4
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:03:52.861Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН-: Dosed 1doses",
      "metadata": {
        "blockId": "generic_1767603662823",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН-",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e1dad92c768e3f5d01280",
          "deviceName": "Pump pH- SIM",
          "resourceRole": "ph_down"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:07.918Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "generic_1767604016675",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:07.955Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.50 pH",
      "metadata": {
        "blockId": "generic_1767604021323",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
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
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:08.971Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН-: Iteration 5: 6.50 >= 6.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "loop_1767603966706",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН-",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 6.5,
          "rightValue": 6,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 5
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:10.029Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН-: Dosed 1doses",
      "metadata": {
        "blockId": "generic_1767603662823",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Помпа рН-",
        "success": true,
        "logData": {
          "action": "DOSE",
          "strategy": "volumetric",
          "primaryValue": 1,
          "primaryUnit": "doses",
          "durationMs": 1000,
          "calculatedVolumeMl": 1,
          "deviceId": "695e1dad92c768e3f5d01280",
          "deviceName": "Pump pH- SIM",
          "resourceRole": "ph_down"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:25.083Z"
      },
      "type": "INFO",
      "message": "⚡ Разбъркване: Pulsed ON for 15.0s",
      "metadata": {
        "blockId": "generic_1767604016675",
        "blockType": "ACTUATOR_SET",
        "blockLabel": "Разбъркване",
        "success": true,
        "logData": {
          "action": "PULSE_ON",
          "strategy": "time_based",
          "primaryValue": 15,
          "primaryUnit": "s",
          "durationMs": 15000,
          "deviceId": "695e1dde92c768e3f5d01336",
          "deviceName": "Pump Mix SIM",
          "resourceRole": "mixer"
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:25.123Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 5 pH",
      "metadata": {
        "blockId": "generic_1767604021323",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 5,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 29,
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
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.137Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН-: Iteration 6: 5.00 >= 6.00 => FALSE (Done)",
      "metadata": {
        "blockId": "loop_1767603966706",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН-",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 5,
          "rightValue": 6,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 6
        },
        "sessionId": "695e59844a073efe9b2fa1fc",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e59844a073efe9b2fa1fc"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.171Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "695e59da4a073efe9b2fa345",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.223Z"
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
          "durationMs": 29,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.228Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.272Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.270Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:26.303Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:27.314Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:27.345Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:28.351Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:28.378Z"
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
          "durationMs": 17,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:29.385Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 20.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 4
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:29.418Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:30.427Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 20.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 5
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:30.461Z"
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
          "durationMs": 24,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:31.477Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 6: 20.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 6
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:31.503Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:32.518Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 7: 20.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 7
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:32.589Z"
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
          "durationMs": 61,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:33.596Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 8: 20.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 8
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:33.622Z"
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
          "durationMs": 15,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:34.631Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 9: 20.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 9
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:34.657Z"
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
          "durationMs": 17,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:35.673Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 10: 30.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 10
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:35.701Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:36.711Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 11: 30.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 11
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:36.738Z"
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
          "durationMs": 16,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:37.746Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 12: 40.00 < 100.00 => TRUE (Continuing)",
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
          "tolerance": 0,
          "strategy": "loop_check",
          "iteration": 12
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:37.768Z"
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
          "durationMs": 15,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:38.783Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 13: 50.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 13
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:38.808Z"
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
          "durationMs": 18,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:39.815Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 14: 50.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 14
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:39.850Z"
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
          "durationMs": 20,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:40.860Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 15: 80.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 15
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:40.886Z"
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
          "durationMs": 19,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:41.898Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 16: 80.00 < 100.00 => TRUE (Continuing)",
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
          "iteration": 16
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:41.927Z"
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
          "durationMs": 21,
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:42.933Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 17: 100.00 < 100.00 => FALSE (Done)",
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
          "iteration": 17
        },
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:42.957Z"
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
        "sessionId": "695e59da4a073efe9b2fa345",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e59da4a073efe9b2fa345"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T13:04:50.007Z"
      },
      "type": "WINDOW_EVENT",
      "message": "Прозорец \"Прозорец 2\" завърши (Изтекло време)",
      "metadata": {
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2"
      }
    }
  ],
  "isVisible": true,
  "updatedAt": {
    "$date": "2026-01-07T13:04:50.008Z"
  }
}