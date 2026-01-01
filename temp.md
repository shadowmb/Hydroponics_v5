Backend

Frontend log:[18:25] INFO: ≡ƒòÆ Scheduler Tick
    env: "development"
🔍 [createDevice] CALLED with body: {
  "name": "Soil",
  "type": "SENSOR",
  "isEnabled": true,
  "config": {
    "driverId": "dfrobot_soil_mois",
    "pollInterval": 5000,
    "invertedLogic": false
  },
  "metadata": {
    "description": ""
  },
  "tags": [],
  "hardware": {
    "parentId": "695102f15bb60cca7130e23f",
    "pins": {
      "Signal": "A0"
    }
  }
}
🔍 [createDevice] Template lookup: FOUND for driverId: dfrobot_soil_mois
🔍 UART Validation Debug: {
  hasController: true,
  controllerType: 'Arduino_Uno_R4_WiFi',
  hardwarePins: [ { role: 'Signal', portId: 'A0', gpio: 14 } ],
  templateRequirements: { pin_count: {} },
  templateId: 'dfrobot_soil_mois'
}
🔍 UART Constraints Debug: {
  controllerTemplateFound: true,
  controllerTemplateKey: 'Arduino_Uno_R4_WiFi',
  uartConstraints: {
    maxSoftwareSerial: 1,
    hardwareSerialPins: [ 'D0', 'D1' ],
    twoDevicesRequireHardwareSerial: true,
    twoDevicesRequireWifi: true
  }
}

Console log:

🚀 [DeviceWizard] Submitting Payload: {
  "name": "Soil",
  "type": "SENSOR",
  "isEnabled": true,
  "config": {
    "driverId": "dfrobot_soil_mois",
    "pollInterval": 5000,
    "invertedLogic": false
  },
  "metadata": {
    "description": ""
  },
  "tags": [],
  "hardware": {
    "parentId": "695102f15bb60cca7130e23f",
    "pins": {
      "Signal": "A0"
    }
  }
}
hardwareService.ts:143 
 POST http://localhost:3000/api/hardware/devices 500 (Internal Server Error)