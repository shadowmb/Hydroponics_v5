{
  "_id": {
    "$oid": "6961693a5c1285455e74a6f4"
  },
  "date": "2026-01-09",
  "timestamp": {
    "$date": "2026-01-09T20:46:50.036Z"
  },
  "context": {
    "programId": "prog_bigtest",
    "programName": "prog_bigtest",
    "windowId": "tw_1767861565496_ku2rqdpw9",
    "windowName": "Прозорец 1",
    "executionType": "WINDOW"
  },
  "measurements": [
    {
      "source": "Сензор ниво ГР домати",
      "role": "volume",
      "flowId": "rezervoar",
      "flowName": "Резервоар",
      "value": 100,
      "unit": "L",
      "type": "DELTA",
      "startValue": 0,
      "endValue": 100,
      "average": 44.44444444444444,
      "min": 0,
      "max": 100,
      "count": 9
    },
    {
      "source": "Помпа  поливане домати",
      "role": "water",
      "flowId": "rezervoar",
      "flowName": "Резервоар",
      "value": 100,
      "unit": "L",
      "type": "DELTA",
      "startValue": 0,
      "endValue": 100
    },
    {
      "source": "Сензор за ЕС Домати",
      "role": "ec",
      "flowId": "ec_sim",
      "flowName": "EC SIM",
      "value": 1.5,
      "unit": "mS/cm",
      "type": "TREND",
      "startValue": 1,
      "endValue": 2.5,
      "average": 2.0780000000000003,
      "min": 1,
      "max": 2.5,
      "count": 5
    },
    {
      "source": "Помпа Разтвор А домати",
      "role": "nutrient_a",
      "flowId": "ec_sim",
      "flowName": "EC SIM",
      "value": 150,
      "unit": "ml",
      "type": "SUM",
      "average": 50,
      "min": 50,
      "max": 50,
      "count": 3
    },
    {
      "source": "Помпа Разтвор Б домати",
      "role": "nutrient_b",
      "flowId": "ec_sim",
      "flowName": "EC SIM",
      "value": 150,
      "unit": "ml",
      "type": "SUM",
      "average": 50,
      "min": 50,
      "max": 50,
      "count": 3
    },
    {
      "source": "Помпа разбъркване домати",
      "role": "mixer",
      "flowId": "ec_sim",
      "flowName": "EC SIM",
      "value": 10,
      "unit": "s",
      "type": "NONE",
      "average": 10,
      "min": 10,
      "max": 10,
      "count": 5
    },
    {
      "source": "Сензор за рН домати",
      "role": "ph",
      "flowId": "ph_sim",
      "flowName": "pH Sim",
      "value": 3.3,
      "unit": "pH",
      "type": "TREND",
      "startValue": 3,
      "endValue": 6.3,
      "average": 4.9,
      "min": 3,
      "max": 6.3,
      "count": 4
    },
    {
      "source": "pH+ помпа домати",
      "role": "ph_up",
      "flowId": "ph_sim",
      "flowName": "pH Sim",
      "value": 4,
      "unit": "ml",
      "type": "SUM",
      "average": 2,
      "min": 2,
      "max": 2,
      "count": 2
    },
    {
      "source": "Влажност почва домати",
      "role": "soil_moisture",
      "flowId": "polivane",
      "flowName": "Поливане SIM",
      "value": 30,
      "unit": "%",
      "type": "NONE",
      "average": 30,
      "min": 30,
      "max": 30,
      "count": 1
    },
    {
      "source": "Read Sensor",
      "role": "temp",
      "flowId": "polivane",
      "flowName": "Поливане SIM",
      "value": 0,
      "unit": "C",
      "type": "TREND",
      "startValue": 24,
      "endValue": 24,
      "average": 24,
      "min": 24,
      "max": 24,
      "count": 1
    }
  ],
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-09T20:46:50.041Z"
  },
  "updatedAt": {
    "$date": "2026-01-09T20:46:50.041Z"
  },
  "__v": 0
}