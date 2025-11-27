#include <SoftwareSerial.h>
SoftwareSerial mySerial(2,3);
uint8_t Com[8] = { 0x01, 0x03, 0x00, 0x00, 0x00, 0x01, 0x84, 0x0A };
int PAR;
void setup() {
  Serial.begin(9600);
  mySerial.begin(4800);
}
void loop() {
  readPAR();
  Serial.print("PAR = ");
  Serial.print(PAR);
  Serial.println(" umol/m²·s ");
  delay(1000);
}

void readPAR(void) {
  uint8_t Data[10] = { 0 };
  uint8_t ch = 0;
  bool flag = 1;
  while (flag) {
    delay(100);
    mySerial.write(Com, 8);
    delay(100);
    if (readN(&ch, 1) == 1) {
      if (ch == 0x01) {
        Data[0] = ch;
        if (readN(&ch, 1) == 1) {
          if (ch == 0x03) {
            Data[1] = ch;
            if (readN(&ch, 1) == 1) {
              if (ch == 0x02) {
                Data[2] = ch;
                if (readN(&Data[3], 4) == 4) {
                  if (CRC16_2(Data, 5) == (Data[5] * 256 + Data[6])) {
                    PAR = Data[3] * 256 + Data[4];
                    flag = 0;
                  }
                }
              }
            }
          }
        }
      }
    }
    mySerial.flush();
  }
}

uint8_t readN(uint8_t *buf, size_t len) {
  size_t offset = 0, left = len;
  int16_t Tineout = 500;
  uint8_t *buffer = buf;
  long curr = millis();
  while (left) {
    if (mySerial.available()) {
      buffer[offset] = mySerial.read();
      offset++;
      left--;
    }
    if (millis() - curr > Tineout) {
      break;
    }
  }
  return offset;
}

unsigned int CRC16_2(unsigned char *buf, int len) {
  unsigned int crc = 0xFFFF;
  for (int pos = 0; pos < len; pos++) {
    crc ^= (unsigned int)buf[pos];
    for (int i = 8; i != 0; i--) {
      if ((crc & 0x0001) != 0) {
        crc >>= 1;
        crc ^= 0xA001;
      } else {
        crc >>= 1;
      }
    }
  }

  crc = ((crc & 0x00ff) << 8) | ((crc & 0xff00) >> 8);
  return crc;
}