/**
 * UDP Discovery Service
 * 
 * UDP broadcast discovery service for hardware health monitoring
 * Phase 1 implementation based on successful PoC testing
 */

import * as dgram from 'dgram'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { ControllerHealthStatus } from './HardwareHealthChecker'
import { HealthConfig } from '../models/HealthConfig'
import { LogTags } from '../utils/LogTags'

export interface UdpDiscoveryResponse {
  ip: string
  port: number
  mac: string
  deviceType: string
  firmwareVersion: string
  deviceName: string
  status: string
  uptime: number
  freeMemory: number
  rssi: number
  responseTime: number
  timestamp: Date
}

export interface UdpDiscoveryResult {
  devices: UdpDiscoveryResponse[]
  totalTime: number
  message: string
}

export interface UdpDiscoveryConfig {
  enabled: boolean
  port: number
  broadcastAddress: string
  responseTimeout: number
  retryAttempts: number
  fallbackToHttp: boolean
  // WSL-specific settings
  wslFallbackEnabled?: boolean
  ipRangeScanEnabled?: boolean
  scanNetworkBase?: string  // Default: '192.168.0'
  scanStartIp?: number      // Default: 100
  scanEndIp?: number        // Default: 200
}

export class UdpDiscoveryService {
  private logger = UnifiedLoggingService.createModuleLogger('UdpDiscoveryService.ts')

  constructor(
    private config: UdpDiscoveryConfig = {
      enabled: true,
      port: 8888,
      broadcastAddress: '192.168.0.255',
      responseTimeout: 2000,
      retryAttempts: 3,
      fallbackToHttp: true,
      // WSL-specific defaults
      wslFallbackEnabled: true,
      ipRangeScanEnabled: true,
      scanNetworkBase: '192.168.0',
      scanStartIp: 100,
      scanEndIp: 200
    }
  ) {}

  /**
   * UDP broadcast discovery with timeout handling
   */
  async discoverDevices(message: string = 'HYDROPONICS_DISCOVERY', useDirect: boolean = false, targetIP?: string): Promise<UdpDiscoveryResult> {
    // За мониторинг на UDP broadcast discovery - network device discovery със timeout и error handling
    return new Promise((resolve, reject) => {
      const client = dgram.createSocket('udp4')
      const devices: UdpDiscoveryResponse[] = []
      const startTime = Date.now()

      const targetAddress = useDirect && targetIP ? targetIP : this.config.broadcastAddress

      console.log(`\n📡 [UDP DEBUG] Sending discovery to: ${targetAddress}:${this.config.port}`)
      console.log(`   Message: "${message}", Mode: ${useDirect ? 'Direct' : 'Broadcast'}`)

      // Enable broadcast only if not using direct
      if (!useDirect) {
        client.bind(() => {
          client.setBroadcast(true)
        })
      }

      // Listen for responses
      client.on('message', (msg, rinfo) => {
        const responseTime = Date.now() - startTime
        
        // За мониторинг на JSON response parsing - device information extraction от UDP responses
        try {
          // Try to parse JSON response
          const parsedResponse = JSON.parse(msg.toString())
          
          // За мониторинг на device information parsing - MAC, firmware version, status metrics extraction
          const deviceInfo: UdpDiscoveryResponse = {
            ip: rinfo.address,
            port: rinfo.port,
            mac: parsedResponse.mac || 'unknown',
            deviceType: parsedResponse.deviceType || 'unknown',
            firmwareVersion: parsedResponse.firmwareVersion || 'unknown',
            deviceName: parsedResponse.deviceName || 'Unknown Device',
            status: parsedResponse.status || 'online',
            uptime: parsedResponse.uptime || 0,
            freeMemory: parsedResponse.freeMemory || 0,
            rssi: parsedResponse.rssi || 0,
            responseTime: responseTime,
            timestamp: new Date()
          }

          devices.push(deviceInfo)
          // Remove verbose discovery logging

        } catch (e) {
          this.logger.warn(LogTags.network.udp.timeout, {
            message: 'Failed to parse UDP response',
            ip: rinfo.address,
            port: rinfo.port,
            rawMessage: msg.toString()
          }, {
            source: { file: 'UdpDiscoveryService.ts', method: 'discoverDevices' },
            business: { category: 'network', operation: 'udp_response_parsing' }
          })
        }
      })

      // Send message to target
      const buffer = Buffer.from(message)
      client.send(buffer, 0, buffer.length, this.config.port, targetAddress, (err) => {
        if (err) {
          client.close()
          reject(err)
          return
        }

        // За мониторинг на response timeout handling - discovery completion и device counting
        // Wait for responses
        setTimeout(() => {
          client.close()
          const totalTime = Date.now() - startTime
          console.log(`📡 [UDP DEBUG] Discovery completed - Found ${devices.length} devices in ${totalTime}ms`)
          if (devices.length > 0) {
            devices.forEach((dev, idx) => {
              console.log(`   ${idx + 1}. ${dev.deviceName} (${dev.mac}) - IP: ${dev.ip}`)
            })
          }
          resolve({ devices, totalTime, message })
        }, this.config.responseTimeout)
      })

      client.on('error', (err) => {
        client.close()
        reject(err)
      })
    })
  }

