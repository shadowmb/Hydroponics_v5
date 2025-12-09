{
  "_id": {
    "$oid": "6937e2eca171a54cf8810a2a"
  },
  "id": "test_gr",
  "name": "Test GR",
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
        "x": 117.5,
        "y": -41
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
        "x": 68.53596214862361,
        "y": 650.6427803396564
      }
    },
    {
      "id": "SENSOR_READ_1765268250648",
      "type": "SENSOR_READ",
      "params": {
        "label": "Сензор за ГР",
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "hasError": false,
        "deviceId": "6932a99dcb81d56e0343a46d",
        "variable": "var_1"
      },
      "position": {
        "x": 165,
        "y": 71.25
      }
    },
    {
      "id": "IF_1765268300863",
      "type": "IF",
      "params": {
        "label": "Condition (IF)",
        "operator": ">=",
        "onFailure": "STOP",
        "errorNotification": false,
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_2}}"
      },
      "position": {
        "x": 303,
        "y": 233.75
      }
    },
    {
      "id": "ACTUATOR_SET_1765270055740",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Set Actuator",
        "strategy": "actuator_manual",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "hasError": false,
        "deviceId": "6932ad83cb81d56e0343a63c",
        "action": "ON"
      },
      "position": {
        "x": 527,
        "y": 318.25
      }
    },
    {
      "id": "generic_1765270081073",
      "type": "SENSOR_READ",
      "params": {
        "label": "Read Sensor",
        "readingType": "tank_volume",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "hasError": false,
        "deviceId": "6932a99dcb81d56e0343a46d",
        "variable": "var_1",
        "mirrorOf": "SENSOR_READ_1765268250648"
      },
      "position": {
        "x": 686,
        "y": 603.25
      }
    },
    {
      "id": "FLOW_CONTROL_1765270111054",
      "type": "FLOW_CONTROL",
      "params": {
        "label": "Flow Control (Jump/Label)",
        "controlType": "LOOP_BACK",
        "hasError": false,
        "targetLabel": "LOOP_1765270134972"
      },
      "position": {
        "x": 652,
        "y": 750.25
      }
    },
    {
      "id": "LOOP_1765270134972",
      "type": "LOOP",
      "params": {
        "label": "Проверка на ГР цикъл",
        "limitMode": "TIME",
        "interval": 1,
        "count": 1,
        "timeout": 60,
        "operator": ">",
        "errorNotification": false,
        "loopType": "WHILE",
        "maxIterations": 20,
        "onMaxIterations": "GOTO_LABEL",
        "hasError": false,
        "variable": "global_2",
        "value": "{{var_1}}",
        "errorTargetLabel": "END"
      },
      "position": {
        "x": 462.5,
        "y": 441.75
      }
    },
    {
      "id": "generic_1765280669388",
      "type": "ACTUATOR_SET",
      "params": {
        "label": "Set Actuator",
        "strategy": "actuator_manual",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "hasError": false,
        "deviceId": "6932ad83cb81d56e0343a63c",
        "action": "OFF"
      },
      "position": {
        "x": 443.5,
        "y": 619.75
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-SENSOR_READ_1765268250648",
      "source": "start",
      "target": "SENSOR_READ_1765268250648",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__SENSOR_READ_1765268250648-IF_1765268300863",
      "source": "SENSOR_READ_1765268250648",
      "target": "IF_1765268300863",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__generic_1765270081073-FLOW_CONTROL_1765270111054",
      "source": "generic_1765270081073",
      "target": "FLOW_CONTROL_1765270111054",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1765268300863true-end",
      "source": "IF_1765268300863",
      "target": "end",
      "sourceHandle": "true",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1765268300863false-ACTUATOR_SET_1765270055740",
      "source": "IF_1765268300863",
      "target": "ACTUATOR_SET_1765270055740",
      "sourceHandle": "false",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1765270055740-LOOP_1765270134972",
      "source": "ACTUATOR_SET_1765270055740",
      "target": "LOOP_1765270134972",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__LOOP_1765270134972body-generic_1765270081073",
      "source": "LOOP_1765270134972",
      "target": "generic_1765270081073",
      "sourceHandle": "body",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__LOOP_1765270134972exit-generic_1765280669388",
      "source": "LOOP_1765270134972",
      "target": "generic_1765280669388",
      "sourceHandle": "exit",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__generic_1765280669388-end",
      "source": "generic_1765280669388",
      "target": "end",
      "type": "smoothstep"
    }
  ],
  "inputs": [],
  "variables": [
    {
      "id": "var_1",
      "name": "Количество ГР",
      "type": "number",
      "scope": "local",
      "unit": "l",
      "hasTolerance": false,
      "description": "",
      "_id": {
        "$oid": "6937e2eca171a54cf8810a2b"
      }
    },
    {
      "id": "global_2",
      "name": "Количество ГР",
      "type": "number",
      "scope": "global",
      "unit": "l",
      "hasTolerance": true,
      "description": "Желаното количество в ГР",
      "_id": {
        "$oid": "6937e2eca171a54cf8810a2c"
      }
    }
  ],
  "isActive": true,
  "deletedAt": null,
  "createdAt": {
    "$date": "2025-12-09T08:50:52.598Z"
  },
  "updatedAt": {
    "$date": "2025-12-09T11:58:03.660Z"
  },
  "__v": 0,
  "validationStatus": "VALID"
}