import { NativeBiometric, BiometryType } from 'capacitor-native-biometric'
import { isNative } from './platform'

export interface BiometricStatus {
    available: boolean
    biometryType: 'face' | 'fingerprint' | 'iris' | 'none'
}

export async function checkBiometric(): Promise<BiometricStatus> {
    if (!isNative()) {
        return { available: false, biometryType: 'none' }
    }

    try {
        const result = await NativeBiometric.isAvailable()

        let biometryType: BiometricStatus['biometryType'] = 'none'
        switch (result.biometryType) {
            case BiometryType.FACE_ID:
            case BiometryType.FACE_AUTHENTICATION:
                biometryType = 'face'
                break
            case BiometryType.TOUCH_ID:
            case BiometryType.FINGERPRINT:
                biometryType = 'fingerprint'
                break
            case BiometryType.IRIS_AUTHENTICATION:
                biometryType = 'iris'
                break
        }

        return { available: result.isAvailable, biometryType }
    } catch {
        return { available: false, biometryType: 'none' }
    }
}

export async function authenticate(reason?: string): Promise<boolean> {
    if (!isNative()) return true // Web: skip biometric

    try {
        await NativeBiometric.verifyIdentity({
            reason: reason ?? 'Confirme sua identidade para acessar o FinControl',
            title: 'FinControl',
            subtitle: 'Autenticação Biométrica',
            description: 'Use sua biometria para desbloquear',
        })
        return true
    } catch {
        return false
    }
}

export async function saveCredentials(server: string, username: string, password: string) {
    if (!isNative()) return
    await NativeBiometric.setCredentials({ server, username, password })
}

export async function getCredentials(server: string) {
    if (!isNative()) return null
    try {
        return await NativeBiometric.getCredentials({ server })
    } catch {
        return null
    }
}

export async function deleteCredentials(server: string) {
    if (!isNative()) return
    await NativeBiometric.deleteCredentials({ server })
}
