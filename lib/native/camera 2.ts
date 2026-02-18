import { Camera, CameraResultType, CameraSource } from '@capacitor/camera'
import { isNative } from './platform'

export interface CapturedPhoto {
    dataUrl: string
    format: string
}

export async function takePhoto(): Promise<CapturedPhoto | null> {
    try {
        const image = await Camera.getPhoto({
            quality: 80,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Camera,
            width: 1200,
            height: 1600,
            correctOrientation: true,
        })

        if (image.dataUrl) {
            return { dataUrl: image.dataUrl, format: image.format }
        }
        return null
    } catch {
        return null
    }
}

export async function pickFromGallery(): Promise<CapturedPhoto | null> {
    try {
        const image = await Camera.getPhoto({
            quality: 80,
            allowEditing: false,
            resultType: CameraResultType.DataUrl,
            source: CameraSource.Photos,
            width: 1200,
            height: 1600,
            correctOrientation: true,
        })

        if (image.dataUrl) {
            return { dataUrl: image.dataUrl, format: image.format }
        }
        return null
    } catch {
        return null
    }
}

export async function checkCameraPermission(): Promise<boolean> {
    if (!isNative()) return true // Web handles its own permission
    const status = await Camera.checkPermissions()
    return status.camera === 'granted'
}
