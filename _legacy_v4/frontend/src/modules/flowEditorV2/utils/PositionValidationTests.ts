/**
 * 📦 FlowEditor v3 - Position Validation Tests
 * ✅ Част от основната редакторна система
 * Debug utilities за тестване на coordinate alignment
 * Последна проверка: 2025-01-26
 */

import type { BlockInstance } from '../types/BlockConcept';
import { StablePortPositioning } from './StablePortPositioning';
import { StableCoordinateTransform } from './StableCoordinateTransform';
import { PortPositionManager } from './PortPositionManager';
import type { PortType, PortDirection } from '../types/PortPosition';
// ❌ Legacy import removed - using adapter now
// import { BlockFactory } from '../core/blocks/legacy-BlockFactory';

export interface ZoomTestResult {
  zoom: number;
  blockId: string;
  portId: string;
  type: 'input' | 'output';
  calculated: { x: number; y: number };
  screenTransformed: { x: number; y: number };
  domRect?: DOMRect;
  aligned: boolean;
  offset: { x: number; y: number };
}

export interface ValidationReport {
  testName: string;
  zoomLevels: number[];
  results: ZoomTestResult[];
  summary: {
    totalTests: number;
    passedTests: number;
    failedTests: number;
    averageOffset: { x: number; y: number };
    maxOffset: { x: number; y: number };
  };
}

/**
 * Position Validation Test Suite
 */
export class PositionValidationTests {
  
  /**
   * Test coordinate alignment at multiple zoom levels
   */
  static async testZoomLevels(
    blocks: BlockInstance[],
    zoomLevels: number[] = [0.25, 0.5, 0.75, 1.0, 1.25, 1.5, 2.0],
    panOffset: { x: number; y: number } = { x: 0, y: 0 }
  ): Promise<ValidationReport> {
    
    const results: ZoomTestResult[] = [];
    
    for (const zoom of zoomLevels) {
      
      for (const block of blocks) {
        // Test first few ports of each block
        const inputPorts = this.getBlockInputPorts(block).slice(0, 2);
        const outputPorts = this.getBlockOutputPorts(block).slice(0, 2);
        
        // Test input ports
        for (const port of inputPorts) {
          const result = this.testPortAtZoom(block, port.id, 'input', zoom, panOffset);
          results.push(result);
        }
        
        // Test output ports
        for (const port of outputPorts) {
          const result = this.testPortAtZoom(block, port.id, 'output', zoom, panOffset);
          results.push(result);
        }
      }
    }
    
    const summary = this.generateSummary(results);
    
    const report: ValidationReport = {
      testName: 'Zoom Level Coordinate Alignment Test',
      zoomLevels,
      results,
      summary
    };
    
    this.logReport(report);
    return report;
  }
  
  /**
   * Test a specific port at a specific zoom level
   */
  private static testPortAtZoom(
    block: BlockInstance,
    portId: string,
    type: 'input' | 'output',
    zoom: number,
    panOffset: { x: number; y: number }
  ): ZoomTestResult {
    // ✅ CENTRALIZED: Get port type and use PortPositionManager
    const definition = BlockFactory.getDefinition(block.definitionId);
    const portDefs = type === 'input' ? definition?.inputs : definition?.outputs;
    const portDef = portDefs?.find(p => p.id === portId);
    const portType = portDef ? (Array.isArray(portDef.type) ? portDef.type[0] : portDef.type) : 'logic';
    
    // ✅ CENTRALIZED: Use PortPositionManager for coordinate calculation
    const calculated = PortPositionManager.calculateCanvasCoordinates(
      block.position,
      portType,
      type as PortDirection,
      portId
    );
    
    // Simulate screen transformation (what the browser would show)
    const screenTransformed = {
      x: (calculated.x + panOffset.x) * zoom,
      y: (calculated.y + panOffset.y) * zoom
    };
    
    // Try to get actual DOM rect if element exists
    let domRect: DOMRect | undefined;
    const portElement = document.querySelector(`[data-port-id="port-${block.id}-${portId}"]`);
    if (portElement) {
      domRect = portElement.getBoundingClientRect();
    }
    
    // Calculate offset between calculated and actual positions
    const offset = domRect ? {
      x: calculated.x - ((domRect.left + domRect.width/2) / zoom),
      y: calculated.y - ((domRect.top + domRect.height/2) / zoom)
    } : { x: 0, y: 0 };
    
    // Check if positions are aligned (within 5px tolerance)
    const aligned = Math.abs(offset.x) < 5 && Math.abs(offset.y) < 5;
    
    return {
      zoom,
      blockId: block.id,
      portId,
      type,
      calculated,
      screenTransformed,
      domRect,
      aligned,
      offset
    };
  }
  
  /**
   * Test magnetic zone accuracy during drag operations
   */
  static async testMagneticZoneAccuracy(
    blocks: BlockInstance[],
    magneticRadius: number = 30
  ): Promise<ValidationReport> {
    
    const results: ZoomTestResult[] = [];
    const testZooms = [0.5, 1.0, 1.5, 2.0];
    
    for (const zoom of testZooms) {
      for (const block of blocks) {
        const ports = [
          ...this.getBlockInputPorts(block).map(p => ({ ...p, type: 'input' as const })),
          ...this.getBlockOutputPorts(block).map(p => ({ ...p, type: 'output' as const }))
        ];
        
        for (const port of ports) {
          const result = this.testMagneticZone(block, port.id, port.type, zoom, magneticRadius);
          results.push(result);
        }
      }
    }
    
    const summary = this.generateSummary(results);
    
    const report: ValidationReport = {
      testName: 'Magnetic Zone Accuracy Test',
      zoomLevels: testZooms,
      results,
      summary
    };
    
    this.logReport(report);
    return report;
  }
  
