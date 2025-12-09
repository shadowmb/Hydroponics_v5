Данните на сенсзора в ДБ както и стратегията с две точки, като 1685 резеровара трябва да е 0 празен , а при 41 тярвба да е 100 (литра) пълен:
{
  "_id": {
    "$oid": "6932a99dcb81d56e0343a46d"
  },
  "name": "Ultra",
  "type": "SENSOR",
  "isEnabled": true,
  "status": "online",
  "hardware": {
    "pins": [
      {
        "role": "RX",
        "portId": "D12",
        "gpio": 12,
        "_id": {
          "$oid": "69367302270c66bff89a6a02"
        }
      },
      {
        "role": "TX",
        "portId": "D13",
        "gpio": 13,
        "_id": {
          "$oid": "69367302270c66bff89a6a03"
        }
      }
    ],
    "parentId": "6932a965cb81d56e0343a42c"
  },
  "config": {
    "driverId": "dfrobot_a02yyuw",
    "pollInterval": 5000,
    "conversionStrategy": "linear",
    "calibrations": {
      "tank_volume": {
        "lastCalibrated": {
          "$date": "2025-12-09T11:52:13.077Z"
        },
        "data": {
          "data": [
            {
              "raw": 1685,
              "value": 0
            },
            {
              "raw": 41,
              "value": 100
            }
          ]
        }
      }
    }
  },
  "tags": [
    "Distance",
    "Water"
  ],
  "group": "Water",
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-12-05T09:45:01.496Z"
  },
  "updatedAt": {
    "$date": "2025-12-09T11:53:16.271Z"
  },
  "__v": 0,
  "lastConnectionCheck": {
    "$date": "2025-12-08T09:21:14.911Z"
  },
  "lastReading": {
    "value": 1690000,
    "raw": 1690,
    "timestamp": {
      "$date": "2025-12-09T11:53:16.270Z"
    }
  },
  "metadata": {
    "description": ""
  }
}

Това е потока който се изпълянва и искам да следата следната логика - Проверка на резервоара чрез сензор за разстоянеие, след което се преминава към проверка чрез ИФ блок, Ако текущото състояние на резервоара е празен, или по малко от зададената стойнсот чрез глобалната, пусни помпата и влез в луп където за орпеделено време през определено време тествай нивото на водата чрез сензора за разстояние. Ако нивото на резервоара доближи нивото на глобаланта излез от лупа и спри помпата. Ако в началното ниво на резерваора отговаря или е по голямно от зададеното ниво чрез глбоалната, прекрати цикъла. Това е потока който описах като логиак в ДБ:

{
  "_id": {
    "$oid": "693682da270c66bff89a6b7d"
  },
  "id": "test_distanitsiya",
  "name": "Тест Дистаниция",
  "description": "",
  "mode": "SIMPLE",
  "nodes": [
    {
      "id": "start",
      "type": "START",
      "params": {
        "label": "Start",
        "hasError": false
      },
      "position": {
        "x": 104,
        "y": 3
      }
    },
    {
      "id": "end",
      "type": "END",
      "params": {
        "label": "End",
        "hasError": false
      },
      "position": {
        "x": 400,
        "y": 100
      }
    },
    {
      "id": "SENSOR_READ_1765180056364",
      "type": "SENSOR_READ",
      "params": {
        "label": "Read Sensor",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "hasError": false,
        "deviceId": "6932a99dcb81d56e0343a46d",
        "variable": "var_1"
      },
      "position": {
        "x": 197.5,
        "y": 124.75
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-SENSOR_READ_1765180056364",
      "source": "start",
      "target": "SENSOR_READ_1765180056364",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__SENSOR_READ_1765180056364-end",
      "source": "SENSOR_READ_1765180056364",
      "target": "end",
      "type": "smoothstep"
    }
  ],
  "inputs": [],
  "variables": [
    {
      "id": "var_1",
      "name": "Дистаниця",
      "type": "number",
      "scope": "local",
      "unit": "m",
      "hasTolerance": false,
      "description": "",
      "_id": {
        "$oid": "693682da270c66bff89a6b7e"
      }
    }
  ],
  "isActive": true,
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-12-08T07:48:42.290Z"
  },
  "updatedAt": {
    "$date": "2025-12-08T08:45:00.636Z"
  },
  "__v": 0
}


Рестартирах сървъра, презаредих програмта и я активирах и тов е лога в backenda:

[2025-12-09 14:03:40.722 +0200] INFO: тЦ╢я╕П Active Program Started
    env: "development"
[SensorRead] ✔️ Saved to 'var_1': 1683 l
[ActuatorSet] ✔️ Set 'ON' (State: 1)
[2025-12-09 14:03:47.909 +0200] INFO: тЪб Cycle Force Started (Time updated to Now)
    env: "development"
    itemId: "6938100d801493ff2ffcc4e9"
    newTime: "14:03"
[2025-12-09 14:03:47.915 +0200] INFO: Attempting to start cycle with sanitized steps
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    steps: [
      {
        "flowId": "test_gr",
        "overrides": {}
      }
    ]
[2025-12-09 14:03:47.919 +0200] INFO: ЁЯЪА Starting Cycle
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    sessionId: "69381023801493ff2ffcc533"
    stepsCount: 1
[2025-12-09 14:03:47.919 +0200] INFO: тЦ╢я╕П Executing Cycle Step
    env: "development"
    step: 0
    flowId: "test_gr"
[2025-12-09 14:03:47.931 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "69381023801493ff2ffcc539"
    programId: "test_gr"
    variables: {}
[2025-12-09 14:03:48.023 +0200] INFO: ЁЯФМ [HardwareService] Creating UDP Transport
    env: "development"
    controllerId: "6932a965cb81d56e0343a42c"
    ip: "10.1.10.253"
[2025-12-09 14:03:48.023 +0200] INFO: ЁЯФМ [UdpTransport] Initializing...
    env: "development"
    ip: "10.1.10.253"
    port: 8888
[2025-12-09 14:03:48.024 +0200] INFO: тЬЕ [UdpTransport] Listening
    env: "development"
    address: {
      "address": "0.0.0.0",
      "family": "IPv4",
      "port": 56884
    }
[2025-12-09 14:03:48.317 +0200] INFO: ЁЯФД [HardwareService] Strategy Changed Output Unit
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    strategy: "tank_volume"
    driverUnit: "mm"
    newUnit: "l"
[2025-12-09 14:03:48.317 +0200] INFO: ЁЯФН [HardwareService] Checking Normalization
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    driverId: "dfrobot_a02yyuw"
    sourceUnit: "l"
    raw: 1683
    value: 1683
[2025-12-09 14:03:48.318 +0200] INFO: ЁЯФН [HardwareService] Normalization Result
    env: "development"
    normalized: {
      "value": 1683000,
      "baseUnit": "ml"
    }
[2025-12-09 14:03:48.318 +0200] INFO: ЁЯУП [HardwareService] Normalized Value
    env: "development"
    deviceId: "6932a99dcb81d56e0343a46d"
    from: "l"
    to: "ml"
    original: 1683
    normalized: 1683000
[ActuatorSet] ✔️ Set 'OFF' (State: 0)
[2025-12-09 14:03:48.728 +0200] INFO: тЬЕ Cycle Step Completed
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
    step: 0
[2025-12-09 14:03:48.728 +0200] INFO: ЁЯПБ Cycle Completed Successfully
    env: "development"
    sessionId: "69381023801493ff2ffcc533"
[2025-12-09 14:03:48.754 +0200] INFO: тЬЕ Active Program Cycle Marked Completed
    env: "development"
    cycleId: "6937e322a171a54cf8810a54"
