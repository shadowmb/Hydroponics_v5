{
  "_id": {
    "$oid": "695b952d9785c9ac47968415"
  },
  "id": "test_flow",
  "name": "Test Flow",
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
        "x": 400,
        "y": 100
      }
    },
    {
      "id": "ACTUATOR_SET_1767609625354",
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
        "notificationChannelId": "",
        "notificationMode": "AUTO",
        "revertOnStop": true,
        "label": "Set Actuator",
        "hasError": false,
        "deviceId": "695b95089785c9ac4796833a",
        "action": "PULSE_ON",
        "duration": 5
      },
      "position": {
        "x": 250.5,
        "y": 215.25
      }
    }
  ],
  "edges": [
    {
      "id": "xy-edge__start-ACTUATOR_SET_1767609625354",
      "source": "start",
      "target": "ACTUATOR_SET_1767609625354"
    },
    {
      "id": "xy-edge__ACTUATOR_SET_1767609625354-end",
      "source": "ACTUATOR_SET_1767609625354",
      "target": "end"
    }
  ],
  "inputs": [],
  "variables": [],
  "isActive": true,
  "validationStatus": "VALID",
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-05T10:40:45.451Z"
  },
  "updatedAt": {
    "$date": "2026-01-05T10:40:45.451Z"
  },
  "__v": 0
}