  /**
   * Convert UDP discovery response to controller health status
   */
  async convertToHealthStatus(udpResponse: UdpDiscoveryResponse, controllerObjectId?: string): Promise<ControllerHealthStatus> {
    // За мониторинг на health status conversion - UDP response към ControllerHealthStatus format transformation със правилен ObjectId
    
    // If ObjectId is not provided, try to find controller by MAC address
    let controllerId: string = controllerObjectId || udpResponse.mac
    if (!controllerObjectId) {
      try {
        const { PhysicalController } = await import('../models/PhysicalController')
        const controller = await PhysicalController.findOne({ macAddress: udpResponse.mac }).exec()
        if (controller) {
          controllerId = controller._id.toString()
        } else {
          this.logger.warn(LogTags.controller.discovery.lost, {
            message: 'No controller found with MAC - using MAC as fallback ID',
            mac: udpResponse.mac
          }, {
            source: { file: 'UdpDiscoveryService.ts', method: 'convertToHealthStatus' },
            business: { category: 'controller', operation: 'mac_resolution' }
          })
          // controllerId is already set to udpResponse.mac as fallback
        }
      } catch (error: any) {
        this.logger.error(LogTags.controller.discovery.failed, {
          message: 'Error finding controller by MAC',
          mac: udpResponse.mac,
          error: error.message,
          stack: error.stack
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'convertToHealthStatus' },
          business: { category: 'controller', operation: 'mac_resolution' }
        })
        // controllerId is already set to udpResponse.mac as fallback
      }
    }
    
