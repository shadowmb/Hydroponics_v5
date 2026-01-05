При добавяне:
🚀 [DeviceWizard] Submitting Payload: {
  "name": "рере",
  "type": "ACTUATOR",
  "isEnabled": true,
  "config": {
    "driverId": "pump_generic",
    "pollInterval": 5000,
    "variantId": "relay",
    "invertedLogic": false
  },
  "metadata": {
    "description": "Описание"
  },
  "tags": [],
  "hardware": {
    "parentId": "695b65e78b53afd2c818686c",
    "pins": {
      "Relay": "D2"
    }
  }
}


При редакция:
🚀 [DeviceWizard] Submitting Payload: {
  "name": "рере",
  "type": "ACTUATOR",
  "isEnabled": true,
  "config": {
    "driverId": "pump_generic",
    "pollInterval": 5000,
    "variantId": "relay",
    "compensation": {
      "temperature": {
        "enabled": false,
        "source": "default"
      }
    },
    "voltage": {},
    "invertedLogic": false
  },
  "metadata": {
    "description": "Описание"
  },
  "tags": [
    "Pump",
    "Water"
  ],
  "hardware": {
    "parentId": "695b65e78b53afd2c818686c",
    "pins": {
      "Relay": "D2"
    }
  }
}