// ABOUTME: Seed data for Arduino command file management
// ABOUTME: Contains initial command metadata for device template execution strategies

import { Command } from '../models/Command'

/**
 * Seed data for initial Arduino commands
 * Contains metadata about available command implementations
 */
export const commandSeeds = [
  // Analog Read Command
  {
    name: 'ANALOG',
    displayName: 'Analog Read',
    filePath: 'Arduino/templates/commands/analog.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Read analog value from a specified analog pin (A0-A5)',
    isActive: true,
    memoryFootprint: null
  },

  // Read All Analog Pins Command
  {
    name: 'ANALOG_ALL',
    displayName: 'Read All Analog Pins',
    filePath: 'Arduino/templates/commands/analog_all.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Read analog values from all analog pins simultaneously',
    isActive: true,
    memoryFootprint: null
  },

  // Pulse Measure Command
  {
    name: 'PULSE_MEASURE',
    displayName: 'Pulse Measure',
    filePath: 'Arduino/templates/commands/pulse_measure.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Measure pulse duration for ultrasonic sensors and similar devices',
    isActive: true,
    memoryFootprint: null
  },

  // Set Digital Pin Command
  {
    name: 'SET_PIN',
    displayName: 'Set Digital Pin',
    filePath: 'Arduino/templates/commands/set_pin.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Set a digital pin to HIGH or LOW state',
    isActive: true,
    memoryFootprint: null
  },

  // Read Digital Pin Command
  {
    name: 'READ',
    displayName: 'Read Digital Pin',
    filePath: 'Arduino/templates/commands/read.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Read the current state of a digital pin',
    isActive: true,
    memoryFootprint: null
  },

  // Batch Set Pins Command
  {
    name: 'BATCH',
    displayName: 'Batch Set Pins',
    filePath: 'Arduino/templates/commands/batch.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Set multiple digital pins in a single command',
    isActive: true,
    memoryFootprint: null
  },

  // Set All Digital Pins Command
  {
    name: 'SET_ALL',
    displayName: 'Set All Digital Pins',
    filePath: 'Arduino/templates/commands/set_all.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Set all digital pins to a specific state simultaneously',
    isActive: true,
    memoryFootprint: null
  },

  // Single Wire Pulse Protocol Command
  {
    name: 'SINGLE_WIRE_PULSE',
    displayName: 'Single Wire Pulse Protocol',
    filePath: 'Arduino/templates/commands/single_wire_pulse.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Single wire pulse-based communication protocol for sensors like DHT22',
    isActive: true,
    memoryFootprint: null
  },

  // Single Wire OneWire Protocol Command
  {
    name: 'SINGLE_WIRE_ONEWIRE',
    displayName: 'Single Wire OneWire Protocol',
    filePath: 'Arduino/templates/commands/single_wire_onewire.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'OneWire protocol implementation for devices like DS18B20 temperature sensor',
    isActive: true,
    memoryFootprint: null
  },

  // Pulse Count Command
  {
    name: 'PULSE_COUNT',
    displayName: 'Pulse Count',
    filePath: 'Arduino/templates/commands/pulse_count.ino',
    compatibleControllers: ['arduino_uno'],
    description: 'Count pulses over a measurement period for flow sensors and similar devices',
    isActive: true,
    memoryFootprint: null
  },

  // Modbus RTU Read Command
  {
    name: 'MODBUS_RTU_READ',
    displayName: 'Modbus RTU Read',
    filePath: 'Arduino/templates/commands/modbus_rtu_read.ino',
    compatibleControllers: ['arduino_uno', 'wemos_d1'],
    description: 'Read Modbus RTU registers via UART (SoftwareSerial) with CRC16 validation',
    isActive: true,
    memoryFootprint: 1024
  },

  // UART Stream Read Command
  {
    name: 'UART_STREAM_READ',
    displayName: 'UART Stream Read',
    filePath: 'Arduino/templates/commands/uart_stream_read.ino',
    compatibleControllers: ['arduino_uno', 'wemos_d1'],
    description: 'Read continuous stream data via UART (SoftwareSerial) with checksum validation',
    isActive: true,
    memoryFootprint: 512
  }
]

/**
 * Seed commands into database using upsert approach
 * Updates existing commands and creates new ones automatically
 */
export async function seedCommands(): Promise<void> {
  try {
    console.log('[Command] Starting command seeding with upsert...')

    let createdCount = 0
    let updatedCount = 0

    // Upsert each command (update if exists, create if not)
    for (const seedCommand of commandSeeds) {
      const result = await Command.findOneAndUpdate(
        { name: seedCommand.name }, // Find by unique name
        seedCommand,                 // Update with seed data
        {
          upsert: true,             // Create if doesn't exist
          new: true,                // Return updated document
          runValidators: true       // Run schema validators
        }
      )

      // Track if this was a creation or update
      const existingDoc = await Command.findOne({ name: seedCommand.name })
      if (result && !existingDoc) {
        createdCount++
        console.log(`  + Created: ${seedCommand.displayName} (${seedCommand.name})`)
      } else {
        updatedCount++
        console.log(`  ↻ Updated: ${seedCommand.displayName} (${seedCommand.name})`)
      }
    }

    console.log(`[Command] Seeding completed: ${createdCount} created, ${updatedCount} updated`)

  } catch (error) {
    console.error('[Command] Error seeding commands:', error)
    throw error
  }
}

export default commandSeeds
