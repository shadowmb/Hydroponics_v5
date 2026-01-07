{
  "_id": {
    "$oid": "695e3edd3ca221d45d69f320"
  },
  "programId": "prog_test_nov_ad",
  "date": "2026-01-07",
  "__v": 0,
  "createdAt": {
    "$date": "2026-01-07T11:09:17.817Z"
  },
  "deletedAt": null,
  "events": [
    {
      "timestamp": {
        "$date": "2026-01-07T11:09:17.815Z"
      },
      "type": "INFO",
      "message": "Програмата стартира",
      "metadata": {
        "timestamp": {
          "$date": "2026-01-07T11:09:17.815Z"
        }
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:09:17.827Z"
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
        "$date": "2026-01-07T11:11:30.038Z"
      },
      "type": "TRIGGER_SKIP",
      "message": "Тригер: PAR SIM (305) between 100-300 - не съвпадна",
      "metadata": {
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": null,
        "triggerId": "tr_1767776080005_ucj6o18qp",
        "sensorValue": 305,
        "condition": "between 100-300"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:00.069Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: StartStop NEW",
      "metadata": {
        "sessionId": "695e3f800374fb190bb7d288",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:00.143Z"
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
          "durationMs": 48,
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
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:00.220Z"
      },
      "type": "INFO",
      "message": "📊 Сензор: Read 3 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767776623104",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 64,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 3,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 133.33333333333331,
            "baseHwValue": 133.33333333333331,
            "baseHwUnit": "adc",
            "baseLogValue": 3,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 651.7,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 3
          }
        },
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:00.276Z"
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
          "durationMs": 27,
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
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:00.320Z"
      },
      "type": "INFO",
      "message": "📊 Сензор ГР: Read 60 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767776711990",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 35,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:02.369Z"
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
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:22.402Z"
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
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:32.444Z"
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
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:42.492Z"
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
        "sessionId": "695e3f800374fb190bb7d288",
        "windowId": "tw_1767776032669_zvoij2xz2",
        "windowName": "Сутрин",
        "flowName": "StartStop NEW"
      },
      "executionSessionId": "695e3f800374fb190bb7d288"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:12:50.012Z"
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
        "$date": "2026-01-07T11:14:00.016Z"
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
        "$date": "2026-01-07T11:14:00.042Z"
      },
      "type": "TRIGGER_SKIP",
      "message": "Тригер: Mois SIM (25) < 20 - не съвпадна",
      "metadata": {
        "windowId": "tw_1767783940364_paws173s2",
        "triggerId": "tr_1767783949188_kym599qqr",
        "sensorValue": 25,
        "condition": "< 20"
      }
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:10.013Z"
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
        "$date": "2026-01-07T11:19:10.038Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: pH Sim",
      "metadata": {
        "sessionId": "695e412e0374fb190bb7d509",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:10.096Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 1: 3.00 <= 6.20 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 3,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:10.093Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 3.00 < 6.20 => TRUE",
      "metadata": {
        "blockId": "IF_1767603252978",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 3,
          "rightValue": 6.2,
          "operator": "<",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:10.091Z"
      },
      "type": "INFO",
      "message": "❓ Условие: 3.00 == 6.20 => FALSE",
      "metadata": {
        "blockId": "IF_1767603196469",
        "blockType": "IF",
        "blockLabel": "Условие",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 3,
          "rightValue": 6.2,
          "operator": "==",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:10.087Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 3 pH",
      "metadata": {
        "blockId": "SENSOR_READ_1767602172874",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 28,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 3,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 133.33333333333331,
            "baseHwValue": 133.33333333333331,
            "baseHwUnit": "adc",
            "baseLogValue": 3,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 651.7,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 3
          }
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:12.148Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:32.189Z"
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:32.221Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 3 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 3,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 23,
          "deviceId": "695cd1fc4e26582a9ad753fa",
          "deviceName": "PH SIM",
          "resourceRole": "ph",
          "measurements": [
            {
              "key": "ph",
              "value": 3,
              "unit": "pH",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "value": 133.33333333333331,
            "baseHwValue": 133.33333333333331,
            "baseHwUnit": "adc",
            "baseLogValue": 3,
            "baseLogUnit": "pH",
            "activeStrategy": "ph_smart",
            "vMeas": 651.7,
            "vRef": 5,
            "neutralMv": 1955,
            "temp": 25,
            "isPolStd": false,
            "points": 2,
            "slopeAcid": 325.84,
            "slopeAlkali": 325.84,
            "raw_pH": 3
          }
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:33.225Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 2: 3.00 <= 6.20 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 3,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:35.263Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:55.315Z"
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:55.348Z"
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
          "durationMs": 21,
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:56.357Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 3: 5.00 <= 6.20 => TRUE (Continuing)",
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
          "strategy": "loop_check"
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:19:58.440Z"
      },
      "type": "INFO",
      "message": "⚡ Помпа рН+: Dosed 2doses",
      "metadata": {
        "blockId": "ACTUATOR_SET_1767603376554",
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:18.480Z"
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:18.541Z"
      },
      "type": "INFO",
      "message": "📊 Сензор рН: Read 6.21 pH",
      "metadata": {
        "blockId": "generic_1767603917220",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор рН",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 6.21,
          "primaryUnit": "pH",
          "strategy": "ph_smart",
          "durationMs": 41,
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
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.548Z"
      },
      "type": "INFO",
      "message": "🔄 Цикъл рН+: Iteration 4: 6.21 <= 6.20 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767603818056",
        "blockType": "LOOP",
        "blockLabel": "Цикъл рН+",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 6.21,
          "rightValue": 6.2,
          "operator": "<=",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e412e0374fb190bb7d509",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "pH Sim"
      },
      "executionSessionId": "695e412e0374fb190bb7d509"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.589Z"
      },
      "type": "FLOW_EXECUTED",
      "message": "Стартиран поток: Резервоар",
      "metadata": {
        "sessionId": "695e41730374fb190bb7d5e7",
        "flowId": "prog_test_nov_ad"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.629Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "SENSOR_READ_1767702436022",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 27,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.634Z"
      },
      "type": "INFO",
      "message": "❓ Condition (IF): 60.00 >= 100.00 => FALSE",
      "metadata": {
        "blockId": "IF_1767702486445",
        "blockType": "IF",
        "blockLabel": "Condition (IF)",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": ">=",
          "tolerance": 0,
          "strategy": "comparison"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.680Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 1: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.678Z"
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
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:19.731Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 35,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:20.750Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 2: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:20.784Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 25,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:21.789Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 3: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:21.821Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 22,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:22.825Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 4: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:22.881Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 48,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:23.892Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 5: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:23.928Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 21,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:24.931Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 6: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:24.963Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 20,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:25.968Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 7: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:26.041Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 19,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:27.059Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 8: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:27.091Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 22,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:28.108Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 9: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:28.135Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 19,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:29.143Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 10: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:29.175Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 60 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 60,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 25,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 192,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 60,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 192,
            "baseHwValue": 192,
            "baseHwUnit": "mm",
            "baseLogValue": 60,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:30.179Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 11: 60.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 60,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:30.212Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 8 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 8,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 21,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 51.6,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 8,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 51.6,
            "baseHwValue": 51.6,
            "baseHwUnit": "mm",
            "baseLogValue": 8,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:31.220Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 12: 8.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 8,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:31.246Z"
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
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:32.256Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 13: 80.00 < 100.00 => TRUE (Continuing)",
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
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:32.315Z"
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
          "durationMs": 50,
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
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:33.322Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 14: 80.00 < 100.00 => TRUE (Continuing)",
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
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:33.351Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 99 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 99,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 21,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 297.3,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 99,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 297.3,
            "baseHwValue": 297.3,
            "baseHwUnit": "mm",
            "baseLogValue": 99,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:34.361Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 15: 99.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 99,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:34.394Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 99 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 99,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 20,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 297.3,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 99,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 297.3,
            "baseHwValue": 297.3,
            "baseHwUnit": "mm",
            "baseLogValue": 99,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:35.410Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 16: 99.00 < 100.00 => TRUE (Continuing)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 1,
          "primaryUnit": "bool",
          "leftValue": 99,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:35.442Z"
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
          "durationMs": 23,
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
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:36.457Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 17: 10.00 < 100.00 => TRUE (Continuing)",
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
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:36.484Z"
      },
      "type": "INFO",
      "message": "📊 Сензор Ниво ГР: Read 101.00 L",
      "metadata": {
        "blockId": "generic_1767702656664",
        "blockType": "SENSOR_READ",
        "blockLabel": "Сензор Ниво ГР",
        "success": true,
        "logData": {
          "action": "READ",
          "primaryValue": 101.00000000000001,
          "primaryUnit": "L",
          "strategy": "tank_volume",
          "durationMs": 19,
          "deviceId": "695cf9d709a10176b895f66d",
          "deviceName": "Ultra SIM",
          "resourceRole": "volume",
          "measurements": [
            {
              "key": "distance",
              "value": 302.70000000000005,
              "unit": "mm",
              "isPrimary": false
            },
            {
              "key": "volume",
              "value": 101.00000000000001,
              "unit": "L",
              "isPrimary": true
            }
          ],
          "rawContext": {
            "ok": 1,
            "distance": 302.70000000000005,
            "baseHwValue": 302.70000000000005,
            "baseHwUnit": "mm",
            "baseLogValue": 101.00000000000001,
            "baseLogUnit": "L",
            "activeStrategy": "tank_volume"
          }
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:37.495Z"
      },
      "type": "INFO",
      "message": "🔄 Проверка ниво ГР: Iteration 18: 101.00 < 100.00 => FALSE (Done)",
      "metadata": {
        "blockId": "LOOP_1767702567019",
        "blockType": "LOOP",
        "blockLabel": "Проверка ниво ГР",
        "success": true,
        "logData": {
          "action": "CHECK",
          "primaryValue": 0,
          "primaryUnit": "bool",
          "leftValue": 101.00000000000001,
          "rightValue": 100,
          "operator": "<",
          "tolerance": 0,
          "strategy": "loop_check"
        },
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:37.550Z"
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
        "sessionId": "695e41730374fb190bb7d5e7",
        "windowId": "tw_1767783940364_paws173s2",
        "windowName": "Прозорец 2",
        "flowName": "Резервоар"
      },
      "executionSessionId": "695e41730374fb190bb7d5e7"
    },
    {
      "timestamp": {
        "$date": "2026-01-07T11:20:40.008Z"
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
    "$date": "2026-01-07T11:20:40.009Z"
  }
}