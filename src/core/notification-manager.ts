import type {
  NotificationConfig,
  NotificationMessage,
  NotificationResult,
  NotificationChannel,
  NotificationEvent
} from '../types'
import { Logger } from './logger'

/**
 * 通知管理器
 * 
 * 支持多渠道通知（Slack、钉钉、企业微信、邮件等）
 */
export class NotificationManager {
  private logger: Logger
  private config: NotificationConfig

  constructor(config: NotificationConfig) {
    this.config = config
    this.logger = new Logger('NotificationManager')
  }

  /**
   * 发送通知
   */
  async notify(message: NotificationMessage): Promise<NotificationResult[]> {
    // 检查是否应该发送此事件的通知
    if (!this.shouldNotify(message)) {
      this.logger.debug(`跳过通知: ${message.title}`)
      return []
    }

    const results: NotificationResult[] = []

    for (const channel of this.config.channels) {
      try {
        await this.sendToChannel(channel, message)
        results.push({
          channel,
          success: true,
          timestamp: Date.now()
        })
      } catch (error) {
        this.logger.error(`发送通知失败 [${channel}]:`, error)
        results.push({
          channel,
          success: false,
          error: error instanceof Error ? error.message : String(error),
          timestamp: Date.now()
        })
      }
    }

    return results
  }

  /**
   * 判断是否应该发送通知
   */
  private shouldNotify(message: NotificationMessage): boolean {
    // 检查事件类型
    if (!this.config.events.includes(message.event)) {
      return false
    }

    // 检查通知级别
    const levelPriority = { info: 0, warning: 1, error: 2, critical: 3 }
    const configPriority = {
      all: 0,
      warning: 1,
      error: 2,
      critical: 3
    }

    return levelPriority[message.level] >= configPriority[this.config.level]
  }

  /**
   * 发送到指定渠道
   */
  private async sendToChannel(channel: NotificationChannel, message: NotificationMessage): Promise<void> {
    switch (channel) {
      case 'slack':
        await this.sendToSlack(message)
        break
      case 'dingtalk':
        await this.sendToDingTalk(message)
        break
      case 'wecom':
        await this.sendToWeCom(message)
        break
      case 'email':
        await this.sendEmail(message)
        break
      case 'webhook':
        await this.sendToWebhook(message)
        break
      default:
        throw new Error(`不支持的通知渠道: ${channel}`)
    }
  }

  private async sendToSlack(message: NotificationMessage): Promise<void> {
    const webhookUrl = process.env.SLACK_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('未配置 SLACK_WEBHOOK_URL')
    }

    const payload = {
      text: message.title,
      blocks: [
        {
          type: 'header',
          text: {
            type: 'plain_text',
            text: message.title
          }
        },
        {
          type: 'section',
          text: {
            type: 'mrkdwn',
            text: message.content
          }
        }
      ]
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private async sendToDingTalk(message: NotificationMessage): Promise<void> {
    const webhookUrl = process.env.DINGTALK_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('未配置 DINGTALK_WEBHOOK_URL')
    }

    const payload = {
      msgtype: 'markdown',
      markdown: {
        title: message.title,
        text: `### ${message.title}\n\n${message.content}`
      }
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private async sendToWeCom(message: NotificationMessage): Promise<void> {
    const webhookUrl = process.env.WECOM_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('未配置 WECOM_WEBHOOK_URL')
    }

    const payload = {
      msgtype: 'markdown',
      markdown: {
        content: `# ${message.title}\n\n${message.content}`
      }
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
  }

  private async sendEmail(message: NotificationMessage): Promise<void> {
    // 这里需要集成邮件服务（如 nodemailer）
    this.logger.warn('邮件通知功能尚未实现')
  }

  private async sendToWebhook(message: NotificationMessage): Promise<void> {
    const webhookUrl = process.env.CUSTOM_WEBHOOK_URL
    if (!webhookUrl) {
      throw new Error('未配置 CUSTOM_WEBHOOK_URL')
    }

    await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  }
}
