# 📱 Plano: Conversão para App Híbrido com Capacitor

> **Status:** Em planejamento
> **Branch:** `staging` → Criar `feature/capacitor-hybrid`
> **Plataformas:** iOS + Android
> **Publicação:** App Store + Google Play Store

---

## 📋 Resumo Executivo

Converter o app **FinControl** (Next.js) em um app híbrido usando **Capacitor** para:
- ✅ Push Notifications (lembrança de cobranças)
- ✅ Câmera (escanear recibos/comprovantes)
- ✅ Biometria (Face ID / Touch ID / Fingerprint)
- ✅ Status Bar nativa
- ✅ Splash Screen nativa
- ✅ App Icon personalizado
- ✅ Haptic Feedback
- ✅ Armazenamento seguro (tokens)
- ✅ Deep Linking

---

## 🛠 Stack Técnico

| Componente        | Tecnologia               |
|-------------------|--------------------------|
| **Web Framework** | Next.js 16 (SSG Export)  |
| **Container**     | Capacitor 7              |
| **Push**          | @capacitor/push-notifications + Firebase (Android) + APNs (iOS) |
| **Câmera**        | @capacitor/camera         |
| **Biometria**     | capacitor-native-biometric |
| **Storage**       | @capacitor/preferences (config) + @capacitor/secure-storage (tokens) |
| **Status Bar**    | @capacitor/status-bar     |
| **Splash Screen** | @capacitor/splash-screen  |
| **Haptics**       | @capacitor/haptics        |
| **App**           | @capacitor/app (deep link, back button) |
| **Network**       | @capacitor/network        |

---

## 🔢 Fases de Implementação

### FASE 1: Preparação do Next.js para Export Estático 🔧
> **Objetivo:** Adaptar o Next.js para gerar output estático (`next export`) compatível com Capacitor

**Tarefas:**
1. [ ] Configurar `next.config.mjs` com `output: 'export'`
2. [ ] Substituir middleware SSR por guards client-side (já existe parcialmente)
3. [ ] Converter `app/auth/callback/route.ts` para handler client-side
4. [ ] Verificar que todas as rotas API são chamadas externas (Supabase Edge Functions)
5. [ ] Testar `next build` gerando pasta `out/`
6. [ ] Ajustar paths relativos se necessário

**Ponto de Atenção:**
- O middleware atual usa `createServerClient` que não funciona em export estático
- O auth callback route precisa ser convertido para client-side redirect

---

### FASE 2: Instalação e Configuração do Capacitor 📦
> **Objetivo:** Criar a estrutura nativa iOS + Android

**Tarefas:**
1. [ ] Instalar Capacitor Core: `npm install @capacitor/core @capacitor/cli`
2. [ ] Inicializar Capacitor: `npx cap init "FinControl" "com.fincontrol.app" --web-dir=out`
3. [ ] Instalar plugins nativos:
   ```bash
   npm install @capacitor/push-notifications
   npm install @capacitor/camera
   npm install @capacitor/haptics
   npm install @capacitor/status-bar
   npm install @capacitor/splash-screen
   npm install @capacitor/preferences
   npm install @capacitor/app
   npm install @capacitor/network
   npm install capacitor-native-biometric
   ```
4. [ ] Adicionar plataformas:
   ```bash
   npx cap add ios
   npx cap add android
   ```
5. [ ] Configurar `capacitor.config.ts` com plugins
6. [ ] Testar sincronização: `npx cap sync`

---

### FASE 3: Camada de Abstração Nativa (lib/native/) 🧩
> **Objetivo:** Criar uma camada que detecta se está no Capacitor ou no browser

**Arquivos a criar:**

```
lib/
  native/
    index.ts          # Barrel export
    platform.ts       # Detecção de plataforma (web vs native)
    push.ts           # Push notifications service
    camera.ts         # Camera service
    biometrics.ts     # Biometric auth service
    haptics.ts        # Haptic feedback
    storage.ts        # Secure storage wrapper
    network.ts        # Network status
    statusbar.ts      # Status bar control
```

**Regra de Ouro:** Cada serviço deve ter fallback web graceful:
```typescript
// Exemplo: lib/native/platform.ts
import { Capacitor } from '@capacitor/core'

export const isNative = () => Capacitor.isNativePlatform()
export const getPlatform = () => Capacitor.getPlatform() // 'ios' | 'android' | 'web'
```

---

### FASE 4: Push Notifications (Lembrança de Cobranças) 🔔
> **Objetivo:** Enviar lembretes quando uma cobrança está próxima do vencimento

**Frontend (App):**
1. [ ] Registrar dispositivo para push no login
2. [ ] Salvar `push_token` no Supabase (tabela `device_tokens`)
3. [ ] Solicitar permissão ao usuário
4. [ ] Tratar notificações recebidas (abrir transação específica)

