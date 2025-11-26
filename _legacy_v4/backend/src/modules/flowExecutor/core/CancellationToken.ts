// CancellationToken.ts - Прекъсване на flow execution

export class CancellationToken {
  private cancelled: boolean = false
  private reason?: string

  /**
   * Задава флага за прекъсване
   */
  cancel(reason?: string): void {
    this.cancelled = true
    this.reason = reason
    console.log(`🚩 [CancellationToken] Cancellation requested: ${reason || 'No reason provided'}`)
  }

  /**
   * Проверява дали е зададен флаг за прекъсване
   */
  isCancelled(): boolean {
    return this.cancelled
  }

  /**
   * Получава причината за прекъсване
   */
  getCancellationReason(): string | undefined {
    return this.reason
  }

  /**
   * Рестартира токена (за нова execucation)
   */
  reset(): void {
    this.cancelled = false
    this.reason = undefined
  }

  /**
   * Хвърля грешка ако е прекъснат
   */
  throwIfCancelled(): void {
    if (this.cancelled) {
      throw new Error(`Execution cancelled: ${this.reason || 'Unknown reason'}`)
    }
  }
}