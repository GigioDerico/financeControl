# FinControl - Capacitor Hybrid App

## Visão Geral

O FinControl foi convertido de uma aplicação web Next.js (SSR) para uma aplicação híbrida
usando **Capacitor 8**, permitindo distribuição nas lojas Apple App Store e Google Play Store
enquanto mantém a base de código web existente.

## Arquitetura

```
Next.js (Static Export) → Capacitor WebView → iOS / Android Nativo
                              ↓
                    lib/native/* (abstração)
                              ↓
               Capacitor Plugins (Camera, Push, Biometric, etc.)
```

## Fases Implementadas

### FASE 1 ✅ — Export Estático
- `next.config.mjs`: `output: 'export'`, `trailingSlash: true`
- Auth callback: SSR route → client-side page com Suspense
- Middleware removido (auth guard é client-side)
- API routes removidos (funcionalidade em Edge Functions)

### FASE 2 ✅ — Setup Capacitor
- Capacitor 8 + iOS + Android
- 9 plugins nativos configurados
- `capacitor.config.ts` com SplashScreen, StatusBar, Camera, Push, Biometric

### FASE 3 ✅ — Camada Nativa (`lib/native/`)
| Serviço | Arquivo | Descrição |
|---------|---------|-----------|
| Plataforma | `platform.ts` | Detecção iOS/Android/Web |
| Push | `push.ts` | Registro + listeners |
| Câmera | `camera.ts` | Foto + galeria |
| Biometria | `biometrics.ts` | Face ID / Touch ID |
| Haptics | `haptics.ts` | Feedback tátil |
| Network | `network.ts` | Status + listener |
| Status Bar | `statusbar.ts` | Dark/light theme |
| Index | `index.ts` | Barrel exports |

### FASE 4 ✅ — Push Notifications
- **Database**: `device_tokens`, `notification_log`, `notification_preferences`
- **Edge Function**: `send-push-notifications`
  - `register-token`: Registra token do dispositivo
  - `check-upcoming`: Busca e notifica cobranças próximas
  - `mark-read`: Marca notificação como lida
- **Hook**: `use-push-notifications.ts` — auto-registro no login
- **Tipos**: vencimento_hoje, lembrete_cobranca, cobranca_atrasada

### FASE 5 ✅ — Câmera / Comprovantes
- **Database**: coluna `comprovante_url` em `transacoes`
- **Storage**: bucket `comprovantes` no Supabase
- **Componente**: `ComprovanteCapture` (câmera + galeria + upload)
- **Integração**: NovaTransacaoDialog com botões Câmera/Galeria

### FASE 6 ✅ — Biometria
- **Hook**: `use-biometric-auth.ts` — estado locked/unlocked
- **Componente**: `BiometricLockScreen` — tela de desbloqueio
- **Fluxo Login**: Pergunta se quer ativar biometria após login
- **Fluxo App**: Lock screen antes do AppShell se biometria ativa

### FASE 7 ✅ — Polimento Nativo
- Safe area insets (notch, home indicator)
- Android back button handler
- Deep link routing para OAuth
- App state change listener
- PWA meta tags (apple-mobile-web-app)
- Viewport-fit: cover

## Scripts Disponíveis

```bash
pnpm cap:build       # Build estático + Capacitor sync
pnpm cap:sync        # Apenas sync (copia out/ para nativos)
pnpm cap:open:ios    # Abrir projeto no Xcode
pnpm cap:open:android # Abrir projeto no Android Studio
pnpm cap:run:ios     # Build + run no simulador iOS
pnpm cap:run:android # Build + run no emulador Android
```

## Configuração Necessária para Produção

### Firebase Cloud Messaging (Push Notifications)
1. Criar projeto no [Firebase Console](https://console.firebase.google.com)
2. Adicionar app iOS e Android
3. Baixar `google-services.json` → `android/app/`
4. Baixar `GoogleService-Info.plist` → `ios/App/App/`
5. Obter Server Key e adicionar como secret no Supabase:
   ```
   FCM_SERVER_KEY=<your-server-key>
   ```

### Apple Developer (iOS)
1. Ativar Push Notifications no App ID
2. Criar APNs Key
3. Fazer upload da key no Firebase Console
4. Configurar provisioning profiles

### Google Play (Android)
1. Gerar keystore de release
2. Configurar signing no `android/app/build.gradle`
3. Criar listing na Google Play Console

### Supabase Cron (Notificações Automáticas)
Configurar cron job para chamar a Edge Function diariamente:
```sql
SELECT cron.schedule(
  'check-upcoming-bills',
  '0 9 * * *',  -- Todos os dias às 9h
  $$
  SELECT net.http_post(
    url := 'https://xieboheswpzlwatwnwdp.supabase.co/functions/v1/send-push-notifications?action=check-upcoming',
    headers := '{"Authorization": "Bearer <SERVICE_ROLE_KEY>"}'::jsonb
  );
  $$
);
```

## Estrutura de Arquivos

```
├── android/                  # Projeto Android nativo
├── ios/                      # Projeto iOS nativo
├── out/                      # Build estático (gerado)
├── capacitor.config.ts       # Configuração Capacitor
├── lib/native/               # Abstração de serviços nativos
│   ├── platform.ts
│   ├── push.ts
│   ├── camera.ts
│   ├── biometrics.ts
│   ├── haptics.ts
│   ├── network.ts
│   ├── statusbar.ts
│   └── index.ts
├── hooks/
│   ├── use-push-notifications.ts
│   ├── use-biometric-auth.ts
│   └── use-native-lifecycle.ts
└── components/ui/
    ├── comprovante-capture.tsx
    └── biometric-lock-screen.tsx
```
