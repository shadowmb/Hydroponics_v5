/**
 * Controller Adapter Factory
 * 
 * Factory pattern implementation for creating appropriate adapters
 * based on controller communication type.
 */

import { IControllerAdapter, IControllerAdapterFactory, IConnectionResult } from './IControllerAdapter'
import { IPhysicalController } from '../models/PhysicalController'
import { SerialControllerAdapter } from './SerialControllerAdapter'
import { HttpControllerAdapter } from './HttpControllerAdapter'

export class ControllerAdapterFactory implements IControllerAdapterFactory {
  
  private static instance: ControllerAdapterFactory
  
  public static getInstance(): ControllerAdapterFactory {
    // За мониторинг на singleton instance management - factory instance creation и reuse coordination
    if (!ControllerAdapterFactory.instance) {
      ControllerAdapterFactory.instance = new ControllerAdapterFactory()
    }
    return ControllerAdapterFactory.instance
  }

  async createAdapter(
    controllerId: string, 
    controller: IPhysicalController
  ): Promise<IControllerAdapter> {
    // За мониторинг на adapter creation operations - protocol-based adapter instantiation
    
    const protocol = controller.communicationType
    
    switch (protocol) {
      case 'raw_serial':
        // За мониторинг на serial adapter creation - SerialControllerAdapter instantiation за UART communication
        return new SerialControllerAdapter(controllerId, controller)
      
      case 'http':
        // За мониторинг на HTTP adapter creation - HttpControllerAdapter instantiation за REST API communication
        return new HttpControllerAdapter(controllerId, controller)
      
      case 'mqtt':
        // За мониторинг на future protocol expansion - MQTT adapter development preparation
        // TODO: Future implementation
        throw new Error(`MQTT adapter not yet implemented for controller ${controllerId}`)
      
      case 'websocket':
        // За мониторинг на future protocol expansion - WebSocket adapter development preparation
        // TODO: Future implementation  
        throw new Error(`WebSocket adapter not yet implemented for controller ${controllerId}`)
      
      default:
        // За мониторинг на unsupported protocol handling - error handling за future protocol implementations
        throw new Error(`Unsupported communication type: ${protocol} for controller ${controllerId}`)
    }
  }

  getSupportedProtocols(): string[] {
    // За мониторинг на protocol support management - supported protocol listing за configuration validation
    return [
      'raw_serial',
      'http'
      // 'mqtt',     // TODO: Future implementation
      // 'websocket' // TODO: Future implementation
    ]
  }

  isProtocolSupported(protocol: string): boolean {
    // За мониторинг на protocol validation - supported protocol checking и configuration validation
    return this.getSupportedProtocols().includes(protocol)
  }
}