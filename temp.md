{
    "id": "693aa44c9ef0525c5181c7ed",
    "driverId": {
        "requirements": {
            "pin_count": {
                "digital": 2
            },
            "interface": "digital",
            "voltage": "5V"
        },
        "uiConfig": {
            "category": "Water",
            "icon": "ruler",
            "tags": [
                "Distance",
                "Water"
            ],
            "recommendedPins": [],
            "capabilities": {
                "ULTRASONIC_TRIG_ECHO": {
                    "label": "Distance",
                    "icon": "ruler",
                    "tooltip": "Measures distance using ultrasonic waves. Range: 2cm - 400cm.",
                    "_id": "693adf40e054cb862f8a87c3"
                }
            }
        },
        "hardwareLimits": {
            "min": 20,
            "max": 4000,
            "unit": "mm"
        },
        "_id": "hc_sr04",
        "__v": 0,
        "capabilities": [
            "ULTRASONIC_TRIG_ECHO"
        ],
        "category": "SENSOR",
        "commands": {
            "READ": {
                "hardwareCmd": "ULTRASONIC_TRIG_ECHO",
                "valuePath": "distance",
                "sourceUnit": "cm",
                "outputs": [
                    {
                        "key": "distance",
                        "label": "Distance",
                        "unit": "mm"
                    }
                ]
            }
        },
        "createdAt": "2025-12-01T22:17:25.705Z",
        "initialState": {
            "value": 0
        },
        "name": "HC-SR04 Ultrasonic Sensor",
        "pins": [
            {
                "name": "TRIG",
                "type": "DIGITAL_OUT"
            },
            {
                "name": "ECHO",
                "type": "DIGITAL_IN"
            }
        ],
        "portRequirements": [],
        "supportedStrategies": [
            "offset_only",
            "linear",
            "tank_volume"
        ],
        "updatedAt": "2025-12-11T15:12:00.797Z",
        "variants": [],
        "description": "Ultrasonic distance sensor for measuring liquid levels or proximity."
    },
    "commands": {
        "READ": {
            "hardwareCmd": "ULTRASONIC_TRIG_ECHO",
            "valuePath": "distance",
            "sourceUnit": "cm",
            "outputs": [
                {
                    "key": "distance",
                    "label": "Distance",
                    "unit": "mm"
                }
            ]
        }
    },
    "outputs": [
        {
            "key": "distance",
            "label": "Distance",
            "unit": "mm"
        }
    ],
    "multiValues": null
}