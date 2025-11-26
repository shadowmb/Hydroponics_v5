// ABOUTME: Structured logging tag definitions for semantic categorization
// ABOUTME: Provides hierarchical tags using pattern category:action:detail for business-context aware logging

/**
 * Structured logging tags using pattern: category:action:detail
 * Enables semantic filtering and business-context aware logging
 */
export const LogTags = {
  device: {
    connect: {
      success: 'device:connect:success',
      failed: 'device:connect:failed',
      timeout: 'device:connect:timeout'
    },
    health: {
      online: 'device:health:online',
      offline: 'device:health:offline',
      warning: 'device:health:warning'
    },
    command: {
      sent: 'device:command:sent',
      success: 'device:command:success',
      failed: 'device:command:failed',
      started: 'device.command.started',
      template: 'device.command.template',
      legacy: 'device.command.legacy'
    },
    
  },

  sensor: {
    range: {
      normal: 'sensor:range:normal',
      warning: 'sensor:range:warning',
      critical: 'sensor:range:critical'
    },
    validation: {
      started: 'sensor:validation:started',
      passed: 'sensor:validation:passed',
      failed: 'sensor:validation:failed'
    },
    calibration: {
      started: 'sensor:calibration:started',
      completed: 'sensor:calibration:completed',
      failed: 'sensor:calibration:failed'
    }
  },

  flow: {
    execute: {
      started: 'flow:execute:started',
      completed: 'flow:execute:completed',
      failed: 'flow:execute:failed'
    },
    validate: {
      passed: 'flow:validate:passed',
      failed: 'flow:validate:failed'
    },
    block: {
      started: 'flow:block:started',
      completed: 'flow:block:completed',
      failed: 'flow:block:failed'
    }
  },

  system: {
    startup: {
      started: 'system:startup:started',
      completed: 'system:startup:completed',
      failed: 'system:startup:failed'
    },
    health: {
      check: 'system:health:check',
      warning: 'system:health:warning',
      critical: 'system:health:critical',
      discovery: 'system.health.discovery',
      failed: 'system.health.failed'
    },
    recovery: {
      started: 'system:recovery:started',
      completed: 'system:recovery:completed',
      failed: 'system:recovery:failed'
    },
    shutdown:{
    started: 'system.shutdown.started',
    completed: 'system.shutdown.completed',
    failed: 'system.shutdown.failed'
    }
  },

  controller: {
    connect: {
      success: 'controller:connect:success',
      failed: 'controller:connect:failed'
    },
    discovery: {
      found: 'controller:discovery:found',
      lost: 'controller:discovery:lost',
      failed: 'controller.discovery.failed'
      
    },
    health: {
      online: 'controller:health:online',
      offline: 'controller:health:offline'
    },
    disconnect:{
      success: 'controller.disconnect.success',
      failed: 'controller.disconnect.failed',
      started: 'controller.disconnect.started'
    }
  },

  network: {
    discovery: {
      started: 'network:discovery:started',
      completed: 'network:discovery:completed',
      failed: 'network:discovery:failed'
    },
    udp: {
      success: 'network:udp:success',
      timeout: 'network:udp:timeout'
    }
  },

  database: {
    connect: {
      started: 'database:connect:started',
      success: 'database:connect:success',
      failed: 'database:connect:failed',
      retry: 'database:connect:retry'
    },
    health: {
      connected: 'database:health:connected',
      disconnected: 'database:health:disconnected',
      timeout: 'database:health:timeout',
      critical: 'database:health:critical'
    }
  }
} as const

/**
 * Helper type for tag validation
 */
export type LogTag = typeof LogTags[keyof typeof LogTags][keyof typeof LogTags[keyof typeof LogTags]][keyof typeof LogTags[keyof typeof LogTags][keyof typeof LogTags[keyof typeof LogTags]]]

/**
 * Helper functions for tag construction
 */
export const LogTagHelpers = {
  /**
   * Get all tags for a specific category
   */
  getTagsForCategory(category: keyof typeof LogTags): string[] {
    const categoryTags = LogTags[category]
    const tags: string[] = []

    Object.values(categoryTags).forEach(actionGroup => {
      Object.values(actionGroup).forEach(tag => {
        if (typeof tag === 'string') {
          tags.push(tag)
        }
      })
    })

    return tags
  },

  /**
   * Check if a tag belongs to a specific category
   */
  isTagInCategory(tag: string, category: keyof typeof LogTags): boolean {
    return tag.startsWith(`${category}:`)
  },

  /**
   * Parse tag components
   */
  parseTag(tag: string): { category: string; action: string; detail: string } | null {
    const parts = tag.split(':')
    if (parts.length !== 3) return null

    return {
      category: parts[0],
      action: parts[1],
      detail: parts[2]
    }
  }
}