**Backend (Supabase):**
1. [ ] Criar tabela `device_tokens` (user_id, token, platform, created_at)
2. [ ] Criar Edge Function `send-push-notification` que:
   - Busca transações com vencimento próximo (1 dia, 3 dias)
   - Envia push via Firebase Cloud Messaging (Android) / APNs (iOS)
3. [ ] Configurar Supabase Cron (pg_cron) para rodar diariamente

**Configuração Necessária:**
- [ ] Criar projeto no Firebase Console (para FCM)
- [ ] Configurar APNs Key no Apple Developer Portal
- [ ] Adicionar `google-services.json` (Android) e configurar `AppDelegate` (iOS)

---

### FASE 5: Câmera (Comprovantes) 📸
> **Objetivo:** Permitir fotografar recibos/comprovantes e anexar a transações

**Tarefas:**
1. [ ] Criar componente `CameraCapture` com opção de galeria ou câmera
2. [ ] Fazer upload da imagem para Supabase Storage
3. [ ] Vincular URL da imagem à transação (campo `comprovante_url`)
4. [ ] Criar visualizador de comprovante no detalhe da transação
5. [ ] Fallback web: `<input type="file" accept="image/*" capture>`

---

### FASE 6: Biometria (Segurança) 🔐
> **Objetivo:** Proteger acesso ao app com Face ID / Touch ID / Fingerprint

**Tarefas:**
1. [ ] Verificar disponibilidade de biometria no dispositivo
2. [ ] Criar tela de desbloqueio biométrico
3. [ ] Fluxo: App abre → Tela de biometria → Verifica → Libera app
4. [ ] Opção nas configurações para ativar/desativar
5. [ ] Armazenar sessão auth em Secure Storage (não cookies)
6. [ ] Fallback: PIN code

---

### FASE 7: Polimento Nativo 💎
> **Objetivo:** Fazer o app se sentir verdadeiramente nativo

**Tarefas:**
1. [ ] Status Bar: adaptar cor conforme tema (dark/light)
2. [ ] Splash Screen: tela de loading nativa com logo
3. [ ] Haptics: feedback tátil em ações (nova transação, delete, etc.)
4. [ ] Back Button (Android): tratar navegação com botão físico
5. [ ] Safe Area: respeitar notch/island do iOS e cutouts Android
6. [ ] Pull-to-refresh nas listas
7. [ ] Network detection: mostrar banner quando offline

---

### FASE 8: Preparação para Lojas 🏪
> **Objetivo:** Preparar assets e configurações para publicação

**iOS (App Store):**
- [ ] Apple Developer Account ($99/ano)
- [ ] App Icon (1024x1024)
- [ ] Screenshots para todos os device sizes
- [ ] Info.plist: permissões de câmera, notificação, biometria
- [ ] Privacy manifest (obrigatório 2025+)
- [ ] TestFlight build para teste

**Android (Play Store):**
- [ ] Google Play Developer Account ($25 único)
- [ ] App Icon (512x512 + adaptive icon)
- [ ] Screenshots para phone e tablet
- [ ] Signing key (upload key + app signing by Google)
- [ ] Data safety form
- [ ] Internal testing track

---

## ⚠️ Pontos Críticos de Atenção

### 1. SSR → SSG Migration
O Next.js precisa gerar output **estático** (`output: 'export'`). Isso significa:
- ❌ Sem `middleware.ts` server-side
- ❌ Sem Route Handlers (`app/api/`)
- ❌ Sem `getServerSideProps`
- ✅ Tudo client-side com Supabase JS Client

### 2. Auth Flow no Capacitor
- Cookies não funcionam igual no WebView nativo
- Usar `@supabase/supabase-js` diretamente (não `@supabase/ssr`)
- Armazenar tokens via Capacitor Secure Storage
- Deep Link para OAuth callback

### 3. CORS nos Edge Functions
- Verificar que Edge Functions permitem requests do app nativo
- Capacitor envia requests com origin `capacitor://localhost` (iOS) ou `http://localhost` (Android)

---

## 📊 Estimativa de Esforço

| Fase | Descrição | Complexidade | Tempo Estimado |
|------|-----------|-------------|----------------|
| 1 | Export Estático | Média | 2-3h |
| 2 | Setup Capacitor | Baixa | 1h |
| 3 | Camada Nativa | Média | 2-3h |
| 4 | Push Notifications | Alta | 4-6h |
| 5 | Câmera | Média | 2-3h |
| 6 | Biometria | Média | 2-3h |
| 7 | Polimento | Média | 3-4h |
| 8 | Lojas | Alta | 4-6h |
| **Total** | | | **~20-30h** |

---

## 🚀 Vamos Começar?

Começaremos pela **FASE 1** (Preparação do Next.js para Export Estático), pois é a fundação de tudo. Sem isso, o Capacitor não consegue empacotar o app.
