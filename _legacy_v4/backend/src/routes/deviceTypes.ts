import { Router, Request, Response } from 'express'

const router = Router()

// Static device types - no database dependency
const DEVICE_TYPES = [
  // Actuators - Управляеми устройства
  { key: 'pump', label: 'Помпа', isActive: true },
  { key: 'valve', label: 'Клапан/Вентил', isActive: true },
  { key: 'fan', label: 'Вентилатор', isActive: true },
  { key: 'heater', label: 'Нагревател', isActive: true },
  { key: 'light', label: 'Осветление', isActive: true },
  { key: 'mixer', label: 'Миксер/Разбъркватель', isActive: true },
  
  // Sensors - Сензори
  { key: 'temp_sensor', label: 'Температурен сензор', isActive: true },
  { key: 'humidity_sensor', label: 'Сензор за влажност', isActive: true },
  { key: 'ph_sensor', label: 'pH сензор', isActive: true },
  { key: 'ec_sensor', label: 'EC/TDS сензор', isActive: true },
  { key: 'level_sensor', label: 'Сензор за ниво', isActive: true },
  { key: 'flow_sensor', label: 'Дебитомер', isActive: true },
  
  // Multi-function - Специални
  { key: 'relay_module', label: 'Релейно реле', isActive: true },
  { key: 'controller_board', label: 'Управляваща платка', isActive: true }
]

// GET /api/settings/device-types - Get all device types
router.get('/device-types', (req: Request, res: Response) => {
  try {
    let types = DEVICE_TYPES.filter(type => type.isActive)
    
    // Filter by category if specified
    const { category } = req.query
    if (category === 'actuators') {
      // Only actuators - exclude sensors
      types = types.filter(type => !type.key.includes('_sensor'))
    } else if (category === 'sensors') {
      // Only sensors
      types = types.filter(type => type.key.includes('_sensor'))
    }
    // If no category specified, return all types
    
    res.json(types)
  } catch (error) {
    console.error('Error fetching device types:', error)
    res.status(500).json({ error: 'Failed to fetch device types' })
  }
})

export default router