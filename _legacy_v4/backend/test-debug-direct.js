#!/usr/bin/env node

/**
 * Direct UDP Test - Debug Script
 * Тестване на direct UDP connection вместо broadcast
 */

const dgram = require('dgram');

const WEMOS_IP = '192.168.0.172';
const UDP_PORT = 8888;

async function testDirectUDP() {
  return new Promise((resolve, reject) => {
    const client = dgram.createSocket('udp4');
    const startTime = Date.now();
    
    console.log(`🎯 Direct UDP test to ${WEMOS_IP}:${UDP_PORT}`);
    
    // Listen for response
    client.on('message', (msg, rinfo) => {
      const responseTime = Date.now() - startTime;
      console.log(`📡 Response from ${rinfo.address}:${rinfo.port} (${responseTime}ms)`);
      console.log(`📄 Content: ${msg.toString()}`);
      
      client.close();
      resolve({ responseTime, content: msg.toString() });
    });
    
    // Send direct message
    const message = 'HYDROPONICS_DISCOVERY';
    const buffer = Buffer.from(message);
    
    client.send(buffer, 0, buffer.length, UDP_PORT, WEMOS_IP, (err) => {
      if (err) {
        console.error('❌ Send error:', err.message);
        client.close();
        reject(err);
        return;
      }
      
      console.log(`📤 Sent: "${message}"`);
      
      // Timeout after 3 seconds
      setTimeout(() => {
        console.log('⏰ Timeout - no response received');
        client.close();
        resolve({ timeout: true });
      }, 3000);
    });
    
    client.on('error', (err) => {
      console.error('❌ Socket error:', err.message);
      client.close();
      reject(err);
    });
  });
}

async function main() {
  console.log('🧪 Direct UDP Debug Test');
  console.log('========================\n');
  
  try {
    const result = await testDirectUDP();
    
    if (result.timeout) {
      console.log('\n❌ DIAGNOSIS: Direct UDP communication failed');
      console.log('   Possible causes:');
      console.log('   - Wemos is not running UDP server');
      console.log('   - Firewall blocking UDP traffic');
      console.log('   - Wrong IP address');
      console.log('   - Network connectivity issues');
    } else {
      console.log('\n✅ DIAGNOSIS: Direct UDP works!');
      console.log('   Issue might be with broadcast configuration');
    }
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
  }
}

main();