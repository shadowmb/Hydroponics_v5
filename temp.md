20:45:55.958 -> Booting...
20:45:55.958 -> Connecting to WiFi: sunny_ad
20:45:56.003 -> WiFi Connected!
20:45:56.003 -> Waiting for IP.
20:45:56.505 -> IP Address: 10.1.10.253
20:46:19.296 -> Command received via Serial: INFO
20:46:19.339 -> {"ok":1,"up":25352,"mem":52,"ver":"1.0-v5","capabilities":["MODBUS_RTU_READ","DIGITAL_WRITE","DIGITAL_READ","PWM_WRITE","UART_READ_DISTANCE","ANALOG","ONEWIRE_READ_TEMP"]}
20:46:25.610 -> Command received via Serial: MODBUS_RTU_READ|{"slaveId":1,"funcCode":3,"startAddr":0,"len":1,"pins":[{"role":"RX","gpio":2},{"role":"TX","gpio":3}]}
20:46:27.852 -> {"ok":0,"error":"TIMEOUT_OR_CRC"}
20:46:36.226 -> Command received via Serial: MODBUS_RTU_READ|{"slaveId":1,"funcCode":3,"startAddr":0,"len":1,"pins":[{"role":"RX","gpio":2},{"role":"TX","gpio":3}]}
20:46:36.452 -> 
20:46:36.452 -> 
20:46:36.452 -> Firmware name: "C:\Users\Admin\AppData\Local\arduino\sketches\7DB7A91D946CD4D92F2DB410AFAE59C5/sketch_oct29a.ino", compiled on: Nov  3 2025
20:46:36.452 -> Fault on interrupt or bare metal(no OS) environment
20:46:36.452 -> ===== Thread stack information =====
20:46:36.452 ->   addr: 20007c20    data: 20002cb4
20:46:36.487 ->   addr: 20007c24    data: 00000020
20:46:36.487 ->   addr: 20007c28    data: 20002bfc
20:46:36.487 ->   addr: 20007c2c    data: ffffffe9
20:46:36.487 ->   addr: 20007c30    data: 00000001
20:46:36.487 ->   addr: 20007c34    data: 40005040
20:46:36.487 ->   addr: 20007c38    data: 40005040
20:46:36.523 ->   addr: 20007c3c    data: 00000000
20:46:36.523 ->   addr: 20007c40    data: 00000008
20:46:36.523 ->   addr: 20007c44    data: 0000d359
20:46:36.523 ->   addr: 20007c48    data: 00008a34
20:46:36.523 ->   addr: 20007c4c    data: 61000000
20:46:36.523 ->   addr: 20007c50    data: 0000a5e5
20:46:36.523 ->   addr: 20007c54    data: 00000001
20:46:36.523 ->   addr: 20007c58    data: 000001f4
20:46:36.523 ->   addr: 20007c5c    data: ffffffe9
20:46:36.523 ->   addr: 20007c60    data: 00000064
20:46:36.523 ->   addr: 20007c64    data: 00000006
20:46:36.523 ->   addr: 20007c68    data: 20007cf6
20:46:36.523 ->   addr: 20007c6c    data: 0000a5e4
20:46:36.523 ->   addr: 20007c70    data: 00002000
20:46:36.558 ->   addr: 20007c74    data: 00010593
20:46:36.558 ->   addr: 20007c78    data: 0001058a
20:46:36.558 ->   addr: 20007c7c    data: 21000000
20:46:36.558 ->   addr: 20007c80    data: 00000000
20:46:36.558 ->   addr: 20007c84    data: 20002cc4
20:46:36.558 ->   addr: 20007c88    data: 40040028
20:46:36.558 ->   addr: 20007c8c    data: 20002c94
20:46:36.558 ->   addr: 20007c90    data: 00000001
20:46:36.558 ->   addr: 20007c94    data: 00008a2b
20:46:36.558 ->   addr: 20007c98    data: 00008999
...
20:46:36.979 ->   addr: 20007e68    data: 3a226f69
20:46:37.016 ->   addr: 20007e6c    data: 7b2c7d32
20:46:37.017 ->   addr: 20007e70    data: 6c6f7222
20:46:37.017 ->   addr: 20007e74    data: 223a2265
20:46:37.017 ->   addr: 20007e78    data: 2c225854
20:46:37.017 ->   addr: 20007e7c    data: 69706722
20:46:37.017 ->   addr: 20007e80    data: 333a226f
20:46:37.017 ->   addr: 20007e84    data: 007d5d7d
20:46:37.017 ->   addr: 20007e88    data: 00000000
20:46:37.017 ->   addr: 20007e8c    data: 00004040
20:46:37.017 ->   addr: 20007e90    data: 0000a500
20:46:37.017 ->   addr: 20007e94    data: ffffffff
20:46:37.017 ->   addr: 20007e98    data: 20003064
20:46:37.017 ->   addr: 20007e9c    data: 00007009
20:46:37.017 ->   addr: 20007ea0    data: 20002698
20:46:37.051 ->   addr: 20007ea4    data: 00000077
20:46:37.051 ->   addr: 20007ea8    data: 00000077
20:46:37.051 ->   addr: 20007eac    data: 200026e8
20:46:37.051 ->   addr: 20007eb0    data: 00000021
20:46:37.051 ->   addr: 20007eb4    data: 00000021
20:46:37.051 ->   addr: 20007eb8    data: 20002618
20:46:37.085 ->   addr: 20007ebc    data: 00000077
20:46:37.085 ->   addr: 20007ec0    data: 00000077
20:46:37.085 ->   addr: 20007ec4    data: 00000000
20:46:37.085 ->   addr: 20007ec8    data: 00004040
20:46:37.085 ->   addr: 20007ecc    data: 0000a500
20:46:37.085 ->   addr: 20007ed0    data: 00000000
20:46:37.085 ->   addr: 20007ed4    data: 000103fd
20:46:37.085 ->   addr: 20007ed8    data: 000180f0
20:46:37.085 ->   addr: 20007edc    data: 40046f00
20:46:37.085 ->   addr: 20007ee0    data: 00000000
20:46:37.127 ->   addr: 20007ee4    data: 0001043b
20:46:37.127 ->   addr: 20007ee8    data: 000180f0
20:46:37.127 ->   addr: 20007eec    data: 0000906d
20:46:37.127 ->   addr: 20007ef0    data: 000180f0
20:46:37.127 ->   addr: 20007ef4    data: 0000cb9b
20:46:37.127 ->   addr: 20007ef8    data: 0000cb91
20:46:37.127 ->   addr: 20007efc    data: 00002599
20:46:37.127 -> ====================================
20:46:37.127 -> =================== Registers information ====================
20:46:37.127 ->   R0 : 00000012  R1 : 000000ca  R2 : 40006000  R3 : 28102c1c
20:46:37.127 ->   R12: 00000008  LR : ffffffe9  PC : 0000bba2  PSR: 2100001a
20:46:37.127 -> ==============================================================
20:46:37.161 -> Bus fault is caused by precise data access violation
20:46:37.161 -> The bus fault occurred address is 28102c20
20:46:37.161 -> Show more call stack info by run: addr2line -e "C:\Users\Admin\AppData\Local\arduino\sketches\7DB7A91D946CD4D92F2DB410AFAE59C5/sketch_oct29a.ino".elf -a -f 0000bba2 0000d358 00010592 00008a2a 0000f422 000066f0 00009de4 00006cfe 00007008 000103fc 0001043a 0000906c 0000cb9a 0000cb90
