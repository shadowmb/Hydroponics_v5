{
  "_id": {
    "$oid": "695b818155ef70d7aa42cccc"
  },
  "id": "prog_test",
  "name": "тест",
  "description": "",
  "isActive": false,
  "minCycleInterval": 60,
  "type": "BASIC",
  "schedule": [
    {
      "time": "08:00",
      "name": "Event 1",
      "description": "",
      "steps": [
        {
          "flowId": "rn_kontrol",
          "_id": {
            "$oid": "695b818155ef70d7aa42ccce"
          }
        },
        {
          "flowId": "test_flow",
          "_id": {
            "$oid": "695baf5ebdf3adb5044e876c"
          }
        }
      ],
      "_id": {
        "$oid": "695b818155ef70d7aa42cccd"
      }
    }
  ],
  "windows": [],
  "deletedAt": null,
  "createdAt": {
    "$date": "2026-01-05T09:16:49.364Z"
  },
  "updatedAt": {
    "$date": "2026-01-05T12:35:09.494Z"
  },
  "__v": 0
}