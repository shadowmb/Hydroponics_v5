/**
 * 📦 FlowEditor v3 - Version Comparison Utilities
 * ✅ Utilities for semantic version comparison and flow versioning
 * Created: 2025-08-08
 */

/**
 * Compare two semantic versions
 * @param version1 First version (e.g., "1.2.3")
 * @param version2 Second version (e.g., "1.2.4")
 * @returns -1 if v1 < v2, 0 if equal, 1 if v1 > v2
 */
export function compareVersions(version1: string, version2: string): number {
  const v1Parts = version1.split('.').map(Number);
  const v2Parts = version2.split('.').map(Number);
  
  // Ensure both have 3 parts
  while (v1Parts.length < 3) v1Parts.push(0);
  while (v2Parts.length < 3) v2Parts.push(0);
  
  for (let i = 0; i < 3; i++) {
    if (v1Parts[i] < v2Parts[i]) return -1;
    if (v1Parts[i] > v2Parts[i]) return 1;
  }
  
  return 0;
}

/**
 * Check if a version is newer than another
 */
export function isNewerVersion(newVersion: string, currentVersion: string): boolean {
  return compareVersions(newVersion, currentVersion) > 0;
}

/**
 * Check if a version is valid semantic version
 */
export function isValidVersion(version: string): boolean {
  return /^\d+\.\d+\.\d+$/.test(version);
}

/**
 * Increment version by type
 */
export function incrementVersion(currentVersion: string, type: 'major' | 'minor' | 'patch'): string {
  if (!isValidVersion(currentVersion)) {
    throw new Error('Invalid version format');
  }
  
  const [major, minor, patch] = currentVersion.split('.').map(Number);
  
  switch (type) {
    case 'major':
      return `${major + 1}.0.0`;
    case 'minor':
      return `${major}.${minor + 1}.0`;
    case 'patch':
      return `${major}.${minor}.${patch + 1}`;
    default:
      throw new Error('Invalid increment type');
  }
}

/**
 * Generate version ID from flowId and version
 */
export function generateVersionId(flowId: string, version: string): string {
  const versionParts = version.replace(/\./g, '_');
  return `${flowId}_v${versionParts}`;
}

/**
 * Generate unique flow ID
 */
export function generateFlowId(baseName?: string): string {
  const timestamp = Date.now();
  const base = baseName ? baseName.toLowerCase().replace(/\s+/g, '_') : 'flow';
  return `${base}_${timestamp}`;
}

/**
 * Parse version ID back to flowId and version
 */
export function parseVersionId(versionId: string): { flowId: string; version: string } | null {
  const match = versionId.match(/^(.+)_v(\d+)_(\d+)_(\d+)$/);
  if (!match) return null;
  
  const [, flowId, major, minor, patch] = match;
  return {
    flowId,
    version: `${major}.${minor}.${patch}`
  };
}

/**
 * Get default version for new flows
 */
export function getDefaultFlowVersion(): string {
  return '1.0.0';
}

/**
 * Check if flow has version information
 */
export function hasVersionInfo(flowMeta: any): boolean {
  return !!(flowMeta.flowId && flowMeta.flowVersion);
}