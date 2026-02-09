import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics'
import { isNative } from './platform'

export async function impactLight() {
    if (!isNative()) return
    await Haptics.impact({ style: ImpactStyle.Light })
}

export async function impactMedium() {
    if (!isNative()) return
    await Haptics.impact({ style: ImpactStyle.Medium })
}

export async function impactHeavy() {
    if (!isNative()) return
    await Haptics.impact({ style: ImpactStyle.Heavy })
}

export async function notificationSuccess() {
    if (!isNative()) return
    await Haptics.notification({ type: NotificationType.Success })
}

export async function notificationWarning() {
    if (!isNative()) return
    await Haptics.notification({ type: NotificationType.Warning })
}

export async function notificationError() {
    if (!isNative()) return
    await Haptics.notification({ type: NotificationType.Error })
}

export async function selectionFeedback() {
    if (!isNative()) return
    await Haptics.selectionStart()
    await Haptics.selectionChanged()
    await Haptics.selectionEnd()
}
