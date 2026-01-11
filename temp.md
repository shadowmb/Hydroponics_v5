{
  "_id": {
    "$oid": "695777c6963d1a2f7f7b8a97"
  },
  "id": "es",
  "name": "ЕС",
  "description": "Проверка на ЕС и доливане на рзтвори А/Б",
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
        "x": 100,
        "y": 100
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
        "x": 89.86307991700914,
        "y": 748.6555667778338
      }
    },
    {
      "id": "SENSOR_READ_1767339700480",
      "type": "SENSOR_READ",
      "params": {
        "label": "Сензор ЕС",
        "readingType": "ec_smart",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "variable": "var_1",
        "deviceId": "695d89017dff83164c8abc06"
      },
      "position": {
        "x": 129.5,
        "y": 211.25
      }
    },
    {
      "id": "IF_1767339718548",
      "type": "IF",
      "params": {
        "operator": "<",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Condition (IF)",
        "hasError": false,
        "variable": "global_2",
        "value": "{{var_1}}"
      },
      "position": {
        "x": 188.5,
        "y": 377.75
      }
    },
    {
      "id": "ACTUATOR_SET_1767341102298",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Старт помпа А",
        "strategy": "volumetric_flow",
        "durationUnit": "sec",
        "amountMode": "DOSES",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "hasError": false,
        "action": "DOSE",
        "amount": "{{global_3}}",
        "deviceId": "695d8abf7dff83164c8abe98"
      },
      "position": {
        "x": 507.1345229170813,
        "y": 661.4521835149417
      }
    },
    {
      "id": "generic_1767341398055",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Старт помпаБ",
        "strategy": "volumetric_flow",
        "durationUnit": "sec",
        "amountMode": "DOSES",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "hasError": false,
        "action": "DOSE",
        "amount": "{{global_3}}",
        "deviceId": "695d8b267dff83164c8abf32"
      },
      "position": {
        "x": 508.8137983677845,
        "y": 818.8043411972594
      }
    },
    {
      "id": "ACTUATOR_SET_1767341425163",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Разбъркване",
        "strategy": "actuator_manual",
        "durationUnit": "sec",
        "amountMode": "VOLUME",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "hasError": false,
        "action": "PULSE_ON",
        "duration": "{{global_4}}",
        "deviceId": "695d8bcf7dff83164c8ac0fc"
      },
      "position": {
        "x": 508.563399228465,
        "y": 976.1762114992669
      }
    },
    {
      "id": "LOOP_1767341469418",
      "type": "LOOP",
      "params": {
        "label": "Loop",
        "limitMode": "COUNT",
        "interval": 5,
        "intervalUnit": "sec",
        "count": 10,
        "timeout": 60,
        "timeoutUnit": "sec",
        "operator": "<",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}"
      },
      "position": {
        "x": 269.08018171982224,
        "y": 522.2190998294026
      }
    },
    {
      "id": "generic_1767341500767",
      "type": "SENSOR_READ",
      "params": {
        "label": "Сензор ЕС",
        "readingType": "linear",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "variable": "var_1",
        "deviceId": "695d89017dff83164c8abc06"
      },
      "position": {
        "x": 496.2847624006732,
        "y": 1119.1455766448853
      }
    },
    {
      "id": "FLOW_CONTROL_1767341543232",
      "type": "FLOW_CONTROL",
      "params": {
        "label": "Flow Control (Jump/Label)",
        "controlType": "LOOP_BACK",
        "hasError": false,
        "targetLabel": "LOOP_1767341469418"
      },
      "position": {
        "x": 638.9150239483592,
        "y": 1266.4359339860084
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-SENSOR_READ_1767339700480",
      "source": "start",
      "target": "SENSOR_READ_1767339700480",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__SENSOR_READ_1767339700480-IF_1767339718548",
      "source": "SENSOR_READ_1767339700480",
      "target": "IF_1767339718548",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1767339718548true-end",
      "source": "IF_1767339718548",
      "target": "end",
      "sourceHandle": "true",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1767341102298-generic_1767341398055",
      "source": "ACTUATOR_SET_1767341102298",
      "target": "generic_1767341398055",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__generic_1767341398055-ACTUATOR_SET_1767341425163",
      "source": "generic_1767341398055",
      "target": "ACTUATOR_SET_1767341425163",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1767339718548false-LOOP_1767341469418",
      "source": "IF_1767339718548",
      "target": "LOOP_1767341469418",
      "sourceHandle": "false",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1767341425163-generic_1767341500767",
      "source": "ACTUATOR_SET_1767341425163",
      "target": "generic_1767341500767",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__generic_1767341500767-FLOW_CONTROL_1767341543232",
      "source": "generic_1767341500767",
      "target": "FLOW_CONTROL_1767341543232",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__LOOP_1767341469418exit-end",
      "source": "LOOP_1767341469418",
      "target": "end",
      "sourceHandle": "exit",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__LOOP_1767341469418body-ACTUATOR_SET_1767341102298",
      "source": "LOOP_1767341469418",
      "target": "ACTUATOR_SET_1767341102298",
      "sourceHandle": "body",
      "type": "smoothstep"
    }
  ],
  "inputs": [],
  "variables": [
    {
      "id": "var_1",
      "name": "Текущо ЕС",
      "type": "number",
      "scope": "local",
      "unit": "mS/cm",
      "hasTolerance": false,
      "description": "",
      "_id": {
        "$oid": "695777c6963d1a2f7f7b8a98"
      }
    },
    {
      "id": "global_2",
      "name": "ЕС Желано",
      "type": "number",
      "scope": "global",
      "unit": "mS/cm",
      "hasTolerance": true,
      "description": "Какво ЕС искам да бъде разтвора",
      "_id": {
        "$oid": "695777c6963d1a2f7f7b8a99"
      }
    },
    {
      "id": "global_3",
      "name": "Доза",
      "type": "number",
      "scope": "global",
      "unit": "doses",
      "hasTolerance": false,
      "description": "Колко дози да се доабвят от ратвор",
      "_id": {
        "$oid": "69577e69963d1a2f7f7b9333"
      }
    },
    {
      "id": "global_4",
      "name": "Разбъркване Време",
      "type": "number",
      "scope": "global",
      "unit": "s",
      "hasTolerance": false,
      "description": "",
      "_id": {
        "$oid": "69617c02b4cd6597a337bb41"
      }
    }
  ],
  "isActive": true,
  "validationStatus": "VALID",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-02T07:46:14.037Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T22:17:14.367Z"
  },
  "__v": 0
}


