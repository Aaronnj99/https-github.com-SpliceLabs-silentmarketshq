import notifier from 'node-notifier'
import path from 'path'

interface NotificationOptions {
  title: string
  message: string
  sound?: boolean
  wait?: boolean
}

export function sendDesktopNotification(options: NotificationOptions): void {
  try {
    notifier.notify({
      title: options.title,
      message: options.message,
      sound: options.sound ?? true,
      wait: options.wait ?? false,
      icon: path.join(process.cwd(), 'public', 'apex-icon.png'),
    })
  } catch (error) {
    // Notifications may not be available in all environments
    console.error('Notification failed:', error)
  }
}

export function sendAlertNotification(
  coin: string,
  condition: 'above' | 'below',
  targetPrice: number,
  currentPrice: number
): void {
  const direction = condition === 'above' ? 'surpassed' : 'dropped below'
  const formatPrice = (p: number) =>
    p >= 1000 ? `$${p.toLocaleString('en-US', { maximumFractionDigits: 0 })}` : `$${p.toFixed(4)}`

  sendDesktopNotification({
    title: `APEX Alert: ${coin}`,
    message: `${coin} has ${direction} ${formatPrice(targetPrice)}. Current price: ${formatPrice(currentPrice)}`,
    sound: true,
  })
}

export function sendReminderNotification(title: string, description?: string): void {
  sendDesktopNotification({
    title: `APEX Reminder: ${title}`,
    message: description ?? 'You have a reminder due.',
    sound: true,
  })
}
