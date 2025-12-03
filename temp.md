[2025-12-02 18:49:48.560 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "692f18ac4a2bfb188424bfa1"
    programId: "test2"
[2025-12-02 18:49:48.566 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "loaded",
      "currentBlock": "start",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 0,
        "startTime": 0,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:51.977 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_start"
    payload: {
      "blockId": "start",
      "type": "START",
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:51.978 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_end"
    payload: {
      "blockId": "start",
      "success": true,
      "output": {
        "message": "Program Started"
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:51.980 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "running",
      "currentBlock": "start",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 0,
        "startTime": 1764694191973,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:51.981 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "log"
    payload: {
      "timestamp": "2025-12-02T16:49:51.978Z",
      "level": "info",
      "message": "Block START executed",
      "blockId": "start",
      "data": {
        "message": "Program Started"
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:51.987 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_start"
    payload: {
      "blockId": "WAIT_1764667311622",
      "type": "WAIT",
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:51.988 +0200] INFO: тП│ WAIT Block executing for 20000ms
    env: "development"
    duration: 20000
    params: {
      "duration": 20000,
      "_blockId": "WAIT_1764667311622"
    }
[2025-12-02 18:49:51.988 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "running",
      "currentBlock": "WAIT_1764667311622",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 1,
        "startTime": 1764694191973,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:49:56.036 +0200] INFO: тП╕я╕П Block Paused (State Saved)
    env: "development"
    blockId: "WAIT_1764667311622"
    state: {
      "remaining": 15953
    }
[2025-12-02 18:49:56.039 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "paused",
      "currentBlock": "WAIT_1764667311622",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 1,
        "startTime": 1764694191973,
        "errors": [],
        "resumeState": {}
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:50:03.247 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:block_start"
    payload: {
      "blockId": "WAIT_1764667311622",
      "type": "WAIT",
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:50:03.248 +0200] INFO: тПпя╕П Resuming WAIT Block
    env: "development"
    remaining: 15953
    original: 20000
[2025-12-02 18:50:03.248 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "running",
      "currentBlock": "WAIT_1764667311622",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 1,
        "startTime": 1764694191973,
        "errors": [],
        "resumeState": {
          "WAIT_1764667311622": {
            "remaining": 15953
          }
        }
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:50:09.290 +0200] INFO: тП╕я╕П Block Paused (State Saved)
    env: "development"
    blockId: "WAIT_1764667311622"
    state: {
      "remaining": 9912
    }
[2025-12-02 18:50:09.292 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "stopped",
      "currentBlock": "WAIT_1764667311622",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 1,
        "startTime": 1764694191973,
        "errors": [],
        "resumeState": {
          "WAIT_1764667311622": {
            "remaining": 15953
          }
        }
      },
      "sessionId": "692f18ac4a2bfb188424bfa1"
    }
[2025-12-02 18:50:13.369 +0200] INFO: ЁЯУб Forwarding to WebSocket
    env: "development"
    event: "automation:state_change"
    payload: {
      "state": "idle",
      "currentBlock": "WAIT_1764667311622",
      "context": {
        "programId": "test2",
        "actionTemplateId": "default",
        "variables": {},
        "devices": {},
        "stepCount": 1,
        "startTime": 1764694191973,
        "errors": [],
        "resumeState": {
          "WAIT_1764667311622": {
            "remaining": 15953
          }
        }
      },
      "sessionId": null
    }
