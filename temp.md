{
  "_id": {
    "$oid": "69313a6c8b787c26d530f648"
  },
  "id": "ec_ab",
  "name": "EC AB",
  "description": "Това е поток който мери първоначално ЕС и ако е точно, започва поливане. Ако има отклонение по голямо от толеранса и в в отрицателна посока, тогава активра помпите за разтовр А/Б до достигане на нужното количество ЕС",
  "mode": "SIMPLE",
  "nodes": [
    {
      "id": "start",
      "type": "START",
      "params": {
        "label": "START"
      },
      "position": {
        "x": 70.5,
        "y": -60
      }
    },
    {
      "id": "end",
      "type": "END",
      "params": {
        "label": "END"
      },
      "position": {
        "x": 393.5272219219886,
        "y": 529.1450191865065
      }
    },
    {
      "id": "SENSOR_READ_1764833627709",
      "type": "SENSOR_READ",
      "params": {
        "label": "Сензор за ЕС",
        "deviceId": "6931354623b1320394ed43dd",
        "comment": "Прочитане на стойнсот на EC в главен резервоар",
        "variable": "var_1"
      },
      "position": {
        "x": 230.43630857225006,
        "y": -24.977650293224876
      }
    },
    {
      "id": "IF_1764833637197",
      "type": "IF",
      "params": {
        "label": "Проверка за ЕС",
        "operator": ">=",
        "variable": "var_1",
        "value": "{{global_2}}",
        "comment": "Проверява дали желаното ЕС отговара на текущото"
      },
      "position": {
        "x": 230.4250391235958,
        "y": 89.75218138471314
      }
    },
    {
      "id": "ACTUATOR_SET_1764833876058",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Помпа А",
        "action": "DOSE",
        "deviceId": "6931357223b1320394ed4416",
        "amount": "{{global_3}}",
        "comment": "Това е помпа от ратвор А за ЕС която работи по дози в милилитри"
      },
      "position": {
        "x": 618.7557808037758,
        "y": 296.5517404113317
      }
    },
    {
      "id": "LOOP_1764923284000",
      "type": "LOOP",
      "params": {
        "label": "Цикъл",
        "loopType": "WHILE",
        "count": 1,
        "maxIterations": 10,
        "operator": "<",
        "comment": "Активират се помпите за разтвор А и Б за покачване на ЕС до нужното ниво",
        "variable": "var_1",
        "value": "{{global_2}}"
      },
      "position": {
        "x": 409.53760994016665,
        "y": 201.0180142002381
      }
    },
    {
      "id": "generic_1764923587450",
      "type": "SENSOR_READ",
      "params": {
        "label": "Сензор ЕС",
        "deviceId": "6931354623b1320394ed43dd",
        "comment": "Прочитане на стойнсот на EC в главен резервоар",
        "variable": "var_1"
      },
      "position": {
        "x": 687.5044990456879,
        "y": 576.4117179209984
      }
    },
    {
      "id": "ACTUATOR_SET_1764923608057",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Помпа поливане",
        "action": "PULSE_ON",
        "deviceId": "6931359e23b1320394ed4482",
        "duration": "{{global_4}}",
        "comment": "Това е главната помпа която полива"
      },
      "position": {
        "x": 159.4908608487031,
        "y": 371.06959620109495
      }
    },
    {
      "id": "generic_1764923612221",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Помпа Б",
        "action": "DOSE",
        "deviceId": "6931358123b1320394ed4437",
        "amount": "{{global_3}}",
        "comment": "Това е помпа от ратвор А за ЕС която работи по дози в милилитри"
      },
      "position": {
        "x": 648.9631621421823,
        "y": 434.9587704331156
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-SENSOR_READ_1764833627709",
      "source": "start",
      "target": "SENSOR_READ_1764833627709",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__SENSOR_READ_1764833627709-IF_1764833637197",
      "source": "SENSOR_READ_1764833627709",
      "target": "IF_1764833637197",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1764833637197false-LOOP_1764923284000",
      "source": "IF_1764833637197",
      "target": "LOOP_1764923284000",
      "sourceHandle": "false",
      "type": "smoothstep",
      "style": {
        "stroke": "#ef4444"
      }
    },
    {
      "id": "xy-edge__LOOP_1764923284000body-ACTUATOR_SET_1764833876058",
      "source": "LOOP_1764923284000",
      "target": "ACTUATOR_SET_1764833876058",
      "sourceHandle": "body",
      "type": "smoothstep",
      "style": {
        "stroke": "#22c55e"
      }
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1764833876058-generic_1764923612221",
      "source": "ACTUATOR_SET_1764833876058",
      "target": "generic_1764923612221",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__generic_1764923612221-generic_1764923587450",
      "source": "generic_1764923612221",
      "target": "generic_1764923587450",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__LOOP_1764923284000exit-ACTUATOR_SET_1764923608057",
      "source": "LOOP_1764923284000",
      "target": "ACTUATOR_SET_1764923608057",
      "sourceHandle": "exit",
      "type": "smoothstep",
      "style": {
        "stroke": "#ef4444"
      }
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1764923608057-end",
      "source": "ACTUATOR_SET_1764923608057",
      "target": "end",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1764833637197true-ACTUATOR_SET_1764923608057",
      "source": "IF_1764833637197",
      "target": "ACTUATOR_SET_1764923608057",
      "sourceHandle": "true",
      "type": "smoothstep",
      "style": {
        "stroke": "#22c55e"
      }
    }
  ],
  "inputs": [],
  "variables": [
    {
      "id": "var_1",
      "name": "ЕС local",
      "type": "number",
      "scope": "local",
      "unit": "mS/cm",
      "_id": {
        "$oid": "69313a6c8b787c26d530f649"
      }
    },
    {
      "id": "global_2",
      "name": "EC Need",
      "type": "number",
      "scope": "global",
      "unit": "mS/cm",
      "hasTolerance": true,
      "description": "Стойнсот на желаното ЕС",
      "_id": {
        "$oid": "69313a6c8b787c26d530f64a"
      }
    },
    {
      "id": "global_3",
      "name": "А/Б Доза",
      "type": "number",
      "scope": "global",
      "unit": "ml",
      "hasTolerance": true,
      "description": "Каква доза да се долее от разтвори А и Б в милилитри",
      "_id": {
        "$oid": "69313bb98b787c26d530f764"
      }
    },
    {
      "id": "global_4",
      "name": "Помпа поливане",
      "type": "number",
      "scope": "global",
      "unit": "min",
      "hasTolerance": true,
      "description": "Това е помапта за поливане като се въведе време за работа в минути",
      "_id": {
        "$oid": "69329a157d90cb79577a5e43"
      }
    }
  ],
  "isActive": true,
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-12-04T07:38:20.667Z"
  },
  "updatedAt": {
    "$date": "2025-12-05T09:01:42.794Z"
  },
  "__v": 0
}