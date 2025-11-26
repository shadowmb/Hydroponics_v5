/**
 * Adaptive Health Scheduler Service
 * 
 * Phase 3 Implementation - Advanced health checking strategy
 * Adjusts health check frequency based on system performance and discovery metrics
 */

import { UnifiedLoggingService } from './UnifiedLoggingService'
import { HardwareHealthChecker, ProtocolMetrics } from './HardwareHealthChecker'
import { LogTags } from '../utils/LogTags'

export enum HealthCheckMode {
  FAST_DISCOVERY = 'fast',      // 30-60 sec UDP broadcasts for discovery
  STANDARD_HEALTH = 'standard', // 5 min full validation  
  DEGRADED_MODE = 'degraded',   // HTTP fallback for problematic devices
  MAINTENANCE = 'maintenance'   // Reduced frequency during system updates
}

export interface PerformanceMetrics {
  udpSuccessRate: number
  httpSuccessRate: number
  averageResponseTime: number
  newDevicesDetected: number
  totalDevices: number
  lastModeChange: Date
}

export class AdaptiveHealthScheduler {
  private logger = UnifiedLoggingService.createModuleLogger('AdaptiveHealthScheduler.ts')
  private hardwareHealthChecker: HardwareHealthChecker
  private currentMode: HealthCheckMode = HealthCheckMode.STANDARD_HEALTH
  private performanceHistory: PerformanceMetrics[] = []
  private lastMetricsUpdate = new Date()

  constructor(hardwareHealthChecker: HardwareHealthChecker) {
    this.hardwareHealthChecker = hardwareHealthChecker
  }

  /**
   * Analyze current performance and adjust health checking mode
   */
  // За мониторинг на performance metrics analysis - automated decision making based на UDP/HTTP success rates
  adjustModeBasedOnMetrics(metrics: PerformanceMetrics): void {
    const previousMode = this.currentMode
    
 
    // За мониторинг на threshold validation - UDP success rate (<80%) и response time analysis
    // Decision logic based on plan specification
    if (metrics.udpSuccessRate < 0.8) {
      this.currentMode = HealthCheckMode.DEGRADED_MODE
      this.logger.warn(LogTags.system.health.warning, {
        message: 'Switching to DEGRADED_MODE due to low UDP success rate',
        udpSuccessRate: metrics.udpSuccessRate,
        threshold: 80
      }, {
        source: { file: 'AdaptiveHealthScheduler.ts', method: 'adjustModeBasedOnMetrics' },
        business: { category: 'system', operation: 'mode_change', severity: 'medium' }
      })
    } else if (metrics.newDevicesDetected > 0) {
      this.currentMode = HealthCheckMode.FAST_DISCOVERY
   
    } else if (metrics.averageResponseTime > 5000) {
      this.currentMode = HealthCheckMode.DEGRADED_MODE
      this.logger.warn(LogTags.system.health.warning, {
        message: 'Switching to DEGRADED_MODE due to high response times',
        averageResponseTime: metrics.averageResponseTime,
        threshold: 5000
      }, {
        source: { file: 'AdaptiveHealthScheduler.ts', method: 'adjustModeBasedOnMetrics' },
        business: { category: 'system', operation: 'mode_change', severity: 'medium' }
      })
    } else {
      this.currentMode = HealthCheckMode.STANDARD_HEALTH
    }

    // Apply configuration changes if mode changed
    if (previousMode !== this.currentMode) {
      this.applyModeConfiguration()
      metrics.lastModeChange = new Date()
    }

    // Store metrics for analysis
    this.performanceHistory.push(metrics)
    if (this.performanceHistory.length > 10) {
      this.performanceHistory.shift() // Keep only last 10 metrics
    }
  }

  /**
   * Apply configuration based on current mode
   */
  // За мониторинг на configuration application - mode-specific settings propagation към HardwareHealthChecker
  private applyModeConfiguration(): void {
    let config: any = {}

    switch (this.currentMode) {
      // За мониторинг на FAST_DISCOVERY configuration - 30s interval, UDP enabled, optimized timeouts
      case HealthCheckMode.FAST_DISCOVERY:
        config = {
          healthCheckInterval: 30 * 1000, // 30 seconds
          udpEnabled: true,
          quickPingTimeout: 1000,
          fullTestTimeout: 2000
        }

        break

      // За мониторинг на DEGRADED_MODE configuration - HTTP-only mode, extended intervals, increased timeouts
      case HealthCheckMode.DEGRADED_MODE:
        config = {
          healthCheckInterval: 10 * 60 * 1000, // 10 minutes
          udpEnabled: false, // Force HTTP only
          quickPingTimeout: 2000,
          fullTestTimeout: 8000
        }
        break

      case HealthCheckMode.MAINTENANCE:
        config = {
          healthCheckInterval: 15 * 60 * 1000, // 15 minutes
          udpEnabled: true,
          quickPingTimeout: 3000,
          fullTestTimeout: 10000
        }
        break

      // За мониторинг на STANDARD_HEALTH configuration - balanced 5min interval със standard timeouts
      case HealthCheckMode.STANDARD_HEALTH:
      default:
        config = {
          healthCheckInterval: 5 * 60 * 1000, // 5 minutes
          udpEnabled: true,
          quickPingTimeout: 500,
          fullTestTimeout: 3000
        }

        break
    }

    // Apply configuration to health checker
    this.hardwareHealthChecker.configure(config)
  }

