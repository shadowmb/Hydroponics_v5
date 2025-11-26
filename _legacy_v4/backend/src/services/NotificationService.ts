import nodemailer from 'nodemailer'
import { NotificationProvider, INotificationProvider } from '../models/NotificationProvider'
import { NotificationMessage, INotificationMessage } from '../models/NotificationMessage'
import { MonitoringData, IMonitoringData } from '../models/MonitoringData'
import { MonitoringTag, IMonitoringTag } from '../models/MonitoringTag'
import { LifecycleNotificationSettings, ILifecycleNotificationSettings, LifecycleEventType, LIFECYCLE_EVENT_TYPES } from '../models/LifecycleNotificationSettings'
import { UnifiedLoggingService } from './UnifiedLoggingService'
import { LogTags } from '../utils/LogTags'

interface INotificationDeliveryResult {
  success: boolean
  provider: string
  error?: string
  messageId?: string
}

interface INotificationContext {
  messageId: string
  tagData: Array<{
    tagName: string
    value: number | string
    timestamp: Date
    unit?: string
  }>
  timestamp: Date
}

interface ILifecycleNotificationContext {
  eventType: LifecycleEventType
  timestamp: Date
  programName?: string
  cycleId?: string
  executionId?: string
  startTime?: Date
  endTime?: Date
  duration?: string
  expectedEndTime?: Date
  completedTime?: Date
  failureTime?: Date
  errorMessage?: string
  controllerName?: string
  controllerIp?: string
  deviceName?: string
  deviceType?: string
  disconnectTime?: Date
  reconnectTime?: Date
  lastSeen?: Date
  downtime?: string
}

export class NotificationService {
  private static instance: NotificationService
  private emailTransporters: Map<string, nodemailer.Transporter> = new Map()
  private logger = UnifiedLoggingService.createModuleLogger('NotificationService.ts')

