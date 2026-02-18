import { Network } from '@capacitor/network'
import { isNative } from './platform'

export interface NetworkStatus {
    connected: boolean
    connectionType: string
}

export async function getNetworkStatus(): Promise<NetworkStatus> {
    if (!isNative()) {
        return { connected: navigator.onLine, connectionType: 'wifi' }
    }

    const status = await Network.getStatus()
    return {
        connected: status.connected,
        connectionType: status.connectionType,
    }
}

export function onNetworkChange(callback: (status: NetworkStatus) => void) {
    if (!isNative()) {
        // Web fallback
        const handler = () => callback({ connected: navigator.onLine, connectionType: navigator.onLine ? 'wifi' : 'none' })
        window.addEventListener('online', handler)
        window.addEventListener('offline', handler)
        return () => {
            window.removeEventListener('online', handler)
            window.removeEventListener('offline', handler)
        }
    }

    const listener = Network.addListener('networkStatusChange', (status) => {
        callback({
            connected: status.connected,
            connectionType: status.connectionType,
        })
    })

    return () => {
        listener.then(l => l.remove())
    }
}
