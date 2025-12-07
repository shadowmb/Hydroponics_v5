[2025-12-07 20:43:17.648 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "6935cac5bf17e3c5fb1495ac"
    programId: "ec_ab"
    variables: {}
[2025-12-07 20:43:17.654 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "loaded",
      "currentBlock": "start",
      "context": {
        "programId": "ec_ab",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 0,
        "startTime": 0,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "6935cac5bf17e3c5fb1495ac",
      "error": null
    }
[2025-12-07 20:43:17.666 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_start"
    payload: {
      "blockId": "start",
      "type": "START",
      "sessionId": "6935cac5bf17e3c5fb1495ac"
    }
[2025-12-07 20:43:17.666 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_end"
    payload: {
      "blockId": "start",
      "success": true,
      "output": {
        "message": "Program Started"
      },
      "sessionId": "6935cac5bf17e3c5fb1495ac"
    }
[2025-12-07 20:43:17.674 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "running",
      "currentBlock": "start",
      "context": {
        "programId": "ec_ab",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 0,
        "startTime": 1765132997658,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "6935cac5bf17e3c5fb1495ac",
      "error": null
    }
[2025-12-07 20:43:17.677 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_start"
    payload: {
      "blockId": "SENSOR_READ_1764833627709",
      "type": "SENSOR_READ",
      "sessionId": "6935cac5bf17e3c5fb1495ac"
    }
[2025-12-07 20:43:17.681 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "running",
      "currentBlock": "SENSOR_READ_1764833627709",
      "context": {
        "programId": "ec_ab",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 1,
        "startTime": 1765132997658,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "6935cac5bf17e3c5fb1495ac",
      "error": null
    }
[2025-12-07 20:43:17.690 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "command:sent"
    payload: {
      "deviceId": "6931355c23b1320394ed43f7",
      "controllerId": "693134db23b1320394ed43b5",
      "packet": {
        "id": "dcbb1f94-d1d3-4a7c-8a74-b647d14302be",
        "cmd": "UART_READ_DISTANCE",
        "pins": [
          {
            "role": "RX",
            "portId": "D10",
            "gpio": 10,
            "_id": "6931355c23b1320394ed43f8",
            "id": "6931355c23b1320394ed43f8"
          },
          {
            "role": "TX",
            "portId": "D11",
            "gpio": 11,
            "_id": "6931355c23b1320394ed43f9",
            "id": "6931355c23b1320394ed43f9"
          }
        ]
      }
    }
[2025-12-07 20:43:17.701 +0200] INFO: ЁЯФМ [HardwareService] Creating Serial Transport
    env: "development"
    controllerId: "693134db23b1320394ed43b5"
    port: "COM3"
[2025-12-07 20:43:17.702 +0200] INFO: ЁЯФМ [SerialTransport] Connecting...
    env: "development"
    path: "COM3"
    baudRate: 9600
[2025-12-07 20:43:17.771 +0200] INFO: тЬЕ [SerialTransport] Port Opened
    env: "development"
    path: "COM3"
[2025-12-07 20:43:19.785 +0200] INFO: ЁЯФН [SerialTransport] Processing Packet
    env: "development"
    packet: {
      "id": "dcbb1f94-d1d3-4a7c-8a74-b647d14302be",
      "cmd": "UART_READ_DISTANCE",
      "pins": [
        {
          "role": "RX",
          "portId": "D10",
          "gpio": 10,
          "_id": "6931355c23b1320394ed43f8",
          "id": "6931355c23b1320394ed43f8"
        },
        {
          "role": "TX",
          "portId": "D11",
          "gpio": 11,
          "_id": "6931355c23b1320394ed43f9",
          "id": "6931355c23b1320394ed43f9"
        }
      ]
    }
[2025-12-07 20:43:19.785 +0200] INFO: ЁЯУд [SerialTransport] Sending Raw String (DEBUG)
    env: "development"
    packet: {
      "id": "dcbb1f94-d1d3-4a7c-8a74-b647d14302be",
      "cmd": "UART_READ_DISTANCE",
      "pins": [
        {
          "role": "RX",
          "portId": "D10",
          "gpio": 10,
          "_id": "6931355c23b1320394ed43f8",
          "id": "6931355c23b1320394ed43f8"
        },
        {
          "role": "TX",
          "portId": "D11",
          "gpio": 11,
          "_id": "6931355c23b1320394ed43f9",
          "id": "6931355c23b1320394ed43f9"
        }
      ]
    }
    serialized: "UART_READ_DISTANCE|D10_10|D11_11"
[2025-12-07 20:43:20.966 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1764833627709"
    attempt: 1
    err: "ERR_SENSOR_TIMEOUT"
[2025-12-07 20:43:21.979 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "command:sent"
    payload: {
      "deviceId": "6931355c23b1320394ed43f7",
      "controllerId": "693134db23b1320394ed43b5",
      "packet": {
        "id": "e0d5dec3-9942-4604-848c-1395c0467e6b",
        "cmd": "UART_READ_DISTANCE",
        "pins": [
          {
            "role": "RX",
            "portId": "D10",
            "gpio": 10,
            "_id": "6931355c23b1320394ed43f8",
            "id": "6931355c23b1320394ed43f8"
          },
          {
            "role": "TX",
            "portId": "D11",
            "gpio": 11,
            "_id": "6931355c23b1320394ed43f9",
            "id": "6931355c23b1320394ed43f9"
          }
        ]
      }
    }
[2025-12-07 20:43:21.980 +0200] INFO: ЁЯФН [SerialTransport] Processing Packet
    env: "development"
    packet: {
      "id": "e0d5dec3-9942-4604-848c-1395c0467e6b",
      "cmd": "UART_READ_DISTANCE",
      "pins": [
        {
          "role": "RX",
          "portId": "D10",
          "gpio": 10,
          "_id": "6931355c23b1320394ed43f8",
          "id": "6931355c23b1320394ed43f8"
        },
        {
          "role": "TX",
          "portId": "D11",
          "gpio": 11,
          "_id": "6931355c23b1320394ed43f9",
          "id": "6931355c23b1320394ed43f9"
        }
      ]
    }
[2025-12-07 20:43:21.980 +0200] INFO: ЁЯУд [SerialTransport] Sending Raw String (DEBUG)
    env: "development"
    packet: {
      "id": "e0d5dec3-9942-4604-848c-1395c0467e6b",
      "cmd": "UART_READ_DISTANCE",
      "pins": [
        {
          "role": "RX",
          "portId": "D10",
          "gpio": 10,
          "_id": "6931355c23b1320394ed43f8",
          "id": "6931355c23b1320394ed43f8"
        },
        {
          "role": "TX",
          "portId": "D11",
          "gpio": 11,
          "_id": "6931355c23b1320394ed43f9",
          "id": "6931355c23b1320394ed43f9"
        }
      ]
    }
    serialized: "UART_READ_DISTANCE|D10_10|D11_11"
[2025-12-07 20:43:23.060 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1764833627709"
    attempt: 2
    err: "ERR_SENSOR_TIMEOUT"
[2025-12-07 20:43:24.075 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "command:sent"
    payload: {
      "deviceId": "6931355c23b1320394ed43f7",
      "controllerId": "693134db23b1320394ed43b5",
      "packet": {
        "id": "1c785b2a-03f3-4a04-9366-6352e21d0d34",
        "cmd": "UART_READ_DISTANCE",
        "pins": [
          {
            "role": "RX",
            "portId": "D10",
            "gpio": 10,
            "_id": "6931355c23b1320394ed43f8",
            "id": "6931355c23b1320394ed43f8"
          },
          {
            "role": "TX",
            "portId": "D11",
            "gpio": 11,
            "_id": "6931355c23b1320394ed43f9",
            "id": "6931355c23b1320394ed43f9"
          }
        ]
      }
    }
[2025-12-07 20:43:24.076 +0200] INFO: ЁЯФН [SerialTransport] Processing Packet
    env: "development"
    packet: {
      "id": "1c785b2a-03f3-4a04-9366-6352e21d0d34",
      "cmd": "UART_READ_DISTANCE",
      "pins": [
        {
          "role": "RX",
          "portId": "D10",
          "gpio": 10,
          "_id": "6931355c23b1320394ed43f8",
          "id": "6931355c23b1320394ed43f8"
        },
        {
          "role": "TX",
          "portId": "D11",
          "gpio": 11,
          "_id": "6931355c23b1320394ed43f9",
          "id": "6931355c23b1320394ed43f9"
        }
      ]
    }
[2025-12-07 20:43:24.076 +0200] INFO: ЁЯУд [SerialTransport] Sending Raw String (DEBUG)
    env: "development"
    packet: {
      "id": "1c785b2a-03f3-4a04-9366-6352e21d0d34",
      "cmd": "UART_READ_DISTANCE",
      "pins": [
        {
          "role": "RX",
          "portId": "D10",
          "gpio": 10,
          "_id": "6931355c23b1320394ed43f8",
          "id": "6931355c23b1320394ed43f8"
        },
        {
          "role": "TX",
          "portId": "D11",
          "gpio": 11,
          "_id": "6931355c23b1320394ed43f9",
          "id": "6931355c23b1320394ed43f9"
        }
      ]
    }
    serialized: "UART_READ_DISTANCE|D10_10|D11_11"
[2025-12-07 20:43:25.156 +0200] WARN: Block execution failed
    env: "development"
    blockId: "SENSOR_READ_1764833627709"
    attempt: 3
    err: "ERR_SENSOR_TIMEOUT"
[2025-12-07 20:43:25.156 +0200] ERROR: All retries exhausted.
    env: "development"
    blockId: "SENSOR_READ_1764833627709"
    policy: "GOTO_LABEL"
[2025-12-07 20:43:25.160 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "completed",
      "currentBlock": null,
      "context": {
        "programId": "ec_ab",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 2,
        "startTime": 1765132997658,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "6935cac5bf17e3c5fb1495ac",
      "error": null
    }