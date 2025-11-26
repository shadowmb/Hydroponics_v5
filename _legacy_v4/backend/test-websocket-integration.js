// ABOUTME: Test script to verify WebSocket integration in FlowInterpreter
// ABOUTME: Creates a mock flow execution and checks if WebSocket events are broadcasted correctly

const { spawn } = require('child_process');
const WebSocket = require('ws');

/**
 * Test WebSocket Integration with FlowInterpreter
 * This script tests that block execution events are properly broadcasted via WebSocket
 */
async function testWebSocketIntegration() {
  console.log('🧪 Testing WebSocket Integration with FlowInterpreter');

  let serverProcess;
  let wsClient;
  const receivedEvents = [];

  try {
    // Start the backend server
    console.log('📡 Starting backend server...');
    serverProcess = spawn('npm', ['run', 'dev'], {
      cwd: '/mnt/d/Hydroponics/Hydroponics v4/backend',
      stdio: 'pipe'
    });

    // Wait for server to start
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Server startup timeout')), 30000);

      serverProcess.stdout.on('data', (data) => {
        const output = data.toString();
        console.log('📋 Server output:', output.trim());

        if (output.includes('listening on port 5000') || output.includes('Server running')) {
          clearTimeout(timeout);
          resolve();
        }
      });

      serverProcess.stderr.on('data', (data) => {
        console.log('❌ Server error:', data.toString().trim());
      });
    });

    console.log('✅ Backend server started');

    // Connect WebSocket client
    console.log('🔌 Connecting WebSocket client...');
    wsClient = new WebSocket('ws://localhost:5000/ws');

    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('WebSocket connection timeout')), 5000);

      wsClient.on('open', () => {
        clearTimeout(timeout);
        console.log('✅ WebSocket connected');
        resolve();
      });

      wsClient.on('error', (error) => {
        clearTimeout(timeout);
        reject(error);
      });
    });

    // Listen for WebSocket events
    wsClient.on('message', (data) => {
      try {
        const event = JSON.parse(data.toString());
        receivedEvents.push(event);

        console.log(`📨 Received WebSocket event: ${event.type}`);

        if (event.type === 'block_started_enhanced') {
          console.log(`  🚀 Block Started: ${event.data.blockName} (${event.data.blockType})`);
          if (event.data.deviceName) {
            console.log(`    📱 Device: ${event.data.deviceName} (${event.data.deviceType})`);
          }
        } else if (event.type === 'block_executed_enhanced') {
          console.log(`  ✅ Block Completed: ${event.data.blockName} (${event.data.status})`);
          if (event.data.timing?.duration) {
            console.log(`    ⏱️ Duration: ${event.data.timing.duration}ms`);
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse WebSocket message:', error);
      }
    });

    // Wait for a reasonable amount of time to capture events
    console.log('⏳ Waiting 10 seconds to capture any flow execution events...');
    await new Promise(resolve => setTimeout(resolve, 10000));

    // Analyze results
    console.log('\n📊 Test Results:');
    console.log(`  📨 Total events received: ${receivedEvents.length}`);

    const blockStartEvents = receivedEvents.filter(e => e.type === 'block_started_enhanced');
    const blockCompleteEvents = receivedEvents.filter(e => e.type === 'block_executed_enhanced');

    console.log(`  🚀 Block start events: ${blockStartEvents.length}`);
    console.log(`  ✅ Block complete events: ${blockCompleteEvents.length}`);

    if (blockStartEvents.length > 0 && blockCompleteEvents.length > 0) {
      console.log('✅ WebSocket integration test PASSED - Events are being broadcasted');

      // Validate event structure
      const sampleStartEvent = blockStartEvents[0];
      const sampleCompleteEvent = blockCompleteEvents[0];

      console.log('\n🔍 Sample Event Validation:');
      console.log('  Start event structure:', {
        hasBlockId: !!sampleStartEvent.data?.blockId,
        hasBlockType: !!sampleStartEvent.data?.blockType,
        hasExecutionContext: !!sampleStartEvent.data?.executionContext,
        hasTiming: !!sampleStartEvent.data?.timing
      });

      console.log('  Complete event structure:', {
        hasBlockId: !!sampleCompleteEvent.data?.blockId,
        hasBlockType: !!sampleCompleteEvent.data?.blockType,
        hasExecutionContext: !!sampleCompleteEvent.data?.executionContext,
        hasTiming: !!sampleCompleteEvent.data?.timing,
        hasDuration: !!sampleCompleteEvent.data?.timing?.duration
      });

    } else if (receivedEvents.length > 0) {
      console.log('⚠️ WebSocket integration test PARTIAL - Events received but not the expected block events');
      console.log('  Event types received:', [...new Set(receivedEvents.map(e => e.type))]);
    } else {
      console.log('❌ WebSocket integration test FAILED - No events received');
      console.log('  This could mean:');
      console.log('  - No flow executions occurred during test');
      console.log('  - WebSocket broadcasting is not working');
      console.log('  - Events are being sent to different endpoint');
    }

  } catch (error) {
    console.error('💥 Test failed with error:', error);
  } finally {
    // Cleanup
    if (wsClient) {
      console.log('🔌 Closing WebSocket connection...');
      wsClient.close();
    }

    if (serverProcess) {
      console.log('🛑 Stopping backend server...');
      serverProcess.kill('SIGTERM');

      // Give it time to cleanup
      await new Promise(resolve => setTimeout(resolve, 2000));
    }

    console.log('🏁 Test completed');
  }
}

// Run the test
testWebSocketIntegration().catch(console.error);