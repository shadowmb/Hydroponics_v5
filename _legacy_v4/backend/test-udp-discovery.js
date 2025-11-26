#!/usr/bin/env node

/**
 * UDP Discovery Test Script
 * 
 * Тестов tool за UDP broadcast discovery и performance измерване
 * Използва се за валидиране на Arduino UDP функционалност
 * 
 * Usage:
 *   node test-udp-discovery.js discover
 *   node test-udp-discovery.js health
 *   node test-udp-discovery.js performance
 *   node test-udp-discovery.js compare
 */

const dgram = require('dgram');
const http = require('http');

// Configuration
const UDP_PORT = 8888;
const BROADCAST_IP = '192.168.0.255';
const WEMOS_IP = '192.168.0.172'; // From console log
const HTTP_PORT = 80; // For comparison
const TIMEOUT_MS = 3000;

class UDPDiscoveryTester {
  constructor() {
    this.discoveredDevices = [];
    this.performanceMetrics = {
      udp: { requests: 0, responses: 0, totalTime: 0, errors: 0 },
      http: { requests: 0, responses: 0, totalTime: 0, errors: 0 }
    };
  }

  /**
   * Send UDP broadcast and collect responses
   */
  async broadcastDiscover(message = 'HYDROPONICS_DISCOVERY', timeout = TIMEOUT_MS, useDirect = false) {
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4');
      const devices = [];
      const startTime = Date.now();

      const targetIP = useDirect ? WEMOS_IP : BROADCAST_IP;
      console.log(`🔍 ${useDirect ? 'Direct' : 'Broadcasting'}: "${message}" to ${targetIP}:${UDP_PORT}`);
      
      // Enable broadcast only if not using direct
      if (!useDirect) {
        client.bind(() => {
          client.setBroadcast(true);
        });
      }

      // Listen for responses
      client.on('message', (msg, rinfo) => {
        const responseTime = Date.now() - startTime;
        const deviceInfo = {
          ip: rinfo.address,
          port: rinfo.port,
          response: msg.toString(),
          responseTime: responseTime,
          timestamp: new Date().toISOString()
        };

        try {
          // Try to parse JSON response
          deviceInfo.parsedResponse = JSON.parse(msg.toString());
        } catch (e) {
          // Non-JSON response (echo, etc.)
          deviceInfo.parsedResponse = null;
        }

        devices.push(deviceInfo);
        console.log(`📡 Response from ${rinfo.address}:${rinfo.port} (${responseTime}ms)`);
        
        if (deviceInfo.parsedResponse) {
          console.log(`   Device: ${deviceInfo.parsedResponse.deviceName || 'Unknown'}`);
          console.log(`   MAC: ${deviceInfo.parsedResponse.mac || 'N/A'}`);
          console.log(`   Type: ${deviceInfo.parsedResponse.deviceType || 'N/A'}`);
        } else {
          console.log(`   Raw: ${msg.toString().substring(0, 50)}${msg.length > 50 ? '...' : ''}`);
        }
      });

      // Send message to target
      const buffer = Buffer.from(message);
      client.send(buffer, 0, buffer.length, UDP_PORT, targetIP, (err) => {
        if (err) {
          client.close();
          reject(err);
          return;
        }

        // Wait for responses
        setTimeout(() => {
          client.close();
          const totalTime = Date.now() - startTime;
          console.log(`\n✅ Discovery completed in ${totalTime}ms`);
          console.log(`📊 Found ${devices.length} device(s)\n`);
          resolve({ devices, totalTime, message });
        }, timeout);
      });

      client.on('error', (err) => {
        client.close();
        reject(err);
      });
    });
  }

  /**
   * Test UDP health check broadcast
   */
  async testHealthCheck() {
    console.log('🏥 Testing UDP Health Check...\n');
    
    try {
      const result = await this.broadcastDiscover('HYDROPONICS_HEALTH_CHECK');
      
      if (result.devices.length > 0) {
        result.devices.forEach((device, index) => {
          console.log(`Device ${index + 1}:`);
          if (device.parsedResponse && device.parsedResponse.responseType === 'health') {
            console.log(`  Status: ${device.parsedResponse.status}`);
            console.log(`  Uptime: ${device.parsedResponse.uptime}ms`);
            console.log(`  Memory: ${device.parsedResponse.freeMemory} bytes`);
            console.log(`  RSSI: ${device.parsedResponse.rssi} dBm`);
          }
          console.log(`  Response Time: ${device.responseTime}ms\n`);
        });
      } else {
        console.log('❌ No devices responded to health check\n');
      }
    } catch (error) {
      console.error('❌ Health check failed:', error.message);
    }
  }

  /**
   * Performance test - multiple requests
   */
  async testPerformance(iterations = 5) {
    console.log(`⚡ Performance Test: ${iterations} UDP broadcast iterations...\n`);
    
    const results = [];
    
    for (let i = 1; i <= iterations; i++) {
      console.log(`Iteration ${i}/${iterations}:`);
      
      try {
        const result = await this.broadcastDiscover('HYDROPONICS_DISCOVERY', 2000, true);
        results.push({
          iteration: i,
          devices: result.devices.length,
          totalTime: result.totalTime,
          avgResponseTime: result.devices.length > 0 ? 
            result.devices.reduce((sum, d) => sum + d.responseTime, 0) / result.devices.length : 0
        });
        
        console.log(`  Devices: ${result.devices.length}, Time: ${result.totalTime}ms\n`);
        
        // Small delay between iterations
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.log(`  Error: ${error.message}\n`);
        results.push({
          iteration: i,
          devices: 0,
          totalTime: TIMEOUT_MS,
          avgResponseTime: 0,
          error: error.message
        });
      }
    }

    // Calculate statistics
    const successfulResults = results.filter(r => !r.error);
    if (successfulResults.length > 0) {
      const avgTime = successfulResults.reduce((sum, r) => sum + r.totalTime, 0) / successfulResults.length;
      const avgDevices = successfulResults.reduce((sum, r) => sum + r.devices, 0) / successfulResults.length;
      const avgResponse = successfulResults.reduce((sum, r) => sum + r.avgResponseTime, 0) / successfulResults.length;

      console.log('📊 PERFORMANCE RESULTS:');
      console.log(`  Successful tests: ${successfulResults.length}/${iterations}`);
      console.log(`  Average discovery time: ${avgTime.toFixed(1)}ms`);
      console.log(`  Average devices found: ${avgDevices.toFixed(1)}`);
      console.log(`  Average response time: ${avgResponse.toFixed(1)}ms`);
      console.log(`  Success rate: ${(successfulResults.length/iterations*100).toFixed(1)}%\n`);
      
      return { avgTime, avgDevices, avgResponse, successRate: successfulResults.length/iterations };
    } else {
      console.log('❌ All performance tests failed\n');
      return null;
    }
  }

  /**
   * HTTP ping for comparison (simulates current system)
   */
  async httpPing(ip = WEMOS_IP, path = '/health') {
    return new Promise((resolve, reject) => {
      const startTime = Date.now();
      
      const req = http.get(`http://${ip}${path}`, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          const responseTime = Date.now() - startTime;
          resolve({
            ip,
            statusCode: res.statusCode,
            responseTime,
            data: data.substring(0, 200) // Limit data size
          });
        });
      });

      req.setTimeout(TIMEOUT_MS, () => {
        req.destroy();
        reject(new Error('HTTP timeout'));
      });

      req.on('error', (err) => {
        reject(err);
      });
    });
  }

  /**
   * Compare UDP vs HTTP performance
   */
  async comparePerformance(iterations = 5) {
    console.log(`🔄 UDP vs HTTP Comparison Test (${iterations} iterations each)...\n`);

    // Test UDP Performance
    console.log('Testing UDP Discovery...');
    const udpResults = await this.testPerformance(iterations);
    
    // Test HTTP Performance  
    console.log('Testing HTTP Health Checks...');
    const httpResults = [];
    
    for (let i = 1; i <= iterations; i++) {
      console.log(`HTTP Iteration ${i}/${iterations}:`);
      
      try {
        const startTime = Date.now();
        const result = await this.httpPing();
        const totalTime = Date.now() - startTime;
        
        httpResults.push({
          iteration: i,
          success: result.statusCode === 200,
          totalTime: totalTime,
          responseTime: result.responseTime
        });
        
        console.log(`  Status: ${result.statusCode}, Time: ${result.responseTime}ms\n`);
        
      } catch (error) {
        console.log(`  Error: ${error.message}\n`);
        httpResults.push({
          iteration: i,
          success: false,
          totalTime: TIMEOUT_MS,
          responseTime: TIMEOUT_MS,
          error: error.message
        });
      }
      
      // Small delay between iterations
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Calculate HTTP statistics
    const successfulHttp = httpResults.filter(r => r.success);
    const httpAvgTime = successfulHttp.length > 0 ? 
      successfulHttp.reduce((sum, r) => sum + r.responseTime, 0) / successfulHttp.length : 0;
    const httpSuccessRate = successfulHttp.length / iterations;

    // Display comparison
    console.log('🏆 COMPARISON RESULTS:');
    console.log('┌─────────────────┬─────────────┬─────────────┐');
    console.log('│ Metric          │ UDP         │ HTTP        │');
    console.log('├─────────────────┼─────────────┼─────────────┤');
    if (udpResults) {
      console.log(`│ Avg Time        │ ${udpResults.avgTime.toFixed(1).padStart(10)}ms │ ${httpAvgTime.toFixed(1).padStart(10)}ms │`);
      console.log(`│ Success Rate    │ ${(udpResults.successRate*100).toFixed(1).padStart(9)}% │ ${(httpSuccessRate*100).toFixed(1).padStart(9)}% │`);
      console.log(`│ Devices Found   │ ${udpResults.avgDevices.toFixed(1).padStart(10)}  │ ${successfulHttp.length > 0 ? '1.0' : '0.0'.padStart(10)}  │`);
      
      // Performance improvement calculation
      if (httpAvgTime > 0 && udpResults.avgTime > 0) {
        const improvement = ((httpAvgTime - udpResults.avgTime) / httpAvgTime * 100);
        console.log('├─────────────────┴─────────────┴─────────────┤');
        console.log(`│ UDP is ${improvement > 0 ? improvement.toFixed(1) + '% faster' : 'slower'.padStart(20)} than HTTP              │`);
      }
    } else {
      console.log('│ UDP Failed      │ N/A         │ N/A         │');
    }
    console.log('└─────────────────┴─────────────┴─────────────┘\n');
  }

  /**
   * Show help information
   */
  showHelp() {
    console.log('UDP Discovery Test Script\n');
    console.log('Commands:');
    console.log('  discover     - Broadcast discovery request');
    console.log('  direct       - Direct discovery to known device');
    console.log('  health       - Broadcast health check');
    console.log('  performance  - Run performance test (5 iterations)');
    console.log('  compare      - Compare UDP vs HTTP performance');
    console.log('  help         - Show this help\n');
    console.log('Examples:');
    console.log('  node test-udp-discovery.js discover');
    console.log('  node test-udp-discovery.js direct');
    console.log('  node test-udp-discovery.js performance');
    console.log('  node test-udp-discovery.js compare\n');
  }
}

// Main execution
async function main() {
  const tester = new UDPDiscoveryTester();
  const command = process.argv[2];

  console.log('🧪 UDP Discovery Test Script');
  console.log('============================\n');

  try {
    switch (command) {
      case 'discover':
        await tester.broadcastDiscover();
        break;
        
      case 'direct':
        await tester.broadcastDiscover('HYDROPONICS_DISCOVERY', TIMEOUT_MS, true);
        break;
        
      case 'health':
        await tester.testHealthCheck();
        break;
        
      case 'performance':
        await tester.testPerformance();
        break;
        
      case 'compare':
        await tester.comparePerformance();
        break;
        
      case 'help':
      default:
        tester.showHelp();
        break;
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

module.exports = UDPDiscoveryTester;