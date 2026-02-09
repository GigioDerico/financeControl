import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.fincontrol.app',
  appName: 'FinControl',
  webDir: 'out',
  server: {
    // Allow navigation to Supabase OAuth callbacks
    allowNavigation: ['*.supabase.co'],
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 2000,
      launchAutoHide: true,
      backgroundColor: '#09090b', // zinc-950
      showSpinner: true,
      spinnerColor: '#10b981', // emerald-500
      androidScaleType: 'CENTER_CROP',
      splashFullScreen: true,
      splashImmersive: true,
    },
    StatusBar: {
      style: 'DARK', // Light text on dark background
      backgroundColor: '#09090b',
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
    Camera: {
      // iOS permissions
      permissions: {
        camera: 'Precisamos da câmera para fotografar comprovantes e recibos.',
        photos: 'Precisamos acessar suas fotos para anexar comprovantes.',
      },
    },
  },
};

export default config;
