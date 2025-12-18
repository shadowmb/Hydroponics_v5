Това е без автоматична компенсация на темопетемпературатаратрута:

🧪 [PhSmart] Raw:469 | Points:2 | NeutralMV:2238.5 | Polarity:INV | V_Meas:2292.3mV | Temp:25°C | pH :7.47
[SensorRead] ✔️ Saved to 'var_1': 7.47 pH
[2025-12-18 15:49:48.707 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-18 15:49:48.715 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {}
    variablesResolved: {}
[2025-12-18 15:49:48.719 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "6944067c3c68f248048cace6"
    programId: "testtt"
    variables: {}
[2025-12-18 15:49:48.734 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765912881484"
[2025-12-18 15:49:48.812 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765912881484"
    edgeFound: true
    nextBlockId: "end"


Това е с избранакомпенсация от сензора в системата:
🧪 [PhSmart] Raw:303 | Points:0 | NeutralMV:1500.0 | Polarity:STD | V_Meas:1480.9mV | Temp:25°C | pH :7.32
[SensorRead] ✔️ Saved to 'var_1': 7.32 pH
[2025-12-18 15:51:09.834 +0200] INFO: тЬи AutomationEngine Actor Initialized/Reset (Session: none)
    env: "development"
[2025-12-18 15:51:09.836 +0200] INFO: ЁЯзй AutomationEngine: Input Resolution
    env: "development"
    overrides: {}
    variablesResolved: {}
[2025-12-18 15:51:09.838 +0200] INFO: ЁЯУе Loading Program Session
    env: "development"
    sessionId: "694406cd3c68f248048cad99"
    programId: "testtt"
    variables: {}
[2025-12-18 15:51:09.859 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "start"
    edgeFound: true
    nextBlockId: "SENSOR_READ_1765912881484"
[2025-12-18 15:51:09.934 +0200] INFO: Graph Navigation Trace
    env: "development"
    blockId: "SENSOR_READ_1765912881484"
    edgeFound: true
    nextBlockId: "end"