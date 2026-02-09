import { PushNotifications } from '@capacitor/push-notifications'
import { isNative } from './platform'

export interface PushToken {
    value: string
}

export async function requestPushPermission(): Promise<boolean> {
    if (!isNative()) return false

    const result = await PushNotifications.requestPermissions()
    return result.receive === 'granted'
}

export async function registerPush(): Promise<PushToken | null> {
    if (!isNative()) return null

    const permission = await requestPushPermission()
    if (!permission) return null

    await PushNotifications.register()

    return new Promise((resolve) => {
        PushNotifications.addListener('registration', (token) => {
            resolve({ value: token.value })
        })

        PushNotifications.addListener('registrationError', () => {
            resolve(null)
        })
    })
}

export function onPushReceived(callback: (notification: { title?: string; body?: string; data?: Record<string, unknown> }) => void) {
    if (!isNative()) return

    PushNotifications.addListener('pushNotificationReceived', (notification) => {
        callback({
            title: notification.title ?? undefined,
            body: notification.body ?? undefined,
            data: notification.data as Record<string, unknown>,
        })
    })
}

export function onPushTapped(callback: (data: Record<string, unknown>) => void) {
    if (!isNative()) return

    PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        callback(action.notification.data as Record<string, unknown>)
    })
}

export async function removeAllListeners() {
    if (!isNative()) return
    await PushNotifications.removeAllListeners()
}
