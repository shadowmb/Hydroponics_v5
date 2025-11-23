import { automation } from './modules/automation/AutomationEngine';
import { logger } from './core/LoggerService';

console.log('Automation Engine loaded:', !!automation);
logger.info('Simple verification passed');