  /**
   * Test magnetic zone for a specific port
   */
  private static testMagneticZone(
    block: BlockInstance,
    portId: string,
    type: 'input' | 'output',
    zoom: number,
    magneticRadius: number
  ): ZoomTestResult {
    // ✅ CENTRALIZED: Get port type and use PortPositionManager
    const definition = BlockFactory.getDefinition(block.definitionId);
    const portDefs = type === 'input' ? definition?.inputs : definition?.outputs;
    const portDef = portDefs?.find(p => p.id === portId);
    const portType = portDef ? (Array.isArray(portDef.type) ? portDef.type[0] : portDef.type) : 'logic';
    
    // ✅ CENTRALIZED: Use PortPositionManager for coordinate calculation
    const calculated = PortPositionManager.calculateCanvasCoordinates(
      block.position,
      portType,
      type as PortDirection,
      portId
    );
    
    // Get DOM element to compare with visual position
    const portElement = document.querySelector(`[data-port-id="port-${block.id}-${portId}"]`);
    let domRect: DOMRect | undefined;
    let offset = { x: 0, y: 0 };
    let aligned = true;
    
    if (portElement) {
      domRect = portElement.getBoundingClientRect();
      const canvasContainer = document.querySelector('.flow-canvas-container');
      
      if (canvasContainer) {
        const canvasRect = canvasContainer.getBoundingClientRect();
        
        // Calculate actual port position from DOM
        const actualPortCenter = {
          x: (domRect.left + domRect.width/2 - canvasRect.left) / zoom,
          y: (domRect.top + domRect.height/2 - canvasRect.top) / zoom
        };
        
        offset = {
          x: calculated.x - actualPortCenter.x,
          y: calculated.y - actualPortCenter.y
        };
        
        // Check if magnetic zone would be accurate (within magneticRadius)
        const distance = Math.sqrt(offset.x ** 2 + offset.y ** 2);
        aligned = distance < magneticRadius / 4; // Allow small tolerance
      }
    }
    
    return {
      zoom,
      blockId: block.id,
      portId,
      type,
      calculated,
      screenTransformed: {
        x: calculated.x * zoom,
        y: calculated.y * zoom
      },
      domRect,
      aligned,
      offset
    };
  }
  
  /**
   * Generate test summary statistics
   */
  private static generateSummary(results: ZoomTestResult[]) {
    const totalTests = results.length;
    const passedTests = results.filter(r => r.aligned).length;
    const failedTests = totalTests - passedTests;
    
    // Calculate average offset
    const avgX = results.reduce((sum, r) => sum + Math.abs(r.offset.x), 0) / totalTests;
    const avgY = results.reduce((sum, r) => sum + Math.abs(r.offset.y), 0) / totalTests;
    
    // Calculate maximum offset
    const maxX = Math.max(...results.map(r => Math.abs(r.offset.x)));
    const maxY = Math.max(...results.map(r => Math.abs(r.offset.y)));
    
    return {
      totalTests,
      passedTests,
      failedTests,
      averageOffset: { x: avgX, y: avgY },
      maxOffset: { x: maxX, y: maxY }
    };
  }
  
  /**
   * Log comprehensive test report
   */
  private static logReport(report: ValidationReport) {
    // TODO: IMPLEMENT_LATER - Add comprehensive test report logging
    const failedTests = report.results.filter(r => !r.aligned);
    // TODO: IMPLEMENT_LATER - Log failed test details
  }
  
  /**
   * Helper: Get input ports for a block
   */
  private static getBlockInputPorts(block: BlockInstance) {
    // ✅ CENTRALIZED: Use BlockFactory to get actual port definitions
    const definition = BlockFactory.getDefinition(block.definitionId);
    return definition?.inputs || [];
  }
  
  /**
   * Helper: Get output ports for a block
   */
  private static getBlockOutputPorts(block: BlockInstance) {
    // ✅ CENTRALIZED: Use BlockFactory to get actual port definitions  
    const definition = BlockFactory.getDefinition(block.definitionId);
    return definition?.outputs || [];
  }
  
  /**
   * Run comprehensive validation test suite
   */
  static async runFullValidationSuite(blocks: BlockInstance[]): Promise<ValidationReport[]> {
    // TODO: IMPLEMENT_LATER - Add comprehensive validation suite logging
    const reports: ValidationReport[] = [];
    
    // Test 1: Zoom level alignment
    const zoomReport = await this.testZoomLevels(blocks);
    reports.push(zoomReport);
    
    // Test 2: Magnetic zone accuracy
    const magneticReport = await this.testMagneticZoneAccuracy(blocks);
    reports.push(magneticReport);
    
    // Overall summary
    const totalTests = reports.reduce((sum, r) => sum + r.summary.totalTests, 0);
    const totalPassed = reports.reduce((sum, r) => sum + r.summary.passedTests, 0);
    const overallSuccessRate = (totalPassed / totalTests * 100).toFixed(1);
    
    
    return reports;
  }
}

/**
 * Quick test function for manual console use
 */
export function testCoordinateAlignment(blocks?: BlockInstance[]) {
  // Use test blocks if none provided
  const testBlocks = blocks || [{
    id: 'test-block-1',
    definitionId: 'test-sensor',
    position: { x: 100, y: 100 },
    parameters: {},
    connections: { inputs: {}, outputs: {} },
    meta: {}
  }];
  
  return PositionValidationTests.runFullValidationSuite(testBlocks);
}