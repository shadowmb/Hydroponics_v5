{
  "_id": {
    "$oid": "695b78d955ef70d7aa42c810"
  },
  "id": "rn_kontrol",
  "name": "рН Контрол",
  "description": "Проверка и коригиране на рН",
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
        "x": 116.5,
        "y": -35
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
        "x": -163.75226334280575,
        "y": 882.2606545884843
      }
    },
    {
      "id": "SENSOR_READ_1767602172874",
      "type": "SENSOR_READ",
      "params": {
        "label": "Сензор рН",
        "readingType": "ph_smart",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7adf55ef70d7aa42c8a7",
        "notificationMode": "ALWAYS",
        "hasError": false,
        "deviceId": "695b6a468b53afd2c818732e",
        "comment": "Сензор за измерване нивото на рН",
        "variable": "var_1"
      },
      "position": {
        "x": 92,
        "y": 87.75
      }
    },
    {
      "id": "IF_1767603196469",
      "type": "IF",
      "params": {
        "label": "Условие",
        "operator": "==",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_4}}",
        "comment": "Проверка дали рН от сензора е равно на желаното рН"
      },
      "position": {
        "x": 92.90330343502822,
        "y": 225.3442993990624
      }
    },
    {
      "id": "IF_1767603252978",
      "type": "IF",
      "params": {
        "label": "Условие",
        "operator": "<",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "hasError": false,
        "comment": "Проверява дали текущото рН е по високо или ниско от желаното рН",
        "variable": "var_1",
        "value": "{{global_4}}"
      },
      "position": {
        "x": 316.4714969953119,
        "y": 419.3560199123933
      }
    },
    {
      "id": "ACTUATOR_SET_1767603376554",
      "type": "ACTUATOR_SET",
      "params": {
        "strategy": "volumetric_flow",
        "durationUnit": "sec",
        "amountMode": "DOSES",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7ae855ef70d7aa42c8ae",
        "notificationMode": "ALWAYS",
        "revertOnStop": true,
        "label": "Помпа рН+",
        "hasError": false,
        "deviceId": "695b6d178b53afd2c8187813",
        "action": "DOSE",
        "amount": "{{global_2}}",
        "comment": "Активра се помпата за рН+ на база дози"
      },
      "position": {
        "x": 215.40088093442466,
        "y": 829.295713256184
      }
    },
    {
      "id": "generic_1767603662823",
      "type": "ACTUATOR_SET",
      "params": {
        "strategy": "volumetric_flow",
        "durationUnit": "sec",
        "amountMode": "DOSES",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7ae855ef70d7aa42c8ae",
        "notificationMode": "ALWAYS",
        "revertOnStop": true,
        "label": "Помпа рН-",
        "hasError": false,
        "deviceId": "695b6d258b53afd2c818783f",
        "action": "DOSE",
        "amount": "{{global_3}}",
        "comment": "Активра се помпата за рН- на база дози"
      },
      "position": {
        "x": 482.68256682214565,
        "y": 829.3538476471233
      }
    },
    {
      "id": "ACTUATOR_SET_1767603706936",
      "type": "ACTUATOR_SET",
      "params": {
        "strategy": "actuator_manual",
        "durationUnit": "sec",
        "amountMode": "VOLUME",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7ae855ef70d7aa42c8ae",
        "notificationMode": "ALWAYS",
        "revertOnStop": true,
        "label": "Set Actuator",
        "hasError": false,
        "deviceId": "695b6e618b53afd2c818798d",
        "action": "PULSE_ON",
        "duration": "{{global_5}}",
        "comment": "Помпа за разбъркване на разтвори"
      },
      "position": {
        "x": 216.89795466959998,
        "y": 991.4321742625049
      }
    },
    {
      "id": "LOOP_1767603818056",
      "type": "LOOP",
      "params": {
        "limitMode": "COUNT",
        "interval": 1,
        "intervalUnit": "sec",
        "count": 2,
        "timeout": 60,
        "timeoutUnit": "sec",
        "operator": "<",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Цикъл рН+",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_4}}"
      },
      "position": {
        "x": 65.67465128982317,
        "y": 621.6132297919869
      }
    },
    {
      "id": "generic_1767603917220",
      "type": "SENSOR_READ",
      "params": {
        "readingType": "ph_smart",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7adf55ef70d7aa42c8a7",
        "notificationMode": "ALWAYS",
        "label": "Сензор рН",
        "hasError": false,
        "deviceId": "695b6a468b53afd2c818732e",
        "comment": "Сензор за измерване нивото на рН",
        "variable": "var_1",
        "mirrorOf": "SENSOR_READ_1767602172874"
      },
      "position": {
        "x": 213.54046070262635,
        "y": 1154.2359006070235
      }
    },
    {
      "id": "FLOW_CONTROL_1767603935734",
      "type": "FLOW_CONTROL",
      "params": {
        "controlType": "LOOP_BACK",
        "label": "Flow Control (Jump/Label)",
        "hasError": false,
        "targetLabel": "LOOP_1767603818056"
      },
      "position": {
        "x": 229.12125804937662,
        "y": 1317.4064332453665
      }
    },
    {
      "id": "loop_1767603966706",
      "type": "LOOP",
      "params": {
        "limitMode": "COUNT",
        "interval": 1,
        "intervalUnit": "sec",
        "count": 2,
        "timeout": 60,
        "timeoutUnit": "sec",
        "operator": ">",
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "label": "Цикъл рН-",
        "hasError": false,
        "variable": "var_1",
        "value": "{{global_4}}"
      },
      "position": {
        "x": 343.322022531845,
        "y": 601.5970951343373
      }
    },
    {
      "id": "generic_1767604016675",
      "type": "ACTUATOR_SET",
      "params": {
        "strategy": "actuator_manual",
        "durationUnit": "sec",
        "amountMode": "VOLUME",
        "amountUnit": "ml",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7ae855ef70d7aa42c8ae",
        "notificationMode": "ALWAYS",
        "revertOnStop": true,
        "label": "Set Actuator",
        "hasError": false,
        "deviceId": "695b6e618b53afd2c818798d",
        "action": "PULSE_ON",
        "duration": "{{global_5}}",
        "comment": "Помпа за разбъркване на разтвори"
      },
      "position": {
        "x": 484.89795466960004,
        "y": 995.4321742625046
      }
    },
    {
      "id": "generic_1767604021323",
      "type": "SENSOR_READ",
      "params": {
        "readingType": "ph_smart",
        "retryCount": 3,
        "retryDelay": 1000,
        "onFailure": "STOP",
        "errorNotification": false,
        "notificationChannelId": "695b7adf55ef70d7aa42c8a7",
        "notificationMode": "ALWAYS",
        "label": "Сензор рН",
        "hasError": false,
        "deviceId": "695b6a468b53afd2c818732e",
        "comment": "Сензор за измерване нивото на рН",
        "variable": "var_1",
        "mirrorOf": "SENSOR_READ_1767602172874"
      },
      "position": {
        "x": 480.5404607026264,
        "y": 1154.2359006070235
      }
    },
    {
      "id": "flowControl_1767604026589",
      "type": "FLOW_CONTROL",
      "params": {
        "controlType": "LOOP_BACK",
        "label": "Flow Control (Jump/Label)",
        "hasError": false,
        "targetLabel": "loop_1767603966706"
      },
      "position": {
        "x": 495.12125804937665,
        "y": 1302.4064332453665
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-SENSOR_READ_1767602172874",
      "source": "start",
      "target": "SENSOR_READ_1767602172874",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__SENSOR_READ_1767602172874-IF_1767603196469",
      "source": "SENSOR_READ_1767602172874",
      "target": "IF_1767603196469",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__IF_1767603196469false-IF_1767603252978",
      "source": "IF_1767603196469",
      "target": "IF_1767603252978",
      "sourceHandle": "false",
      "type": "smoothstep"
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1767603376554-ACTUATOR_SET_1767603706936",
      "source": "ACTUATOR_SET_1767603376554",
      "target": "ACTUATOR_SET_1767603706936"
    },
    {
      "id": "xy-edge__IF_1767603252978true-LOOP_1767603818056",
      "source": "IF_1767603252978",
      "target": "LOOP_1767603818056",
      "sourceHandle": "true"
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1767603706936-generic_1767603917220",
      "source": "ACTUATOR_SET_1767603706936",
      "target": "generic_1767603917220"
    },
    {
      "id": "xy-edge__generic_1767603917220-FLOW_CONTROL_1767603935734",
      "source": "generic_1767603917220",
      "target": "FLOW_CONTROL_1767603935734"
    },
    {
      "id": "xy-edge__IF_1767603252978false-loop_1767603966706",
      "source": "IF_1767603252978",
      "target": "loop_1767603966706",
      "sourceHandle": "false"
    },
    {
      "id": "xy-edge__LOOP_1767603818056body-ACTUATOR_SET_1767603376554",
      "source": "LOOP_1767603818056",
      "target": "ACTUATOR_SET_1767603376554",
      "sourceHandle": "body"
    },
    {
      "id": "xy-edge__generic_1767603662823-generic_1767604016675",
      "source": "generic_1767603662823",
      "target": "generic_1767604016675"
    },
    {
      "id": "xy-edge__generic_1767604016675-generic_1767604021323",
      "source": "generic_1767604016675",
      "target": "generic_1767604021323"
    },
    {
      "id": "xy-edge__generic_1767604021323-flowControl_1767604026589",
      "source": "generic_1767604021323",
      "target": "flowControl_1767604026589"
    },
    {
      "id": "xy-edge__loop_1767603966706body-generic_1767603662823",
      "source": "loop_1767603966706",
      "target": "generic_1767603662823",
      "sourceHandle": "body"
    },
    {
      "id": "xy-edge__loop_1767603966706exit-end",
      "source": "loop_1767603966706",
      "target": "end",
      "sourceHandle": "exit"
    },
    {
      "id": "xy-edge__LOOP_1767603818056exit-end",
      "source": "LOOP_1767603818056",
      "target": "end",
      "sourceHandle": "exit"
    },
    {
      "id": "xy-edge__IF_1767603196469true-end",
      "source": "IF_1767603196469",
      "target": "end",
      "sourceHandle": "true"
    }
  ],
  "inputs": [],
  "variables": [
    {
      "id": "var_1",
      "name": "рН Текущо",
      "type": "number",
      "scope": "local",
      "unit": "pH",
      "hasTolerance": false,
      "description": "",
      "_id": {
        "$oid": "695b78d955ef70d7aa42c811"
      }
    },
    {
      "id": "global_2",
      "name": "Дози рН+",
      "type": "number",
      "scope": "global",
      "unit": "doses",
      "hasTolerance": false,
      "description": "Какво количество дози да се добавят",
      "_id": {
        "$oid": "695b78d955ef70d7aa42c812"
      }
    },
    {
      "id": "global_3",
      "name": "Дози рН-",
      "type": "number",
      "scope": "global",
      "unit": "doses",
      "hasTolerance": false,
      "description": "Какво количество дози да се добавят",
      "_id": {
        "$oid": "695b78d955ef70d7aa42c813"
      }
    },
    {
      "id": "global_4",
      "name": "рН",
      "type": "number",
      "scope": "global",
      "unit": "pH",
      "hasTolerance": true,
      "description": "Желано ниво на рН",
      "_id": {
        "$oid": "695b78d955ef70d7aa42c814"
      }
    },
    {
      "id": "global_5",
      "name": "Разбъркване",
      "type": "number",
      "scope": "global",
      "unit": "s",
      "hasTolerance": false,
      "description": "Помпа за разбъркване на разтвори",
      "_id": {
        "$oid": "695b7fad55ef70d7aa42cbc2"
      }
    }
  ],
  "isActive": true,
  "validationStatus": "VALID",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-05T08:39:53.140Z"
  },
  "updatedAt": {
    "$date": "2026-01-05T09:09:01.331Z"
  },
  "__v": 0
}