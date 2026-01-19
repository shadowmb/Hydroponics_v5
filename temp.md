{
  "_id": {
    "$oid": "696e318ee11b927143d6c6b2"
  },
  "sourceProgramId": "prog_test_pause_resume",
  "name": "Test pause resume",
  "status": "running",
  "minCycleInterval": 60,
  "type": "BASIC",
  "schedule": [
    {
      "time": "08:00",
      "name": "Event 1",
      "description": "",
      "cycleId": "696e3133e11b927143d6c53e",
      "cycleName": "Event 1",
      "cycleDescription": "",
      "steps": [
        {
          "flowId": "test",
          "overrides": {
            "ГР желано": 100,
            "ГР желано_tolerance": 10
          },
          "_id": {
            "$oid": "696e3133e11b927143d6c53f"
          }
        }
      ],
      "status": "running",
      "_id": {
        "$oid": "696e318ee11b927143d6c6b3"
      }
    }
  ],
  "dayCompleteEmitted": false,
  "windowsState": [],
  "createdAt": {
    "$date": "2026-01-19T13:28:46.491Z"
  },
  "updatedAt": {
    "$date": "2026-01-19T14:11:46.610Z"
  },
  "__v": 1,
  "endTime": {
    "$date": "2026-01-19T14:11:28.816Z"
  },
  "startTime": {
    "$date": "2026-01-19T13:29:18.768Z"
  }
}