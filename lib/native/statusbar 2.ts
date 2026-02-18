import { StatusBar, Style } from '@capacitor/status-bar'
import { isNative } from './platform'

export async function setDarkStatusBar() {
    if (!isNative()) return
    await StatusBar.setStyle({ style: Style.Dark })
    await StatusBar.setBackgroundColor({ color: '#09090b' })
}

export async function setLightStatusBar() {
    if (!isNative()) return
    await StatusBar.setStyle({ style: Style.Light })
    await StatusBar.setBackgroundColor({ color: '#ffffff' })
}

export async function hideStatusBar() {
    if (!isNative()) return
    await StatusBar.hide()
}

export async function showStatusBar() {
    if (!isNative()) return
    await StatusBar.show()
}