    return {
      controllerId: controllerId,
      name: udpResponse.deviceName,
      status: udpResponse.status as 'online' | 'offline' | 'error' | 'unknown',
      lastCheck: udpResponse.timestamp,
      responseTime: udpResponse.responseTime,
      devicesCount: 0 // Will be populated by health checker
    }
  }

  /**
   * Batch health check for multiple controllers using UDP
   * With smart WSL fallback to IP range scan
   */
  async checkAllControllers(): Promise<ControllerHealthStatus[]> {
    // За мониторинг на batch health checking - multiple controller discovery и health status generation
    try {
      // Try broadcast first
      const result = await this.discoverDevices('HYDROPONICS_DISCOVERY', false)

      // If no devices found via broadcast, try WSL-compatible fallbacks
      if (result.devices.length === 0 && this.isWSLEnvironment()) {
        // За мониторинг на WSL fallback activation - automatic WSL environment detection и fallback strategy selection
        
        // Strategy 1: Network IP discovery (ping-based scan for active IPs)
        let scanResult: UdpDiscoveryResult
        try {
          scanResult = await this.networkIPDiscovery()
        } catch (networkError) {
          this.logger.warn(LogTags.network.discovery.failed, {
            message: 'Network IP Discovery failed',
            error: networkError instanceof Error ? networkError.message : String(networkError)
          }, {
            source: { file: 'UdpDiscoveryService.ts', method: 'checkAllControllers' },
            business: { category: 'network', operation: 'ip_discovery' }
          })
          
          // Strategy 2: Fallback to traditional IP range scan
          scanResult = await this.scanIpRange()
        }

        const healthStatuses: ControllerHealthStatus[] = []
        for (const device of scanResult.devices) {
          const healthStatus = await this.convertToHealthStatus(device)
          healthStatuses.push(healthStatus)

          // Sync MAC address to database if missing
          await this.syncMacAddressToDatabase(device)
        }
        return healthStatuses
      }

      const healthStatuses: ControllerHealthStatus[] = []
      for (const device of result.devices) {
        const healthStatus = await this.convertToHealthStatus(device)
        healthStatuses.push(healthStatus)

        // Sync MAC address to database if missing
        await this.syncMacAddressToDatabase(device)
      }
      return healthStatuses
    } catch (error: any) {
      this.logger.error(LogTags.network.discovery.failed, {
        message: 'UDP batch health check failed',
        error: error.message,
        stack: error.stack
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'checkAllControllers' },
        business: { category: 'network', operation: 'batch_health_check' }
      })
      throw error
    }
  }

  /**
   * Direct UDP check for single controller
   */
  async checkSingleController(ipAddress: string): Promise<ControllerHealthStatus | null> {
    // За мониторинг на direct UDP checks - single controller validation чрез targeted UDP messages
    try {
      const result = await this.discoverDevices('HYDROPONICS_DISCOVERY', true, ipAddress)
      if (result.devices.length > 0) {
        const healthStatus = await this.convertToHealthStatus(result.devices[0])
        return healthStatus
      }
      return null
    } catch (error: any) {
      this.logger.error(LogTags.network.udp.timeout, {
        message: 'UDP direct check failed',
        ipAddress,
        error: error.message,
        stack: error.stack
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'checkSingleController' },
        business: { category: 'network', operation: 'direct_udp_check' }
      })
      throw error
    }
  }

  /**
   * Scan known controllers from database (WSL-friendly approach)
   * Uses direct IP targeting instead of broadcast
   */
  async scanKnownControllers(controllers: any[]): Promise<UdpDiscoveryResponse[]> {
    // За мониторинг на known controller scanning - database-driven UDP discovery за WSL environments
    const devices: UdpDiscoveryResponse[] = []
    const scanPromises: Promise<void>[] = []

    // За мониторинг на known controllers scanning initiation - database-driven controller discovery start

    for (const controller of controllers) {
      const ipAddress = controller.address || controller.communicationConfig?.ip_address
      
      if (!ipAddress) {
        this.logger.warn(LogTags.controller.connect.failed, {
          message: 'No IP address found for controller',
          controllerName: controller.name
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'scanKnownControllers' },
          business: { category: 'controller', operation: 'known_controller_scan' }
        })
        continue
      }

      const scanPromise = this.scanSingleIP(ipAddress)
        .then((device) => {
          if (device) {
            devices.push(device)
            // За мониторинг на known controller discovery success - successful controller detection от known IP addresses
            this.logger.info(LogTags.controller.discovery.found, {
              message: 'Known controller found',
              controllerName: controller.name,
              ipAddress
            }, {
              source: { file: 'UdpDiscoveryService.ts', method: 'scanKnownControllers' },
              business: { category: 'controller', operation: 'known_controller_scan' }
            })
          } else {
            // За мониторинг на known controller offline detection - offline controller tracking в known database entries
            this.logger.warn(LogTags.controller.health.offline, {
              message: 'Known controller offline',
              controllerName: controller.name,
              ipAddress
            }, {
              source: { file: 'UdpDiscoveryService.ts', method: 'scanKnownControllers' },
              business: { category: 'controller', operation: 'known_controller_scan' }
            })
          }
        })
        .catch((error) => {
          this.logger.warn(LogTags.controller.connect.failed, {
            message: 'Failed to scan known controller',
            controllerName: controller.name,
            error: error.message
          }, {
            source: { file: 'UdpDiscoveryService.ts', method: 'scanKnownControllers' },
            business: { category: 'controller', operation: 'known_controller_scan' }
          })
        })
      
      scanPromises.push(scanPromise)
    }

    await Promise.all(scanPromises)
    
    // За мониторинг на known controllers scan completion - comprehensive scan results reporting
    return devices
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig: Partial<UdpDiscoveryConfig>): void {
    // За мониторинг на dynamic configuration - runtime parameter updates за network settings
    this.config = { ...this.config, ...newConfig }
  }

  /**
   * Get current configuration
   */
  getConfig(): UdpDiscoveryConfig {
    return { ...this.config }
  }

  /**
   * MAC-based controller identification (Phase 3.2)
   */
  async findControllerByMac(macAddress: string): Promise<UdpDiscoveryResponse | null> {
    // За мониторинг на MAC-based identification - controller discovery чрез unique MAC address matching
    try {
      const result = await this.discoverDevices('HYDROPONICS_DISCOVERY', false)
      
      // Find device with matching MAC address
      const matchingDevice = result.devices.find(device => 
        device.mac && device.mac.toLowerCase() === macAddress.toLowerCase()
      )
      
      if (matchingDevice) {
        this.logger.info(LogTags.controller.discovery.found, {
          message: 'Controller found via MAC',
          macAddress,
          ip: matchingDevice.ip
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'findControllerByMac' },
          business: { category: 'controller', operation: 'mac_discovery' }
        })
        return matchingDevice
      }
      
      this.logger.warn(LogTags.controller.discovery.lost, {
        message: 'No controller found with MAC address',
        macAddress
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'findControllerByMac' },
        business: { category: 'controller', operation: 'mac_discovery' }
      })
      return null
    } catch (error: any) {
      this.logger.error(LogTags.controller.discovery.failed, {
        message: 'MAC-based discovery failed',
        macAddress,
        error: error.message,
        stack: error.stack
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'findControllerByMac' },
        business: { category: 'controller', operation: 'mac_discovery' }
      })
      throw error
    }
  }

  /**
   * WSL Environment Detection
   */
  private isWSLEnvironment(): boolean {
    // За мониторинг на WSL environment detection - Windows Subsystem for Linux detection чрез environment variables
    // Check if running in WSL environment
    return process.platform === 'linux' && process.env.WSL_DISTRO_NAME !== undefined
  }

  /**
   * Smart IP Range Scan for WSL environments
   * Scans common local network ranges for Arduino devices
   */
  async scanIpRange(
    baseNetwork: string = this.config.scanNetworkBase || '192.168.0', 
    startIp: number = this.config.scanStartIp || 100, 
    endIp: number = this.config.scanEndIp || 200
  ): Promise<UdpDiscoveryResult> {
    // За мониторинг на WSL IP range scanning - sequential UDP discovery за local network range
    const devices: UdpDiscoveryResponse[] = []
    const startTime = Date.now()
    const scanPromises: Promise<void>[] = []

    // За мониторинг на WSL IP range scan initiation - sequential network scanning parameters и range definition

    // Create scan promises for IP range
    for (let i = startIp; i <= endIp; i++) {
      const targetIP = `${baseNetwork}.${i}`
      
      const scanPromise = this.scanSingleIP(targetIP)
        .then((device) => {
          if (device) {
            devices.push(device)
            // За мониторинг на IP range scan device discovery - successful device detection в network range
          }
        })
        .catch((error) => {
          // Silently ignore timeout/connection errors for IP scan
          // this.logger.debug('UdpDiscoveryService.ts', `No device at ${targetIP}: ${error.message}`)
        })
      
      scanPromises.push(scanPromise)
    }

    // Wait for all scans to complete
    await Promise.all(scanPromises)
    
    const totalTime = Date.now() - startTime
    // За мониторинг на IP range scan completion - comprehensive scan performance и results reporting
    
    return {
      devices,
      totalTime,
      message: `IP Range Scan: ${baseNetwork}.${startIp}-${endIp}`
    }
  }

  /**
   * Scan single IP address with shorter timeout
   */
  private async scanSingleIP(targetIP: string, port?: number, timeout?: number): Promise<UdpDiscoveryResponse | null> {
    // За мониторинг на single IP scanning - targeted UDP discovery с short timeout за network efficiency
    return new Promise((resolve) => {
      const client = dgram.createSocket('udp4')
      const startTime = Date.now()
      let resolved = false

      // Use provided timeout or default (500ms for efficient network scanning)
      const scanTimeout = timeout || 500
      const udpPort = port || this.config.port

      // Listen for response
      client.on('message', (msg, rinfo) => {
        if (resolved) return
        resolved = true
        
        const responseTime = Date.now() - startTime
        
        try {
          const parsedResponse = JSON.parse(msg.toString())
          
          const deviceInfo: UdpDiscoveryResponse = {
            ip: rinfo.address,
            port: rinfo.port,
            mac: parsedResponse.mac || 'unknown',
            deviceType: parsedResponse.deviceType || 'unknown',
            firmwareVersion: parsedResponse.firmwareVersion || 'unknown',
            deviceName: parsedResponse.deviceName || 'Unknown Device',
            status: parsedResponse.status || 'online',
            uptime: parsedResponse.uptime || 0,
            freeMemory: parsedResponse.freeMemory || 0,
            rssi: parsedResponse.rssi || 0,
            responseTime: responseTime,
            timestamp: new Date()
          }

          client.close()
          resolve(deviceInfo)
        } catch (e) {
          client.close()
          resolve(null)
        }
      })

      // Send discovery message
      const buffer = Buffer.from('HYDROPONICS_DISCOVERY')
      client.send(buffer, 0, buffer.length, udpPort, targetIP, (err) => {
        if (err) {
          client.close()
          if (!resolved) {
            resolved = true
            resolve(null)
          }
          return
        }

        // Short timeout for individual IP
        setTimeout(() => {
          if (!resolved) {
            resolved = true
            client.close()
            resolve(null)
          }
        }, scanTimeout)
      })

      client.on('error', () => {
        if (!resolved) {
          resolved = true
          client.close()
          resolve(null)
        }
      })
    })
  }

  /**
   * IP drift detection and automatic update (Phase 3.2)
   */
  async detectAndUpdateIpDrift(controller: any, PhysicalControllerModel: any): Promise<boolean> {
    // За мониторинг на IP drift detection - automatic IP address updates при network changes
    try {
      if (!controller.macAddress) {
        this.logger.warn(LogTags.controller.connect.failed, {
          message: 'Cannot detect IP drift - MAC address not available',
          controllerName: controller.name
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'detectAndUpdateIpDrift' },
          business: { category: 'controller', operation: 'ip_drift_detection' }
        })
        return false
      }

      // Find current IP via MAC address
      const discoveredDevice = await this.findControllerByMac(controller.macAddress)
      
      if (!discoveredDevice) {
        this.logger.warn(LogTags.controller.discovery.lost, {
          message: 'Controller not discovered via MAC',
          controllerName: controller.name,
          macAddress: controller.macAddress
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'detectAndUpdateIpDrift' },
          business: { category: 'controller', operation: 'ip_drift_detection' }
        })
        return false
      }

      // Check for IP drift
      const currentDbIp = controller.address || controller.communicationConfig?.ip_address
      const discoveredIp = discoveredDevice.ip
      
      if (currentDbIp !== discoveredIp) {
        this.logger.info(LogTags.network.discovery.completed, {
          message: 'IP drift detected',
          controllerName: controller.name,
          previousIp: currentDbIp,
          newIp: discoveredIp
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'detectAndUpdateIpDrift' },
          business: { category: 'controller', operation: 'ip_drift_detection' }
        })
        
        // Update IP address in database
        const updateData: any = {
          address: discoveredIp,
          lastSeen: new Date(),
          lastDiscoveryMethod: 'udp'
        }
        
        // Update communicationConfig if exists
        if (controller.communicationConfig) {
          updateData.communicationConfig = {
            ...controller.communicationConfig,
            ip_address: discoveredIp
          }
        }
        
        await PhysicalControllerModel.findByIdAndUpdate(controller._id, updateData)
        this.logger.info(LogTags.network.discovery.completed, {
          message: 'IP address updated',
          controllerName: controller.name,
          newIp: discoveredIp
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'detectAndUpdateIpDrift' },
          business: { category: 'controller', operation: 'ip_drift_update' }
        })
        
        return true
      }
      
      // No drift detected, just update lastSeen
      await PhysicalControllerModel.findByIdAndUpdate(controller._id, {
        lastSeen: new Date(),
        lastDiscoveryMethod: 'udp'
      })
      
      return false
    } catch (error: any) {
      this.logger.error(LogTags.network.discovery.failed, {
        message: 'IP drift detection failed',
        controllerName: controller.name,
        error: error.message,
        stack: error.stack
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'detectAndUpdateIpDrift' },
        business: { category: 'controller', operation: 'ip_drift_detection' }
      })
      throw error
    }
  }

  /**
   * Enhanced WSL UDP Discovery Strategy - Network IP discovery
   * Implements user's idea: "да се сканира мрежата за IP на конторлери и да им се прати UDP на откритите IP, а не на х.х.х.255"
   * Uses configured broadcast address settings instead of system network interfaces
   * Uses ping-based network scanning to discover active IPs, then sends UDP discovery messages directly
   */
  private async networkIPDiscovery(): Promise<UdpDiscoveryResult> {
    try {
      // Remove startup logging - keep only summary results
      
      // Get saved UDP settings from HealthConfig instead of system interfaces
      const healthConfig = await HealthConfig.getSingleton()
      const udpSettings = healthConfig.udp
      
      if (!udpSettings?.enabled) {
        this.logger.warn(LogTags.network.discovery.failed, {
          message: 'UDP discovery is disabled in HealthConfig'
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'networkIPDiscovery' },
          business: { category: 'network', operation: 'discovery_configuration' }
        })
        return {
          devices: [],
          totalTime: 0,
          message: 'UDP discovery disabled in configuration'
        }
      }
      
      const results: UdpDiscoveryResponse[] = []
      const startTime = Date.now()
      
      let networks: Array<{interface: string, range: string, subnet: string}> = []
      
      // Check discovery method - use network_scan for WSL compatibility
      if (udpSettings.discoveryMethod === 'network_scan') {
        // Remove method selection logging
        
        // Use configured broadcast address if available, otherwise default to 192.168.0.255
        const targetNetwork = udpSettings.broadcastAddress || '192.168.0.255'
        const networkRange = this.calculateRangeFromBroadcast(targetNetwork)
        
        if (networkRange) {
          networks.push({
            interface: 'network_scan',
            range: networkRange,
            subnet: targetNetwork.replace('.255', '.0/24')
          })
          // Remove network range logging
        } else {
          // Fallback to default range if calculation fails
          networks.push({
            interface: 'network_scan_default',
            range: '192.168.0.1-192.168.0.254',
            subnet: '192.168.0.0/24'
          })
          // Remove default range logging
        }
      } else if (udpSettings.broadcastAddress) {
        // Use broadcast method with configured address
        const broadcastIP = udpSettings.broadcastAddress
        // Remove broadcast address logging
        
        // Calculate network range from broadcast address (e.g., 192.168.0.255 -> 192.168.0.1-254)
        const networkRange = this.calculateRangeFromBroadcast(broadcastIP)
        if (networkRange) {
          networks.push({
            interface: 'configured',
            range: networkRange,
            subnet: broadcastIP.replace('.255', '.0/24')
          })
        }
      } else {
        // Fallback to system network interfaces if no broadcast address configured
        // Remove fallback logging
        networks = await this.getNetworkInterfaces()
      }
      
      // Scan each network range
      for (const network of networks) {
        // Remove scanning progress logging

        // Get active IPs in this network range
        const activeIPs = await this.pingScanNetwork(network.range)
        // Remove active IPs count logging

        // Send UDP discovery to each active IP using configured port and timeout
        for (const ip of activeIPs) {
          try {
            const udpResponse = await this.scanSingleIP(ip, udpSettings.port, udpSettings.responseTimeout)
            if (udpResponse) {
              results.push(udpResponse)
              // Remove individual UDP response logging

              // MAC address synchronization - update database with discovered device info
              await this.syncMacAddressToDatabase(udpResponse)
            }
          } catch (error) {
            // Skip IPs that don't respond to UDP discovery (remove debug logging)
          }
        }
      }
      
      const totalTime = Date.now() - startTime
      // this.logger.info(LogTags.network.discovery.completed, {
      //   message: 'Network IP discovery completed',
      //   devicesFound: results.length,
      //   totalTime: `${totalTime}ms`
      // }, {
      //   source: { file: 'UdpDiscoveryService.ts', method: 'networkIPDiscovery' },
      //   business: { category: 'network', operation: 'ip_discovery' }
      // })
      
      return {
        devices: results,
        totalTime: totalTime,
        message: `Network IP discovery found ${results.length} devices`
      }
      
    } catch (error: any) {
      this.logger.error(LogTags.network.discovery.failed, {
        message: 'Network IP discovery failed',
        error: error.message,
        stack: error.stack
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'networkIPDiscovery' },
        business: { category: 'network', operation: 'ip_discovery' }
      })
      throw error
    }
  }
  
  /**
   * Get local network interfaces and their ranges
   */
  private async getNetworkInterfaces(): Promise<Array<{interface: string, range: string, subnet: string}>> {
    const os = await import('os')
    const interfaces = os.networkInterfaces()
    const networks: Array<{interface: string, range: string, subnet: string}> = []
    
    for (const [name, addresses] of Object.entries(interfaces)) {
      if (!addresses) continue
      
      for (const addr of addresses) {
        // Skip loopback, internal, and IPv6 addresses
        if (addr.internal || addr.family !== 'IPv4') continue
        
        // Calculate network range from IP and netmask
        const networkRange = this.calculateNetworkRange(addr.address, addr.netmask)
        if (networkRange) {
          networks.push({
            interface: name,
            range: networkRange,
            subnet: `${addr.address}/${this.cidrFromNetmask(addr.netmask)}`
          })
          // Remove interface debug logging
        }
      }
    }
    
    return networks
  }
  
  /**
   * Ping scan network range to find active IPs
   * Uses system ping command for efficiency
   */
  private async pingScanNetwork(networkRange: string): Promise<string[]> {
    const { exec } = await import('child_process')
    const { promisify } = await import('util')
    const execAsync = promisify(exec)
    
    // Parse network range (e.g., "192.168.1.1-192.168.1.254")
    const [startIP, endIP] = networkRange.split('-')
    const startParts = startIP.split('.').map(Number)
    const endParts = endIP.split('.').map(Number)
    
    const activeIPs: string[] = []
    const promises: Promise<void>[] = []
    
    // Generate IP range and ping concurrently (limited batch size for performance)
    const batchSize = 20
    const allIPs: string[] = []
    
    // Generate all IPs in range
    for (let i = startParts[3]; i <= endParts[3]; i++) {
      const ip = `${startParts[0]}.${startParts[1]}.${startParts[2]}.${i}`
      allIPs.push(ip)
    }
    
    // Process in batches
    for (let i = 0; i < allIPs.length; i += batchSize) {
      const batch = allIPs.slice(i, i + batchSize)
      const batchPromises = batch.map(async (ip) => {
        try {
          // Fast ping with short timeout (200ms)
          const pingCmd = process.platform === 'win32' 
            ? `ping -n 1 -w 200 ${ip}` 
            : `ping -c 1 -W 0.2 ${ip}`
            
          await execAsync(pingCmd)
          activeIPs.push(ip)
        } catch {
          // IP is not active, ignore
        }
      })
      
      // Wait for current batch before starting next (avoid overwhelming network)
      await Promise.all(batchPromises)
    }
    
    // Remove ping scan debug logging
    return activeIPs
  }
  
  /**
   * Calculate network range from IP address and netmask
   */
  private calculateNetworkRange(ipAddress: string, netmask: string): string | null {
    try {
      const ipParts = ipAddress.split('.').map(Number)
      const maskParts = netmask.split('.').map(Number)
      
      // Calculate network address
      const networkParts = ipParts.map((ip, i) => ip & maskParts[i])
      
      // Calculate broadcast address
      const broadcastParts = networkParts.map((net, i) => net | (255 - maskParts[i]))
      
      // Return range excluding network and broadcast addresses
      const startIP = `${networkParts[0]}.${networkParts[1]}.${networkParts[2]}.${networkParts[3] + 1}`
      const endIP = `${broadcastParts[0]}.${broadcastParts[1]}.${broadcastParts[2]}.${broadcastParts[3] - 1}`
      
      return `${startIP}-${endIP}`
    } catch (error) {
      this.logger.warn(LogTags.network.discovery.failed, {
        message: 'Failed to calculate network range',
        ipAddress,
        netmask
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'calculateNetworkRange' },
        business: { category: 'network', operation: 'range_calculation' }
      })
      return null
    }
  }
  
  /**
   * Calculate network range from broadcast address
   * Example: 192.168.0.255 -> 192.168.0.1-192.168.0.254
   */
  private calculateRangeFromBroadcast(broadcastIP: string): string | null {
    try {
      if (!broadcastIP.endsWith('.255')) {
        this.logger.warn(LogTags.network.discovery.failed, {
          message: 'Invalid broadcast address format',
          broadcastIP
        }, {
          source: { file: 'UdpDiscoveryService.ts', method: 'calculateRangeFromBroadcast' },
          business: { category: 'network', operation: 'broadcast_validation' }
        })
        return null
      }
      
      const parts = broadcastIP.split('.')
      const baseNetwork = `${parts[0]}.${parts[1]}.${parts[2]}`
      const startIP = `${baseNetwork}.1`
      const endIP = `${baseNetwork}.254`
      
      // Remove broadcast calculation debug logging
      return `${startIP}-${endIP}`
      
    } catch (error: any) {
      this.logger.warn(LogTags.network.discovery.failed, {
        message: 'Failed to calculate range from broadcast',
        broadcastIP,
        error: error.message
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'calculateRangeFromBroadcast' },
        business: { category: 'network', operation: 'broadcast_calculation' }
      })
      return null
    }
  }
  
  /**
   * Convert netmask to CIDR notation
   */
  private cidrFromNetmask(netmask: string): number {
    const maskParts = netmask.split('.').map(Number)
    let cidr = 0
    for (const part of maskParts) {
      cidr += part.toString(2).split('1').length - 1
    }
    return cidr
  }
  
  /**
   * Synchronize discovered MAC address with database
   * Auto-update IP addresses and MAC addresses for known controllers
   */
  private async syncMacAddressToDatabase(udpResponse: UdpDiscoveryResponse): Promise<void> {
    try {
      const { PhysicalController } = await import('../models/PhysicalController')
      
      // Skip if no MAC address in response
      if (!udpResponse.mac || udpResponse.mac === 'unknown') {
        // Remove MAC sync debug logging
        return
      }
      
      // Remove MAC sync info logging
      
      // First, try to find controller by MAC address
      let controller = await PhysicalController.findOne({ macAddress: udpResponse.mac })
      
      if (controller) {
        // Found controller by MAC - ensure communicationConfig.mac_address is also set
        const needsMacUpdate = !controller.communicationConfig?.mac_address
        const currentIP = controller.communicationConfig?.ip_address

        if (currentIP !== udpResponse.ip) {
          // Remove IP drift logging

          // Check for IP conflict - another controller might have this IP
          const conflictController = await PhysicalController.findOne({
            _id: { $ne: controller._id }, // Different controller
            'communicationConfig.ip_address': udpResponse.ip
          })

          if (conflictController) {
            // IP conflict detected - clear IP from conflicting controller
            // This happens when devices swap IPs or offline device loses its old IP
            this.logger.warn(LogTags.controller.discovery.lost, {
              message: 'IP conflict detected - clearing IP from conflicting controller',
              currentController: controller.name,
              currentMac: controller.macAddress,
              conflictController: conflictController.name,
              conflictMac: conflictController.macAddress,
              conflictStatus: conflictController.status,
              ip: udpResponse.ip
            }, {
              source: { file: 'UdpDiscoveryService.ts', method: 'syncMacAddressToDatabase' },
              business: { category: 'controller', operation: 'ip_conflict_resolution' }
            })

            // Clear IP from conflicting controller (regardless of online/offline status)
            await PhysicalController.findByIdAndUpdate(conflictController._id, {
              'communicationConfig.ip_address': null
            })
          }

          // Now safely update IP for current controller (and MAC if missing)
          await PhysicalController.findByIdAndUpdate(controller._id, {
            'communicationConfig.ip_address': udpResponse.ip,
            ...(needsMacUpdate && { 'communicationConfig.mac_address': udpResponse.mac }),
            lastSeen: new Date(),
            lastDiscoveryMethod: 'udp',
            status: 'online'
          })

          // Remove IP update logging
        } else {
          // Just update last seen, status, and MAC if missing
          await PhysicalController.findByIdAndUpdate(controller._id, {
            ...(needsMacUpdate && { 'communicationConfig.mac_address': udpResponse.mac }),
            lastSeen: new Date(),
            lastDiscoveryMethod: 'udp',
            status: 'online'
          })
        }
      } else {
        // No controller found by MAC - try to find by IP address and add MAC
        controller = await PhysicalController.findOne({
          'communicationConfig.ip_address': udpResponse.ip
        })

        if (controller && (!controller.macAddress || !controller.communicationConfig?.mac_address)) {
          await PhysicalController.findByIdAndUpdate(controller._id, {
            macAddress: udpResponse.mac,
            'communicationConfig.mac_address': udpResponse.mac,
            lastSeen: new Date(),
            lastDiscoveryMethod: 'udp',
            status: 'online'
          })
        } else if (controller && (controller.macAddress !== udpResponse.mac || controller.communicationConfig?.mac_address !== udpResponse.mac)) {
          // Controller exists with different MAC - potential conflict
          this.logger.warn(LogTags.controller.discovery.lost, {
            message: 'MAC address conflict detected',
            controllerName: controller.name,
            ip: udpResponse.ip,
            dbMac: controller.macAddress,
            discoveredMac: udpResponse.mac
          }, {
            source: { file: 'UdpDiscoveryService.ts', method: 'syncMacAddressToDatabase' },
            business: { category: 'controller', operation: 'mac_sync_conflict' }
          })
        } else if (!controller) {
          // No existing controller found - could be new device
          // Remove new device discovery logging
          // Note: We don't auto-create controllers, just log for manual review
        }
      }

      // Auto-initialize controller if it's active and was found
      if (controller && controller.isActive) {
        try {
          const { SystemInitializationService } = await import('./SystemInitializationService')
          const systemInit = SystemInitializationService.getInstance()
          await systemInit.ensureControllerInitialized(controller._id.toString())
        } catch (initError: any) {
          this.logger.warn(LogTags.controller.connect.failed, {
            message: 'Failed to auto-initialize controller after UDP discovery',
            controllerId: controller._id.toString(),
            controllerName: controller.name,
            error: initError.message
          }, {
            source: { file: 'UdpDiscoveryService.ts', method: 'syncMacAddressToDatabase' },
            business: { category: 'controller', operation: 'auto_initialization' }
          })
        }
      }

    } catch (error: any) {
      this.logger.error(LogTags.network.discovery.failed, {
        message: 'MAC sync failed',
        ip: udpResponse.ip,
        error: error.message,
        stack: error.stack
      }, {
        source: { file: 'UdpDiscoveryService.ts', method: 'syncMacAddressToDatabase' },
        business: { category: 'network', operation: 'mac_sync' }
      })
    }
  }
}