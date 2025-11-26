import { StartupService } from './src/services/StartupService'

async function testWeMosController() {
  console.log('🧪 Testing WeMos controller with Adapter Pattern...')
  
  const service = StartupService.getInstance()
  
  // Initialize the service (simulate server startup)
  console.log('🔄 Initializing StartupService...')
  await service.initializeControllers()
  
  // Wait a bit for initialization
  console.log('⏳ Waiting for controller initialization...')
  await new Promise(resolve => setTimeout(resolve, 3000))
  
  // Test WeMos controller command
  const wemosControllerId = '68aac157220a353a7cd80b0e'
  
  console.log(`🎯 Testing PING command on WeMos controller: ${wemosControllerId}`)
  
  try {
    const response = await service.sendCommand(wemosControllerId, { cmd: 'PING' })
    console.log('✅ WeMos PING Response:', JSON.stringify(response, null, 2))
    
    // Test sensor reading
    console.log('📊 Testing DIGITAL command...')
    const digitalResponse = await service.sendCommand(wemosControllerId, { cmd: 'DIGITAL', pin: 2 })
    console.log('✅ WeMos DIGITAL Response:', JSON.stringify(digitalResponse, null, 2))
    
  } catch (error) {
    console.error('❌ Error testing WeMos controller:', error)
  }
  
  console.log('🏁 Test completed')
  process.exit(0)
}

testWeMosController().catch(console.error)