  private constructor() {
  }

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  /**
   * Initialize email transporters from active providers
   */
  public async initializeProviders(): Promise<void> {
    // За мониторинг на provider initialization - зареждане и създаване на email transporters от активни providers
    try {
      const emailProviders = await NotificationProvider.find({ 
        type: 'email', 
        isActive: true 
      })

      for (const provider of emailProviders) {
        await this.createEmailTransporter(provider)
      }

      } catch (error: any) {
      this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to initialize notification providers',
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'initializeProviders' },
        business: { category: 'system', operation: 'notification_initialization' }
      })
      throw new Error(`Failed to initialize notification providers: ${error.message}`)
    }
  }

  /**
   * Create email transporter for a provider
   */
  private async createEmailTransporter(provider: INotificationProvider): Promise<void> {
    // За мониторинг на email transporter creation - установяване на SMTP връзки и тестване на provider конфигурации
    try {
      const config = provider.config

      if (!config.host || !config.port || !config.user || !config.password) {
        throw new Error(`Email provider ${provider.name} missing required configuration`)
      }

      const transporter = nodemailer.createTransport({
        host: config.host,
        port: config.port,
        secure: config.secure || false,
        auth: {
          user: config.user,
          pass: config.password
        },
        tls: {
          rejectUnauthorized: false
        }
      })

      // Test connection
      await transporter.verify()
      
      this.emailTransporters.set(provider._id.toString(), transporter)
      

    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to create email transporter',
        providerId: provider._id.toString(),
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'createEmailTransporter' },
        business: { category: 'system', operation: 'email_transporter_creation' }
      })
      throw error
    }
  }

  /**
   * Send periodic notification message
   */
  public async sendPeriodicNotification(messageId: string): Promise<INotificationDeliveryResult[]> {
    // За мониторинг на periodic notifications - изпращане на планирани уведомления с tag data extraction
    try {
      const message = await NotificationMessage.findById(messageId)
      if (!message || !message.isActive) {
        throw new Error(`Notification message ${messageId} not found or inactive`)
      }

      // Get tag data
      const tagData = await this.getTagData(message.tags)
      
      if (tagData.length === 0) {
this.logger.warn(LogTags.system.health.warning, {
          message: 'No tag data found for periodic notification',
          messageId
        }, {
          source: { file: 'NotificationService.ts', method: 'sendPeriodicNotification' },
          business: { category: 'system', operation: 'periodic_notification' }
        })
        return []
      }

      const context: INotificationContext = {
        messageId: message._id.toString(),
        tagData,
        timestamp: new Date()
      }

      // Format notification content
      const subject = `${message.name} - ${new Date().toLocaleString('bg-BG')}`
      const content = this.formatPeriodicMessage(message, context)

      // Send to all delivery methods
      const results: INotificationDeliveryResult[] = []
      
      for (const method of message.deliveryMethods) {
        try {
          if (method === 'email') {
            const result = await this.sendEmailNotification(subject, content)
            results.push(result)
          } else if (method === 'telegram') {
           
            const result = await this.sendTelegramNotification(subject, content)
            results.push(result)
          } else {
            // Future: viber provider
            results.push({
              success: false,
              provider: method,
              error: 'Provider not implemented'
            })
          }
        } catch (error: any) {
          results.push({
            success: false,
            provider: method,
            error: error.message
          })
        }
      }

      // Update last sent timestamp
      await NotificationMessage.findByIdAndUpdate(messageId, {
        lastSent: new Date()
      })

// INFO log removed - periodic notification success is not critical information

      return results
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to send periodic notification',
        messageId,
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'sendPeriodicNotification' },
        business: { category: 'system', operation: 'periodic_notification' }
      })
      throw error
    }
  }

  /**
   * Send custom error notification from ErrorHandler
   */
  public async sendCustomErrorNotification(
    sourceBlockId: string,
    sourceBlockType: string,
    userMessage: string,
    contextData?: any,
    deliveryMethods: string[] = ['email']
  ): Promise<INotificationDeliveryResult[]> {
    // За мониторинг на custom error notifications - грешкови съобщения от ErrorHandler блокове с context information
    try {
      const subject = `Custom Error Notification - ${sourceBlockType}`
      const content = this.formatCustomErrorMessage(sourceBlockId, sourceBlockType, userMessage, contextData)

      const results: INotificationDeliveryResult[] = []
      
      for (const method of deliveryMethods) {
        try {
          if (method === 'email') {
            const result = await this.sendEmailNotification(subject, content)
            results.push(result)
          } else if (method === 'telegram') {
            const telegramContent = this.formatCustomErrorMessageTelegram(sourceBlockId, sourceBlockType, userMessage, contextData)
            const result = await this.sendTelegramNotification(subject, telegramContent)
            results.push(result)
          } else {
            results.push({
              success: false,
              provider: method,
              error: 'Provider not implemented'
            })
          }
        } catch (error: any) {
          results.push({
            success: false,
            provider: method,
            error: error.message
          })
        }
      }

// INFO log removed - notification success is not critical information

      return results
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to send custom error notification',
        sourceBlockId,
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'sendCustomErrorNotification' },
        business: { category: 'system', operation: 'error_notification' }
      })
      throw error
    }
  }

  /**
   * Send error notification
   */
  public async sendErrorNotification(
    blockId: string,
    blockType: string,
    errorMessage: string,
    deliveryMethods: string[] = ['email']
  ): Promise<INotificationDeliveryResult[]> {
    // За мониторинг на standard error notifications - flow execution грешки с block details
    try {
      const subject = `Flow Execution Error - Block ${blockType}`
      const content = this.formatErrorMessage(blockId, blockType, errorMessage)

      const results: INotificationDeliveryResult[] = []
      
      for (const method of deliveryMethods) {
        try {
          if (method === 'email') {
            const result = await this.sendEmailNotification(subject, content)
            results.push(result)
          } else if (method === 'telegram') {

            const telegramContent = this.formatErrorMessageTelegram(blockId, blockType, errorMessage)
            const result = await this.sendTelegramNotification(subject, telegramContent)
            results.push(result)
          } else {
            results.push({
              success: false,
              provider: method,
              error: 'Provider not implemented'
            })
          }
        } catch (error: any) {
          results.push({
            success: false,
            provider: method,
            error: error.message
          })
        }
      }

// INFO log removed - error notification success is not critical information

      return results
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to send error notification',
        blockId,
        blockType,
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'sendErrorNotification' },
        business: { category: 'system', operation: 'error_notification' }
      })
      throw error
    }
  }

  /**
   * Send email notification using first available email provider
   */
  private async sendEmailNotification(subject: string, content: string): Promise<INotificationDeliveryResult> {
    // За мониторинг на email delivery - SMTP изпращане с failover logic между множество providers
    const emailProviders = await NotificationProvider.find({ 
      type: 'email', 
      isActive: true 
    })

    if (emailProviders.length === 0) {
      throw new Error('No active email providers found')
    }

    for (const provider of emailProviders) {
      const transporterId = provider._id.toString()
      const transporter = this.emailTransporters.get(transporterId)
      
      if (!transporter) {
        await this.createEmailTransporter(provider)
        continue
      }

      try {
        const mailOptions = {
          from: provider.config.from || provider.config.user,
          to: provider.config.to,
          subject,
          html: content
        }

        const info = await transporter.sendMail(mailOptions)
        
        return {
          success: true,
          provider: `email-${provider.name}`,
          messageId: info.messageId
        }
      } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
          message: 'Failed to send email notification',
          providerId: provider._id.toString(),
          error: error.message
        }, {
          source: { file: 'NotificationService.ts', method: 'sendEmailNotification' },
          business: { category: 'system', operation: 'email_delivery' }
        })
        continue
      }
    }

    throw new Error('All email providers failed')
  }

  /**
   * Send telegram notification using first available telegram provider
   */
  private async sendTelegramNotification(subject: string, content: string): Promise<INotificationDeliveryResult> {

    
    const telegramProviders = await NotificationProvider.find({ 
      type: 'telegram', 
      isActive: true 
    })

// INFO log removed - telegram providers count is not critical information

    if (telegramProviders.length === 0) {
      throw new Error('No active telegram providers found')
    }

    for (const provider of telegramProviders) {
      try {
        const { botToken, chatId } = provider.config
        
        if (!botToken || !chatId) {
this.logger.error(LogTags.system.startup.failed, {
            message: 'Telegram provider missing configuration',
            providerId: provider._id.toString(),
            error: 'Missing botToken or chatId configuration'
          }, {
            source: { file: 'NotificationService.ts', method: 'sendTelegramNotification' },
            business: { category: 'system', operation: 'telegram_delivery' }
          })
          continue
        }

        // Clean bot token (remove 'bot' prefix if present)
        const cleanToken = botToken.startsWith('bot') ? botToken.substring(3) : botToken
        
        // Format message for Telegram
        const telegramMessage = content
        
        // Prepare form data
        const params = new URLSearchParams()
        params.append('chat_id', chatId)
        params.append('text', telegramMessage)

        // Send to Telegram API
        const url = `https://api.telegram.org/bot${cleanToken}/sendMessage`
        
// INFO log removed - telegram attempt details are not critical information

        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params
        })

        const result = await response.json() as any

        if (response.ok && result.ok) {
          return {
            success: true,
            provider: `telegram-${provider.name}`,
            messageId: result.result.message_id.toString()
          }
        } else {
this.logger.error(LogTags.system.startup.failed, {
            message: 'Telegram API error',
            providerId: provider._id.toString(),
            httpStatus: response.status,
            error: result.description || 'Unknown Telegram API error'
          }, {
            source: { file: 'NotificationService.ts', method: 'sendTelegramNotification' },
            business: { category: 'system', operation: 'telegram_delivery' }
          })
          continue
        }
      } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
          message: 'Failed to send telegram notification',
          providerId: provider._id.toString(),
          error: error.message
        }, {
          source: { file: 'NotificationService.ts', method: 'sendTelegramNotification' },
          business: { category: 'system', operation: 'telegram_delivery' }
        })
        continue
      }
    }

    throw new Error('All telegram providers failed')
  }

  /**
   * Convert HTML content to Telegram-friendly format
   */
  private htmlToTelegram(html: string): string {
    // Simple HTML to Telegram markdown conversion
    return html
      .replace(/<h[1-6][^>]*>(.*?)<\/h[1-6]>/gi, '*$1*')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '*$1*')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '*$1*')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '_$1_')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '_$1_')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<hr[^>]*>/gi, '---')
      .replace(/<p[^>]*>(.*?)<\/p>/gi, '$1\n')
      .replace(/<div[^>]*>(.*?)<\/div>/gi, '$1\n')
      .replace(/<[^>]+>/g, '') // Remove remaining HTML tags
      .replace(/\n\n+/g, '\n\n') // Clean up multiple newlines
      .trim()
  }

  /**
   * Get current tag data for notification
   */
  private async getTagData(tagNames: string[]): Promise<Array<{
    tagName: string
    value: number | string
    timestamp: Date
    unit?: string
  }>> {
    // За мониторинг на tag data retrieval - извличане на monitoring data за периодични съобщения
    const tagData: Array<{
      tagName: string
      value: number | string
      timestamp: Date
      unit?: string
    }> = []

    for (const tagName of tagNames) {
      try {
        const tag = await MonitoringTag.findOne({ name: tagName, isActive: true })
        if (!tag) {
this.logger.warn(LogTags.system.health.warning, {
            message: 'Monitoring tag not found',
            tagName
          }, {
            source: { file: 'NotificationService.ts', method: 'getTagData' },
            business: { category: 'system', operation: 'tag_data_retrieval' }
          })
          continue
        }

        const latestData = await MonitoringData.findOne({ tagId: tag._id })
          .sort({ timestamp: -1 })
          .limit(1)

        if (latestData) {
          tagData.push({
            tagName,
            value: latestData.value,
            timestamp: latestData.timestamp,
            unit: this.getTagUnit(tagName)
          })
        }
      } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
          message: 'Failed to get tag data',
          tagName,
          error: error.message
        }, {
          source: { file: 'NotificationService.ts', method: 'getTagData' },
          business: { category: 'system', operation: 'tag_data_retrieval' }
        })
      }
    }

    return tagData
  }

  /**
   * Format periodic message content
   */

  /*
  private formatPeriodicMessage(message: INotificationMessage, context: INotificationContext): string {
    const tagRows = context.tagData.map(tag => `
      <tr>
        <td style="padding: 8px; border: 1px solid #ddd;">${tag.tagName}</td>
        <td style="padding: 8px; border: 1px solid #ddd; text-align: right;">
          ${typeof tag.value === 'number' ? tag.value.toFixed(2) : tag.value}
          ${tag.unit ? ` ${tag.unit}` : ''}
        </td>
        <td style="padding: 8px; border: 1px solid #ddd;">${tag.timestamp.toLocaleString('bg-BG')}</td>
      </tr>
    `).join('')

    return `
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <h2 style="color: #2c5aa0;">${message.name}</h2>
          
          ${message.description ? `<p style="color: #666; margin-bottom: 20px;">${message.description}</p>` : ''}
          
          <table style="border-collapse: collapse; width: 100%; margin-bottom: 20px;">
            <thead>
              <tr style="background-color: #f5f5f5;">
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Параметър</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Стойност</th>
                <th style="padding: 10px; border: 1px solid #ddd; text-align: left;">Време</th>
              </tr>
            </thead>
            <tbody>
              ${tagRows}
            </tbody>
          </table>
          
          <hr style="margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            Генерирано автоматично от Hydroponics v4 система<br>
            Време на изпращане: ${context.timestamp.toLocaleString('bg-BG')}
          </p>
        </body>
      </html>
    `
  }
    */

  /**
 * Format periodic message content for Telegram
 */
  private formatPeriodicMessage(message: INotificationMessage, context: INotificationContext): string {
    // За мониторинг на message formatting - конвертиране между HTML, plain text и Telegram формати
    // Създаване на редове за всеки таг
    const tagRows = context.tagData.map(tag => {
      // Форматиране на стойността на тага (с 2 знака след запетаята за числа)
      const value = typeof tag.value === 'number' ? tag.value.toFixed(2) : tag.value;
      // Включване на мерна единица, ако има такава
      const unit = tag.unit ? ` ${tag.unit}` : '';

     // Форматиране на времето
      //const timestamp = tag.timestamp.toLocaleString('bg-BG');
      
      // Форматиране на един ред за таг
      return `${tag.tagName} : ${value}${unit}`;
    }).join('\n\n'); // Съединяване на всички редове с празен ред между тях

    // Създаване на цялостното съобщение
    const fullMessage = `
      ---\n
      ${tagRows}\n
      ---`;

        return fullMessage;
  }

  /**
   * Format custom error message content from ErrorHandler
   */
  private formatCustomErrorMessage(sourceBlockId: string, sourceBlockType: string, userMessage: string, contextData?: any): string {
    const contextSection = contextData ? `
          <div style="background-color: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">📊 Block Context Data:</h3>
            <pre style="background: white; padding: 10px; border-radius: 4px; overflow-x: auto; font-size: 12px;">${JSON.stringify(contextData, null, 2)}</pre>
          </div>
    ` : ''

    return `
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <h2 style="color: #1976d2;">🔔 Custom Error Notification</h2>
          
          <div style="background-color: #fff3e0; border-left: 4px solid #ff9800; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #f57c00;">💬 User Message:</h3>
            <p style="font-size: 16px; font-weight: 500;">${userMessage}</p>
          </div>
          
          <div style="background-color: #f3e5f5; border-left: 4px solid #9c27b0; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #7b1fa2;">🎯 Source Block:</h3>
            <p><strong>Block ID:</strong> ${sourceBlockId}</p>
            <p><strong>Block Type:</strong> ${sourceBlockType}</p>
          </div>
          
          ${contextSection}
          
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString('bg-BG')}</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            Генерирано от ErrorHandler блок в Hydroponics v4 система
          </p>
        </body>
      </html>
    `
  }

  /**
   * Format error message content for Telegram (plain text)
   */
  private formatErrorMessageTelegram(blockId: string, blockType: string, errorMessage: string): string {
    return `🚨 Грешка в ${blockType} блок

      Block ID: ${blockId}
      Block Type: ${blockType}
      Съобщение: ${errorMessage}
      Време: ${new Date().toLocaleString('bg-BG')}

      Генерирано автоматично от Hydroponics v4 система`
  }

  /**
   * Format custom error message content for Telegram (plain text)
   */
  private formatCustomErrorMessageTelegram(sourceBlockId: string, sourceBlockType: string, userMessage: string, contextData?: any): string {
    let message = `🔔 Custom Error Notification

      💬 User Message:
      ${userMessage}

      🎯 Source Block:
      Block ID: ${sourceBlockId}
      Block Type: ${sourceBlockType}`

          if (contextData) {
            message += `

      📊 Block Context Data:`
            
            if (contextData.parameters) {
              message += `\nПараметри:`
              for (const [key, value] of Object.entries(contextData.parameters)) {
                const displayValue = value || '(празно)'
                message += `\n- ${key}: ${displayValue}`
              }
            }
            
            if (contextData.error) {
              message += `\nГрешка:`
              message += `\n- Type: ${contextData.error.type}`
              message += `\n- Severity: ${contextData.error.severity}`
              message += `\n- Message: ${contextData.error.message}`
            }
          }

          message += `

      Време: ${new Date().toLocaleString('bg-BG')}

      Генерирано от ErrorHandler блок в Hydroponics v4 система`

          return message
  }

  /**
   * Format error message content for Email (HTML)
   */
  private formatErrorMessage(blockId: string, blockType: string, errorMessage: string): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <h2 style="color: #d32f2f;">🚨 Flow Execution Error</h2>
          
          <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #d32f2f;">Error Details:</h3>
            <p><strong>Block ID:</strong> ${blockId}</p>
            <p><strong>Block Type:</strong> ${blockType}</p>
            <p><strong>Error Message:</strong> ${errorMessage}</p>
          </div>
          
          <p><strong>Timestamp:</strong> ${new Date().toLocaleString('bg-BG')}</p>
          
          <hr style="margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            Генерирано автоматично от Hydroponics v4 система
          </p>
        </body>
      </html>
    `
  }

  /**
   * Get unit for tag name (basic mapping)
   */
  private getTagUnit(tagName: string): string | undefined {
    const unitMap: Record<string, string> = {
      'temp': '°C',
      'temperature': '°C',
      'ph': 'pH',
      'pH': 'pH',
      'humidity': '%',
      'pressure': 'kPa',
      'level': 'cm',
      'distance': 'cm'
    }

    return unitMap[tagName.toLowerCase()]
  }

  /**
   * Send template-based error notification with custom message
   */
  public async sendTemplateErrorNotification(
    blockId: string,
    blockType: string,
    errorMessage: string,
    deliveryMethods: string[] = ['email'],
    messageTemplate: string
  ): Promise<INotificationDeliveryResult[]> {
    // За мониторинг на template error notifications - template-based съобщения с placeholder processing
    try {
      // Replace placeholders in template
      const processedTemplate = this.processTemplate(messageTemplate, {
        blockId,
        blockType,
        errorMessage,
        timestamp: new Date().toLocaleString('bg-BG')
      })

      const subject = `Flow Execution Error - ${blockType}`
      const results: INotificationDeliveryResult[] = []
      
      for (const method of deliveryMethods) {
        try {
          if (method === 'email') {
            const htmlContent = this.formatTemplateErrorMessage(subject, processedTemplate)
            const result = await this.sendEmailNotification(subject, htmlContent)
            results.push(result)
          } else if (method === 'telegram') {
            const telegramContent = processedTemplate
            const result = await this.sendTelegramNotification(subject, telegramContent)
            results.push(result)
          } else {
            results.push({
              success: false,
              provider: method,
              error: 'Provider not implemented'
            })
          }
        } catch (error: any) {
          results.push({
            success: false,
            provider: method,
            error: error.message
          })
        }
      }

  
      return results
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to send template error notification',
        blockId,
        blockType,
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'sendTemplateErrorNotification' },
        business: { category: 'system', operation: 'template_error_notification' }
      })
      throw error
    }
  }

  /**
   * Process template with placeholders
   */
  private processTemplate(template: string, placeholders: Record<string, string>): string {
    // За мониторинг на template processing - placeholder заместване в custom съобщения
    let processedTemplate = template
    for (const [key, value] of Object.entries(placeholders)) {
      const placeholder = `{{${key}}}`
      processedTemplate = processedTemplate.replace(new RegExp(placeholder, 'g'), value)
    }
    return processedTemplate
  }

  /**
   * Format template-based error message for email
   */
  private formatTemplateErrorMessage(subject: string, content: string): string {
    return `
      <html>
        <head>
          <meta charset="UTF-8">
        </head>
        <body style="font-family: Arial, sans-serif; margin: 20px;">
          <h2 style="color: #d32f2f;">🔔 ${subject}</h2>
          
          <div style="background-color: #ffebee; border-left: 4px solid #d32f2f; padding: 15px; margin: 20px 0;">
            <pre style="white-space: pre-wrap; margin: 0;">${content}</pre>
          </div>
          
          <hr style="margin: 20px 0;">
          <p style="color: #888; font-size: 12px;">
            Генерирано автоматично от Hydroponics v4 система
          </p>
        </body>
      </html>
    `
  }

  /**
   * Test email provider configuration
   */
  public async testEmailProvider(providerId: string): Promise<boolean> {
    // За мониторинг на provider testing - email provider configuration validation
    try {
      const provider = await NotificationProvider.findById(providerId)
      if (!provider || provider.type !== 'email') {
        throw new Error('Email provider not found')
      }

      await this.createEmailTransporter(provider)
      
      // Send test email
      const result = await this.sendEmailNotification(
        'Hydroponics v4 - Test Email',
        '<p>This is a test email from your Hydroponics v4 notification system.</p>'
      )

      return result.success
    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to test email provider',
        providerId,
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'testEmailProvider' },
        business: { category: 'system', operation: 'email_provider_testing' }
      })
      return false
    }
  }

  /**
   * Send lifecycle notification
   */
  public async sendLifecycleNotification(
    eventType: LifecycleEventType,
    context: Partial<ILifecycleNotificationContext>
  ): Promise<INotificationDeliveryResult[]> {
    // За мониторинг на lifecycle notifications - изпращане на lifecycle event notifications с template processing
    try {
      // Get lifecycle notification settings
      const settings = await LifecycleNotificationSettings.getSettings()
      const eventSetting = (settings as any).getEventSetting(eventType)

      if (!eventSetting || !eventSetting.enabled) {
this.logger.debug(LogTags.flow.execute.started, {
          message: 'Lifecycle notification disabled',
          eventType
        }, {
          source: { file: 'NotificationService.ts', method: 'sendLifecycleNotification' },
          business: { category: 'system', operation: 'lifecycle_notification' }
        })
        return []
      }

      // Check rate limiting (simple implementation - could be enhanced with Redis)
      const rateLimitKey = `lifecycle_${eventType}`
      // Note: In production, implement proper rate limiting with Redis or similar
      
      // Build notification context
      const notificationContext: ILifecycleNotificationContext = {
        eventType,
        timestamp: new Date(),
        ...context
      }

      // Process message template with context data
      const message = this.processLifecycleTemplate(eventSetting.messageTemplate, notificationContext)
      const subject = this.getLifecycleSubject(eventType, notificationContext)

      // Send notifications through configured delivery methods
      const deliveryResults: INotificationDeliveryResult[] = []

      for (const method of eventSetting.deliveryMethods) {
        try {
          let result: INotificationDeliveryResult

          if (method === 'email') {
            result = await this.sendEmailNotification(subject, message)
          } else if (method === 'telegram') {
            result = await this.sendTelegramNotification(subject, message)
          } else {
            result = {
              success: false,
              provider: method,
              error: 'Unsupported delivery method'
            }
          }

          deliveryResults.push(result)
        } catch (error: any) {
          deliveryResults.push({
            success: false,
            provider: method,
            error: error.message
          })
        }
      }

    

      return deliveryResults

    } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
        message: 'Failed to send lifecycle notification',
        eventType,
        error: error.message
      }, {
        source: { file: 'NotificationService.ts', method: 'sendLifecycleNotification' },
        business: { category: 'system', operation: 'lifecycle_notification' }
      })
      throw error
    }
  }

  /**
   * Process lifecycle template with context data
   */
  private processLifecycleTemplate(template: string, context: ILifecycleNotificationContext): string {
    let processedTemplate = template

    // Replace all template variables
    const templateVars = {
      eventType: context.eventType,
      timestamp: context.timestamp?.toLocaleString('bg-BG'),
      programName: context.programName || 'Неизвестна програма',
      cycleId: context.cycleId || 'Неизвестен цикъл',
      executionId: context.executionId || 'Неизвестно изпълнение',
      startTime: context.startTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      endTime: context.endTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      duration: context.duration || 'Неизвестна продължителност',
      expectedEndTime: context.expectedEndTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      completedTime: context.completedTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      failureTime: context.failureTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      errorMessage: context.errorMessage || 'Неизвестна грешка',
      controllerName: context.controllerName || 'Неизвестен контролер',
      controllerIp: context.controllerIp || 'Неизвестен IP',
      deviceName: context.deviceName || 'Неизвестно устройство',
      deviceType: context.deviceType || 'Неизвестен тип',
      disconnectTime: context.disconnectTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      reconnectTime: context.reconnectTime?.toLocaleString('bg-BG') || 'Неизвестно време',
      lastSeen: context.lastSeen?.toLocaleString('bg-BG') || 'Неизвестно време',
      downtime: context.downtime || 'Неизвестна продължителност'
    }

    // Replace template variables
    for (const [key, value] of Object.entries(templateVars)) {
      const regex = new RegExp(`{{${key}}}`, 'g')
      processedTemplate = processedTemplate.replace(regex, String(value))
    }

    return processedTemplate
  }

  /**
   * Generate subject for lifecycle notification
   */
  private getLifecycleSubject(eventType: LifecycleEventType, context: ILifecycleNotificationContext): string {
    const baseSubject = 'Hydroponics v4 - '
    
    switch (eventType) {
      case LIFECYCLE_EVENT_TYPES.CYCLE_START:
        return `${baseSubject}Стартиран цикъл: ${context.programName}`
      case LIFECYCLE_EVENT_TYPES.CYCLE_SUCCESS:
        return `${baseSubject}Завършен цикъл: ${context.programName}`
      case LIFECYCLE_EVENT_TYPES.CYCLE_FAILURE:
        return `${baseSubject}Неуспешен цикъл: ${context.programName}`
      case LIFECYCLE_EVENT_TYPES.CONTROLLER_DISCONNECT:
        return `${baseSubject}Контролер изгуби връзка: ${context.controllerName}`
      case LIFECYCLE_EVENT_TYPES.CONTROLLER_RECONNECT:
        return `${baseSubject}Контролер възстановен: ${context.controllerName}`
      case LIFECYCLE_EVENT_TYPES.SENSOR_DISCONNECT:
        return `${baseSubject}Сензор изгуби връзка: ${context.deviceName}`
      case LIFECYCLE_EVENT_TYPES.SENSOR_RECONNECT:
        return `${baseSubject}Сензор възстановен: ${context.deviceName}`
      default:
        return `${baseSubject}Lifecycle Event: ${eventType}`
    }
  }

  /**
   * Get lifecycle notification settings
   */
  public async getLifecycleSettings(): Promise<ILifecycleNotificationSettings> {
    return await LifecycleNotificationSettings.getSettings()
  }

  /**
   * Update lifecycle notification settings
   */
  public async updateLifecycleSettings(
    updates: Partial<ILifecycleNotificationSettings>
  ): Promise<ILifecycleNotificationSettings> {
    const settings = await LifecycleNotificationSettings.getSettings()
    
    if (updates.globalSettings) {
      Object.assign(settings.globalSettings, updates.globalSettings)
    }
    
    if (updates.eventSettings) {
      // Handle both Map (from database) and Object (from frontend JSON)
      if (updates.eventSettings instanceof Map) {
        for (const [eventType, eventSetting] of updates.eventSettings) {
          settings.eventSettings.set(eventType, eventSetting)
        }
      } else {
        // Handle plain JavaScript object from frontend
        for (const [eventType, eventSetting] of Object.entries(updates.eventSettings)) {
          settings.eventSettings.set(eventType, eventSetting as any)
        }
      }
    }
    
    await settings.save()
    return settings
  }

  /**
   * Cleanup resources
   */
  public async cleanup(): Promise<void> {
    // За мониторинг на resource cleanup - затваряне на transporters и освобождаване на връзки

    
    // Close all email transporters
    for (const [providerId, transporter] of this.emailTransporters) {
      try {
        transporter.close()
 
      } catch (error: any) {
this.logger.error(LogTags.system.startup.failed, {
          message: 'Failed to cleanup email transporter',
          providerId,
          error: error.message
        }, {
          source: { file: 'NotificationService.ts', method: 'cleanup' },
          business: { category: 'system', operation: 'resource_cleanup' }
        })
      }
    }

    this.emailTransporters.clear()
   }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()