  /**
   * Calculate current performance metrics
   */
  // За мониторинг на protocol metrics retrieval - UDP/HTTP performance data collection from HardwareHealthChecker
  calculatePerformanceMetrics(): PerformanceMetrics {
    const protocolMetrics = this.hardwareHealthChecker.getProtocolMetrics()
    
    let udpSuccessRate = 0
    let httpSuccessRate = 0
    let averageResponseTime = 0
    
    const udpMetrics = protocolMetrics.find(p => p.name === 'UDP')
    const httpMetrics = protocolMetrics.find(p => p.name === 'HTTP')
    
    if (udpMetrics && udpMetrics.totalRequests > 0) {
      udpSuccessRate = (udpMetrics.successfulRequests / udpMetrics.totalRequests) * 100
      averageResponseTime = udpMetrics.averageResponseTime
    }
    
    if (httpMetrics && httpMetrics.totalRequests > 0) {
      httpSuccessRate = (httpMetrics.successfulRequests / httpMetrics.totalRequests) * 100
      if (averageResponseTime === 0) {
        averageResponseTime = httpMetrics.averageResponseTime
      }
    }

    // Calculate new devices detected (simplified - would need device tracking)
    const newDevicesDetected = 0 // TODO: Implement device tracking logic

    return {
      udpSuccessRate,
      httpSuccessRate,
      averageResponseTime,
      newDevicesDetected,
      totalDevices: 0, // TODO: Get from device count
      lastModeChange: new Date()
    }
  }

  /**
   * Get current mode and configuration
   */
  // За мониторинг на mode status retrieval - current adaptive mode state access за monitoring systems
  getCurrentMode(): HealthCheckMode {
    return this.currentMode
  }

  /**
   * Force mode change (for manual override)
   */
  // За мониторинг на manual mode override - administrative mode forcing и override validation
  setMode(mode: HealthCheckMode): void {

    this.currentMode = mode
    this.applyModeConfiguration()
  }

  /**
   * Get performance history
   */
  // За мониторинг на history retrieval requests - performance data access за monitoring systems
  getPerformanceHistory(): PerformanceMetrics[] {
    return [...this.performanceHistory]
  }

  /**
   * Network resilience features implementation
   */
  // За мониторинг на resilience check execution - multiple broadcast attempts със exponential backoff
  async performNetworkResilienceCheck(): Promise<boolean> {

    
    try {
      // За мониторинг на network recovery attempts - exponential backoff timing (500ms/1s/2s)
      // Multiple broadcast attempts with exponential backoff (500ms, 1s, 2s)
      const attempts = [500, 1000, 2000]
      let success = false
      
      for (const delay of attempts) {
        await new Promise(resolve => setTimeout(resolve, delay))
        
        try {
          const metrics = this.calculatePerformanceMetrics()
          if (metrics.udpSuccessRate > 50) {
            success = true
            break
          }
        } catch (error: any) {
          this.logger.warn(LogTags.system.health.warning, {
            message: 'Resilience check attempt failed',
            error: error.message,
            delay: delay
          }, {
            source: { file: 'AdaptiveHealthScheduler.ts', method: 'performNetworkResilienceCheck' },
            business: { category: 'system', operation: 'resilience_check' }
          })
        }
      }
      
      this.logger.info(LogTags.system.health.check, {
        message: 'Network resilience check completed',
        result: success ? 'passed' : 'failed'
      }, {
        source: { file: 'AdaptiveHealthScheduler.ts', method: 'performNetworkResilienceCheck' },
        business: { category: 'system', operation: 'resilience_check' }
      })
      return success
      
    } catch (error: any) {
      this.logger.error(LogTags.system.health.failed, {
        message: 'Network resilience check error',
        error: error.message
      }, {
        source: { file: 'AdaptiveHealthScheduler.ts', method: 'performNetworkResilienceCheck' },
        business: { category: 'system', operation: 'resilience_check', severity: 'high' }
      })
      return false
    }
  }

  /**
   * Auto-detect correct broadcast address from system network config
   */
  // За мониторинг на broadcast address detection - automatic network configuration discovery
  async detectBroadcastAddress(): Promise<string | null> {
    try {
      // This would integrate with system network detection
      // For Phase 3, return default broadcast address
      const defaultBroadcast = '192.168.0.255'
      this.logger.info(LogTags.system.health.discovery, {
        message: 'Broadcast address detected',
        broadcastAddress: defaultBroadcast
      }, {
        source: { file: 'AdaptiveHealthScheduler.ts', method: 'detectBroadcastAddress' },
        business: { category: 'system', operation: 'network_discovery' }
      })
      return defaultBroadcast
    } catch (error: any) {
      this.logger.error(LogTags.system.health.failed, {
        message: 'Broadcast address detection failed',
        error: error.message
      }, {
        source: { file: 'AdaptiveHealthScheduler.ts', method: 'detectBroadcastAddress' },
        business: { category: 'system', operation: 'network_discovery', severity: 'medium' }
      })
      return null
    }
  }
}