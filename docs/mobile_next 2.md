# FinControl — Próximos Passos para Publicação Mobile

> Este documento detalha cada etapa necessária para levar o FinControl da versão
> híbrida atual (Capacitor + Next.js) até a publicação na **Apple App Store** e
> **Google Play Store**.

---

## 📋 Índice

1. [Firebase Cloud Messaging (FCM)](#1-firebase-cloud-messaging-fcm)
2. [Apple Developer — Push Notifications](#2-apple-developer--push-notifications)
3. [Ícones do App](#3-ícones-do-app)
4. [Splash Screen Personalizada](#4-splash-screen-personalizada)
5. [Supabase Cron — Notificações Automáticas](#5-supabase-cron--notificações-automáticas)
6. [Testar no Dispositivo Real](#6-testar-no-dispositivo-real)
7. [Preparar Build de Release (Android)](#7-preparar-build-de-release-android)
8. [Preparar Build de Release (iOS)](#8-preparar-build-de-release-ios)
9. [Publicar na Google Play Store](#9-publicar-na-google-play-store)
10. [Publicar na Apple App Store](#10-publicar-na-apple-app-store)
11. [Pós-Publicação](#11-pós-publicação)

---

## 1. Firebase Cloud Messaging (FCM)

### O que é?
O Firebase Cloud Messaging é o serviço do Google para enviar push notifications
para dispositivos Android e iOS. Mesmo no iOS, o Firebase atua como ponte —
ele recebe a mensagem e a encaminha via APNs (Apple Push Notification service).

### Por que precisa?
Sem o FCM configurado, as push notifications (lembretes de cobranças, vencimentos)
**não funcionam**. O token de push que o Capacitor registra no dispositivo só tem
utilidade se houver um servidor capaz de enviar mensagens para ele.

### Como fazer

1. Acesse o [Firebase Console](https://console.firebase.google.com)
2. Crie um novo projeto (ou use um existente)
3. Em **Configurações do Projeto > Cloud Messaging**, copie a **Server Key**
4. Adicione como secret no Supabase:
   - Vá em **Dashboard Supabase > Settings > Edge Functions > Secrets**
   - Adicione: `FCM_SERVER_KEY` = `<sua-server-key>`

5. **Para Android:**
   - No Firebase Console, adicione um app Android com o package `com.fincontrol.app`
   - Baixe o arquivo `google-services.json`
   - Coloque em: `android/app/google-services.json`

6. **Para iOS:**
   - No Firebase Console, adicione um app iOS com o bundle ID `com.fincontrol.app`
   - Baixe o arquivo `GoogleService-Info.plist`
   - Coloque em: `ios/App/App/GoogleService-Info.plist`
   - **Importante**: Abra o Xcode (`pnpm cap:open:ios`) e arraste o arquivo para
     dentro do grupo `App` no navegador de projetos, marcando "Copy items if needed"

### Verificação
Após configurar, rode `pnpm cap:run:android` ou `pnpm cap:run:ios` e verifique
nos logs do console se aparece:
```
[Push] Device registered: <token-parcial>...
```

---

## 2. Apple Developer — Push Notifications

### O que é?
A Apple exige uma configuração específica para autorizar seu app a receber
notificações push. Isso envolve criar uma chave APNs e linkar com o Firebase.

### Por que precisa?
Sem isso, push notifications **funcionam no Android mas não no iOS**. O Firebase
precisa dessa chave para se comunicar com os servidores da Apple.

### Como fazer

1. Acesse o [Apple Developer Portal](https://developer.apple.com/account)
2. Vá em **Certificates, Identifiers & Profiles**

3. **Registrar App ID** (se ainda não existe):
   - Identifiers > App IDs > Register
   - Bundle ID: `com.fincontrol.app`
   - Habilite **Push Notifications** nas capabilities

4. **Criar APNs Key:**
   - Keys > Create a key
   - Nome: "FinControl Push Key"
   - Marque **Apple Push Notifications service (APNs)**
   - Faça download da `.p8` (guarde bem, só é possível baixar uma vez!)
   - Anote o **Key ID** e o **Team ID**

5. **Configurar no Firebase Console:**
   - Project Settings > Cloud Messaging > iOS app
   - Upload APNs Authentication Key (arquivo `.p8`)
   - Informe o Key ID e o Team ID

### Verificação
No Xcode, vá em **Signing & Capabilities** e confirme que "Push Notifications"
aparece nas capabilities do target `App`.

---

## 3. Ícones do App

### O que é?
Os ícones são a identidade visual do app nas lojas e na tela inicial do
dispositivo. Cada plataforma exige múltiplos tamanhos.

### Por que precisa?
Sem ícones customizados, o app aparece com o ícone genérico do Capacitor
(um quadrado azul), o que passa uma impressão amadora e pode levar à rejeição
na App Store.

### Especificações

| Plataforma | Tamanho Base | Formato | Observações |
|------------|-------------|---------|-------------|
| iOS | 1024×1024 px | PNG | Sem transparência, sem cantos arredondados (o iOS aplica) |
| Android | 512×512 px | PNG | Precisa de ícone adaptativo (foreground + background) |
| Stores | 512×512 px | PNG | Usado na listagem da loja |

### Como fazer

1. **Crie o ícone** em 1024×1024 px (use Figma, Illustrator, ou peça para o designer)
2. Use o [capacitor-assets](https://github.com/nicknisi/capacitor-assets) para gerar todos os tamanhos:
   ```bash
   npx @capacitor/assets generate --iconBackgroundColor '#09090b' --splashBackgroundColor '#09090b'
   ```
3. **Ou manualmente:**
   - **iOS**: Substitua os arquivos em `ios/App/App/Assets.xcassets/AppIcon.appiconset/`
   - **Android**: Substitua em `android/app/src/main/res/mipmap-*/`

### Dica
Mantenha o ícone simples e reconhecível mesmo em 29×29 px (menor tamanho no iOS).
O símbolo `$` do FinControl em fundo escuro com destaque emerald funciona bem.

---

## 4. Splash Screen Personalizada

### O que é?
A tela que aparece enquanto o app está carregando. No FinControl, já está
configurada com fundo escuro (#09090b) e spinner emerald no `capacitor.config.ts`.

### Por que personalizar?
Uma splash screen com a logo do app transmite profissionalismo. A tela atual
mostra apenas um spinner — funcional mas não memorável.

### Como fazer

1. **Crie a imagem da splash** em 2732×2732 px (PNG, fundo na cor do tema)
2. Use o capacitor-assets:
   ```bash
   npx @capacitor/assets generate --splashBackgroundColor '#09090b'
   ```
3. **Ou manualmente:**
   - **iOS**: Substitua em `ios/App/App/Assets.xcassets/Splash.imageset/`
   - **Android**: Substitua em `android/app/src/main/res/drawable-*/splash.png`

4. Após substituir, rode:
   ```bash
   pnpm cap:sync
   ```

### Configuração atual (`capacitor.config.ts`)
```typescript
SplashScreen: {
  launchShowDuration: 2000,
  launchAutoHide: true,
  backgroundColor: '#09090b',
  showSpinner: true,
  spinnerColor: '#10b981',
  splashFullScreen: true,
  splashImmersive: true,
}
```

---

## 5. Supabase Cron — Notificações Automáticas

### O que é?
Um job agendado que roda diariamente no Supabase para verificar cobranças
próximas do vencimento e enviar push notifications automaticamente.

### Por que precisa?
Sem o cron, a Edge Function `send-push-notifications` só seria executada se
alguém a chamasse manualmente. O cron garante que toda manhã (às 9h) o sistema
verifica e notifica os usuários sobre cobranças.

### Pré-requisito
A extensão `pg_cron` precisa estar habilitada no Supabase (já vem habilitada por
padrão em projetos pagos, mas pode precisar ser ativada em projetos free).

### Como fazer

1. No **Supabase SQL Editor**, execute:

```sql
-- Habilitar extensão se necessário
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Agendar verificação diária às 9h (horário de Brasília = 12h UTC)
SELECT cron.schedule(
  'check-upcoming-bills',
  '0 12 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xieboheswpzlwatwnwdp.supabase.co/functions/v1/send-push-notifications?action=check-upcoming',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key')
    )
  );
  $$
);
```

2. **Para verificar se está funcionando:**
```sql
SELECT * FROM cron.job;
SELECT * FROM cron.job_run_details ORDER BY start_time DESC LIMIT 5;
```

3. **Para remover o job:**
```sql
SELECT cron.unschedule('check-upcoming-bills');
```

### Observação sobre horários
O Supabase usa UTC internamente. Brasília (BRT) é UTC-3, então:
- 9h BRT = 12h UTC → `'0 12 * * *'`
- 8h BRT = 11h UTC → `'0 11 * * *'`

---

## 6. Testar no Dispositivo Real

### O que é?
Rodar o app em um iPhone/Android físico para testar funcionalidades nativas
que não funcionam no simulador (câmera, push, biometria).

### Por que é essencial?
- **Push notifications** não funcionam no simulador iOS
- **Câmera** usa a galeria como fallback no simulador
- **Biometria** simula Face ID/Touch ID, mas o fluxo real é diferente
- **Performance** do WebView difere entre simulador e dispositivo real

### Como testar

**iOS (requer Mac + Xcode + dispositivo conectado via cabo):**
```bash
pnpm cap:build        # Build + sync
pnpm cap:open:ios     # Abre no Xcode
```
No Xcode: selecione seu dispositivo → Run (⌘R)

**Android (requer Android Studio + dispositivo com USB debugging):**
```bash
pnpm cap:build        # Build + sync
pnpm cap:run:android  # Build + instala no dispositivo
```

### Checklist de testes

- [ ] Login com email/senha funciona
- [ ] Biometria apresenta prompt de ativar após primeiro login
- [ ] Lock screen aparece ao reabrir o app (se biometria ativa)
- [ ] Push notification é recebida (criar transação com data futura)
- [ ] Câmera abre ao criar transação
- [ ] Galeria abre ao criar transação
- [ ] Comprovante é enviado e visualizado
- [ ] Haptic feedback ao interagir (botões, ações)
- [ ] Back button (Android) navega corretamente
- [ ] Safe areas corretas (notch, home indicator)
- [ ] Splash screen aparece ao abrir o app

---

## 7. Preparar Build de Release (Android)

### O que é?
Gerar o arquivo `.aab` (Android App Bundle) assinado, que é o formato exigido
pela Google Play Store para publicação.

### Como fazer

1. **Gerar keystore (apenas uma vez, guarde com segurança!):**
```bash
keytool -genkey -v \
  -keystore android/fincontrol-release.keystore \
  -alias fincontrol \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000
```
> **⚠️ NUNCA perca este arquivo ou a senha.** Sem ele, não é possível atualizar o app na Play Store.

2. **Configurar signing em `android/app/build.gradle`:**
```groovy
android {
    signingConfigs {
        release {
            storeFile file('../fincontrol-release.keystore')
            storePassword 'SUA_SENHA'
            keyAlias 'fincontrol'
            keyPassword 'SUA_SENHA'
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            proguardFiles getDefaultProguardFile('proguard-android.txt'), 'proguard-rules.pro'
        }
    }
}
```

3. **Gerar o bundle:**
```bash
cd android
./gradlew bundleRelease
```
O arquivo `.aab` estará em: `android/app/build/outputs/bundle/release/app-release.aab`

4. **Verificação:**
```bash
# Testar o APK localmente antes de enviar
./gradlew assembleRelease
adb install app/build/outputs/apk/release/app-release.apk
```

---

## 8. Preparar Build de Release (iOS)

### O que é?
Gerar o arquivo `.ipa` via Xcode, assinado com certificado de distribuição,
pronto para upload na App Store Connect.

### Pré-requisitos
- Conta Apple Developer ($99/ano)
- Mac com Xcode instalado
- Certificado de Distribuição válido

### Como fazer

1. **Abrir no Xcode:**
```bash
pnpm cap:build
pnpm cap:open:ios
```

2. **Configurar no Xcode:**
   - Selecione o target `App`
   - **General > Identity:**
     - Display Name: `FinControl`
     - Bundle Identifier: `com.fincontrol.app`
     - Version: `1.0.0`
     - Build: `1`
   - **Signing & Capabilities:**
     - Team: Selecione sua conta Apple Developer
     - Marque "Automatically manage signing"
     - Adicione capability: **Push Notifications**

3. **Gerar Archive:**
   - Menu: Product > Archive (dispositivo genérico iOS)
   - No Organizer, clique em "Distribute App"
   - Selecione "App Store Connect" > Upload

### Observações importantes
- O app precisa funcionar em **iPhone e iPad** (ou marcar como "iPhone only")
- O Xcode valida automaticamente se faltam ícones ou capabilities
- A Apple revisa manualmente — pode levar de 1 a 7 dias

---

## 9. Publicar na Google Play Store

### O que é?
Submeter o app na Google Play Console para que fique disponível para download
por usuários Android.

### Pré-requisitos
- Conta Google Play Developer ($25 taxa única)
- Arquivo `.aab` assinado (passo 7)

### Materiais necessários

| Item | Especificação |
|------|---------------|
| Ícone | 512×512 px PNG |
| Feature Graphic | 1024×500 px |
| Screenshots | Mín. 2 (phone), ideal 4-8 |
| Descrição curta | Até 80 caracteres |
| Descrição completa | Até 4000 caracteres |
| Política de Privacidade | URL obrigatória |

### Sugestão de textos

**Título:** FinControl - Controle Financeiro

**Descrição curta:**
> Controle financeiro pessoal e empresarial com lembretes inteligentes.

**Descrição completa:**
> FinControl é o app de controle financeiro que organiza suas receitas e despesas
> em um só lugar. Gerencie cartões de crédito, acompanhe faturas, anexe
> comprovantes com a câmera e receba lembretes automáticos antes do vencimento.
>
> ✅ Separação pessoal e empresa
> ✅ Cartões de crédito com parcelas
> ✅ Gráficos e relatórios
> ✅ Comprovantes por foto
> ✅ Lembretes de vencimento
> ✅ Desbloqueio por biometria
> ✅ Dados seguros na nuvem

### Como publicar

1. Acesse [Google Play Console](https://play.google.com/console)
2. Crie um novo app > Preencha os dados
3. Em **Release > Production**, faça upload do `.aab`
4. Preencha todas as seções obrigatórias (conteúdo, classificação etária, etc.)
5. Envie para revisão

### Tempo de aprovação
Geralmente 1-3 dias para a primeira submissão.

---

## 10. Publicar na Apple App Store

### O que é?
Submeter o app na App Store Connect para que fique disponível em iPhones e iPads.

### Pré-requisitos
- Conta Apple Developer ($99/ano)
- Build já enviada via Xcode (passo 8)

### Materiais necessários

| Item | Especificação |
|------|---------------|
| Ícone | 1024×1024 px PNG (já incluso no build) |
| Screenshots iPhone 6.7" | 1290×2796 px (iPhone 15 Pro Max) |
| Screenshots iPhone 6.5" | 1284×2778 px (iPhone 14 Plus) |
| Screenshots iPad 12.9" | 2048×2732 px (se suportar iPad) |
| Descrição | Até 4000 caracteres |
| Keywords | Até 100 caracteres |
| URL Política de Privacidade | Obrigatória |
| URL do Suporte | Obrigatória |

### Informações de revisão
A Apple exige uma conta de teste para revisores:
- Crie um usuário de teste com dados fictícios no Supabase
- Forneça email e senha nas informações de revisão

### Como publicar

1. Acesse [App Store Connect](https://appstoreconnect.apple.com)
2. Crie um novo app
3. Preencha metadados, screenshots e descrição
4. Selecione o build enviado pelo Xcode
5. Submeta para revisão

### Motivos comuns de rejeição (e como evitar)
- ❌ **Sem política de privacidade** → Crie uma página simples e forneça a URL
- ❌ **App parece um site (WebView)** → Garanta que a UI tenha aparência nativa
- ❌ **Push sem uso claro** → Explique na descrição que são lembretes de cobrança
- ❌ **Câmera sem justificativa** → Já configuramos a description em português
- ❌ **Dados pessoais sem criptografia** → Supabase usa HTTPS + RLS
- ❌ **Crash na abertura** → Teste em device real antes de submeter

### Tempo de aprovação
Primeira submissão: 1-7 dias. Atualizações: geralmente 1-2 dias.

---

## 11. Pós-Publicação

### O que monitorar

1. **Crash reports**: Firebase Crashlytics (Android) e Xcode Organizer (iOS)
2. **Push delivery rate**: Monitorar no Firebase Console
3. **Avaliações**: Responder reviews negativos rapidamente
4. **métricas**: Downloads, retenção, uso por feature

### Atualizações futuras

Para publicar uma atualização:

```bash
# 1. Fazer alterações no código
# 2. Incrementar versão no package.json, Xcode e build.gradle
# 3. Build + sync
pnpm cap:build

# 4. Android: gerar novo bundle
cd android && ./gradlew bundleRelease

# 5. iOS: Archive no Xcode e upload
pnpm cap:open:ios
# Product > Archive > Distribute

# 6. Submeter nas lojas
```

### Dica importante
Sempre teste em dispositivo real antes de submeter.  
Use TestFlight (iOS) e teste interno/beta (Android) para validar com usuários reais antes do lançamento público.

---

## ✅ Checklist Resumido

| # | Etapa | Prioridade | Status |
|---|-------|------------|--------|
| 1 | Configurar Firebase (FCM) | 🔴 Alta | ⬜ |
| 2 | Configurar APNs (Apple Push) | 🔴 Alta | ⬜ |
| 3 | Criar ícones do app | 🔴 Alta | ⬜ |
| 4 | Personalizar splash screen | 🟡 Média | ⬜ |
| 5 | Configurar cron no Supabase | 🔴 Alta | ⬜ |
| 6 | Testar em dispositivo real | 🔴 Alta | ⬜ |
| 7 | Build de release Android | 🔴 Alta | ⬜ |
| 8 | Build de release iOS | 🔴 Alta | ⬜ |
| 9 | Publicar na Google Play | 🔴 Alta | ⬜ |
| 10 | Publicar na App Store | 🔴 Alta | ⬜ |
| 11 | Monitoramento pós-publicação | 🟡 Média | ⬜ |
