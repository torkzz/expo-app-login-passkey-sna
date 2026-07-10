# Expo App — Passkey & SNA Login Demo

A React Native (Expo SDK 54) Android application demonstrating two passwordless authentication methods provided by the **M360 Verify Platform**:

1. **Passkey** — FIDO2/WebAuthn biometric authentication
2. **SNA** (Silent Network Authentication) — carrier-level mobile number verification with no OTP

---

## Table of Contents

- [Overview](#overview)
- [Authentication Methods](#authentication-methods)
  - [Passkey](#passkey-flow)
  - [SNA](#sna-flow)
- [Architecture](#architecture)
- [Project Structure](#project-structure)
- [Native Module: CellularRequest](#native-module-cellularrequest)
- [Environment Configuration](#environment-configuration)
- [API Clients](#api-clients)
- [Key Dependencies](#key-dependencies)
- [Running the App](#running-the-app)
- [Testing](#testing)

---

## Overview

This app is a **reference implementation** for developers integrating with the M360 Verify Platform. It demonstrates the full end-to-end flows for both Passkey and SNA login/registration on Android.

The project targets:
- **Expo SDK**: ~54.0.35
- **React Native**: 0.81.5
- **Platform**: Android (SNA and some Passkey features are Android-specific)

---

## Authentication Methods

### Passkey Flow

Passkeys use FIDO2/WebAuthn biometrics (fingerprint, face ID) — no password or OTP ever leaves the device.

```
App                          M360 Passkey Gateway (dev.m360.com.ph/verify/v1/)
 │                                        │
 │── POST passkey/generate/key ──────────►│  Generate challenge
 │◄── { challenge, user_id, ... } ────────│
 │                                        │
 │  [User authenticates with biometric]   │
 │                                        │
 │── POST passkey/login/verify ──────────►│  Submit signed assertion
 │◄── { success: true, userid } ──────────│
```

**Key files:**

| File | Role |
|---|---|
| `src/api/passkey.ts` | Raw HTTP calls to Passkey API |
| `src/services/PasskeyService.ts` | Orchestrates challenge → biometric → verify |
| `src/providers/PasskeyProvider.ts` | Implements `AuthenticationProvider` for Passkey |

---

### SNA Flow

SNA verifies a mobile number **silently at the carrier network level** — the carrier confirms the SIM card identity without any user input.

```
App                  Gateway (stg-verify.m360.com.ph/v1/)    Globe IDP
 │                                 │                              │
 │── POST sna/auth/request ───────►│  Generate challenge URL      │
 │◄── { check_url, ref_code } ─────│                              │
 │                                 │                              │
 │  [Native cellular GET — Globe mobile data ONLY]                │
 │────────────────────────────────────────────────────────────────►
 │                                              Globe confirms SIM │
 │◄───────────────────────── { pin_code, ref_code } ──────────────│
 │                                 │
 │── POST sna/pin/verify ─────────►│  Validate tokens against DB
 │◄── { match: true } ─────────────│
```

> **Critical**: The `check_url` **must be opened over mobile cellular data**, not Wi-Fi. The SNA server reads the originating carrier IP (via CloudFront ASN header) to confirm network identity. This is why the app uses a custom native Android module.

**Key files:**

| File | Role |
|---|---|
| `src/api/sna.ts` | Raw HTTP calls to SNA API |
| `src/services/SNAService.ts` | Orchestrates request → cellular check → verify |
| `src/providers/SNAProvider.ts` | Implements `AuthenticationProvider` for SNA |
| `modules/cellular-request/` | Native Android module for forced cellular HTTP |

---

## Architecture

The app follows a **layered architecture**:

```
UI Screens
    │
    ▼
AuthenticationManager  (single public entry point — singleton)
    │
    ├── PasskeyProvider  ──► PasskeyService  ──► PasskeyApi (HTTP)
    │
    └── SNAProvider  ──────► SNAService  ──────► SNAApi (HTTP)
                                  │
                                  └── CellularRequest (native module)

AuthService  ──► auth/token  (OAuth client_credentials)
TokenManager  ──► stores + restores Bearer token in SecureStore
authStore  ──► Zustand state for authentication status
```

### Design Patterns

| Pattern | Where used |
|---|---|
| **Singleton** | `AuthenticationManager`, `AuthService`, `PasskeyService`, `SNAService`, `TokenManager`, `ApiClient` |
| **Provider / Strategy** | `AuthenticationProvider` interface with `PasskeyProvider` and `SNAProvider` implementations |
| **Repository** | `SNAApi`, `PasskeyApi`, `AuthApi` — pure HTTP adapters with no business logic |
| **Zustand store** | `authStore` — reactive auth state driving navigation |

---

## Project Structure

```
sample-android/
├── App.tsx                         # Entry component — mounts RootNavigator
├── index.ts                        # Expo entry point
├── app.json                        # Expo config (permissions, package name)
├── .env                            # Environment variables (see below)
├── .env.example                    # Template — copy to .env
│
├── src/
│   ├── api/
│   │   ├── auth.ts                 # POST auth/token — OAuth client_credentials
│   │   ├── axios.ts                # Axios clients (passkeyClient, snaClient)
│   │   ├── passkey.ts              # Passkey API calls
│   │   └── sna.ts                  # SNA API calls
│   │
│   ├── config/
│   │   ├── api.ts                  # All API endpoint paths (single source of truth)
│   │   └── env.ts                  # Typed env variable access (no direct process.env)
│   │
│   ├── navigation/
│   │   ├── RootNavigator.tsx       # Root stack — Splash → Auth or Main
│   │   ├── AuthNavigator.tsx       # Login / Register screens
│   │   ├── MainNavigator.tsx       # Dashboard and post-login screens
│   │   └── types.ts                # TypeScript route param types
│   │
│   ├── providers/
│   │   ├── AuthenticationProvider.ts  # Interface: login(), register(), logout()
│   │   ├── PasskeyProvider.ts         # Passkey implementation
│   │   └── SNAProvider.ts             # SNA implementation
│   │
│   ├── screens/
│   │   ├── SplashScreen.tsx        # Restores session, routes to Auth or Main
│   │   ├── LoginScreen.tsx         # Login UI — Passkey + SNA buttons
│   │   ├── RegisterScreen.tsx      # Registration UI — Passkey only
│   │   └── DashboardScreen.tsx     # Post-login screen
│   │
│   ├── services/
│   │   ├── AuthenticationManager.ts  # Singleton — orchestrates all auth flows
│   │   ├── AuthService.ts            # OAuth client_credentials token fetcher
│   │   ├── PasskeyService.ts         # Passkey challenge + verification logic
│   │   ├── SNAService.ts             # SNA request + verification logic
│   │   ├── TokenManager.ts           # Bearer token storage, expiry, restoration
│   │   └── DemoPasskeyStore.ts       # Demo in-memory passkey credential store
│   │
│   ├── store/
│   │   └── authStore.ts            # Zustand store: authenticated, user, session
│   │
│   ├── types/
│   │   ├── auth.ts                 # AuthResult, User, AuthenticationMethod
│   │   ├── passkey.ts              # Passkey request/response types
│   │   ├── sna.ts                  # SNA request/response types
│   │   └── api.ts                  # Generic API types
│   │
│   ├── utils/
│   │   ├── logger.ts               # Typed logger (info, warn, error)
│   │   └── errorMapper.ts          # Normalizes Axios errors to AppError
│   │
│   └── validation/
│       └── auth.ts                 # Zod schemas for login/register forms
│
├── modules/
│   └── cellular-request/           # Custom Expo native module
│       ├── index.ts                # JS export: triggerCellularGet(url)
│       ├── expo-module.config.json
│       └── android/src/main/java/expo/modules/cellularrequest/
│           └── CellularRequestModule.kt  # Android implementation
│
└── test-scripts/
    ├── test_sna_flow_poc.sh           # Bash: end-to-end SNA staging test
    ├── test_sna_flow_poc.py           # Python: end-to-end SNA staging test
    └── scratch_test_sna_flow_poc.php  # PHP: end-to-end SNA staging test
```

---

## Native Module: CellularRequest

**Location**: `modules/cellular-request/`

This is a custom Expo native module that forces an HTTP GET request over the **cellular radio interface**, bypassing Wi-Fi entirely. This is required for SNA — the carrier check URL must arrive from a mobile IP address.

### How it works

Android routes all HTTP traffic over Wi-Fi by default when both Wi-Fi and mobile data are active. The module uses `ConnectivityManager.requestNetwork()` to explicitly bind a connection to `TRANSPORT_CELLULAR`:

```kotlin
val networkRequest = NetworkRequest.Builder()
    .addTransportType(NetworkCapabilities.TRANSPORT_CELLULAR)
    .addCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET)
    .build()

// Connection is bound to the cellular network
val connection = network.openConnection(url) as HttpURLConnection
```

A 15-second safety timeout is included. The module resolves with `{ status: Int, body: String }`.

### JS API

```ts
import { triggerCellularGet } from '../../modules/cellular-request';

const result = await triggerCellularGet(checkUrl);
// result.status  → HTTP status code (e.g. 200, 302, 406)
// result.body    → response body string
```

### Required Android Permissions

```xml
<!-- app.json + AndroidManifest.xml -->
<uses-permission android:name="android.permission.CHANGE_NETWORK_STATE" />
<uses-permission android:name="android.permission.WRITE_SETTINGS" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
```

---

## Environment Configuration

Copy `.env.example` to `.env` and fill in your credentials:

```env
###############################################################################
# Verify Platform
###############################################################################

# Passkey gateway (development)
EXPO_PUBLIC_API_BASE_URL_PASSKEY=https://dev.m360.com.ph/verify/v1/

# SNA gateway (staging)
EXPO_PUBLIC_API_BASE_URL_SNA=https://stg-verify.m360.com.ph/v1/

###############################################################################
# OAuth
###############################################################################

EXPO_PUBLIC_VERIFY_CLIENT_ID=<your_client_id>
EXPO_PUBLIC_VERIFY_CLIENT_SECRET=<your_client_secret>

###############################################################################
# Application
###############################################################################

EXPO_PUBLIC_APP_NAME=Verify Demo
EXPO_PUBLIC_APP_ENV=development   # development | staging | production

###############################################################################
# Networking
###############################################################################

EXPO_PUBLIC_API_TIMEOUT=10000
EXPO_PUBLIC_ENABLE_NETWORK_LOGGING=true
```

All variables are validated and typed in `src/config/env.ts`. **Do not access `process.env` directly anywhere else in the codebase.**

---

## API Clients

Two separate Axios instances are exported from `src/api/axios.ts`:

| Export | Base URL env var | Used by |
|---|---|---|
| `passkeyClient` | `EXPO_PUBLIC_API_BASE_URL_PASSKEY` | `api/passkey.ts`, `api/auth.ts` |
| `snaClient` | `EXPO_PUBLIC_API_BASE_URL_SNA` | `api/sna.ts` |
| `apiClient` | alias → `passkeyClient` | backward-compatible |

### Request interceptor

Every request automatically receives:
- `X-Request-ID` header (UUID v4) for tracing
- `Authorization: Bearer <token>` — **only if no Authorization header is already set**, so the `auth/token` endpoint's `Basic` auth is never overwritten

---

## Key Dependencies

| Package | Version | Purpose |
|---|---|---|
| `expo` | ~54.0.35 | Expo SDK |
| `react-native` | 0.81.5 | Core framework |
| `react-native-passkeys` | ^0.4.1 | FIDO2/WebAuthn biometric auth |
| `axios` | ^1.18.1 | HTTP client |
| `zustand` | ^5.0.14 | Auth state management |
| `expo-secure-store` | ~15.0.8 | Encrypted token persistence |
| `@react-navigation/native-stack` | ^7.17.7 | Stack navigation |
| `react-hook-form` + `zod` | latest | Form validation |
| `nativewind` + `tailwindcss` | ^4.2.6 | Tailwind CSS for React Native |
| `react-native-reanimated` | ~4.1.1 | Smooth animations |

---

## Running the App

### Prerequisites

- Node.js 18+
- Android Studio with USB debugging enabled on a physical device
- `npm install` completed

### Start Metro bundler

```bash
npm run start
```

### Build and run on Android device

```bash
npm run android
# or
npx expo run:android
```

### Tunnel mode (physical device on a different network)

Required when the phone uses **Globe mobile data** while the Mac is on Wi-Fi:

```bash
npx expo start --tunnel
```

Scan the QR code with the Expo Dev Client on your phone.

---

## Testing

### Standalone SNA integration tests

These scripts verify the staging gateway end-to-end without building the app:

```bash
# Bash (recommended)
bash test_sna_flow_poc.sh

# Python (requires: pip install requests)
python3 test_sna_flow_poc.py

# PHP
php scratch_test_sna_flow_poc.php
```

Each script:
1. Fetches an OAuth Bearer token (`POST auth/token`)
2. Requests an SNA challenge URL (`POST sna/auth/request`)
3. Probes the carrier check URL (`GET auth/check/{token}`)

> **Expected result from Mac**: `406 sna_unsupported` — `ComClark Network & Technology Corp`.
> This is correct. The full redirect only completes over Globe cellular data on a physical device.

---

### SNA only works over cellular data

ASN (Globe) is the only supported carrier for this staging environment. Requests from other ASNs (Wi-Fi, Converge ICT, PLDT) return `406 carrier not supported`.

### `sna/pin/verify` does not return the phone number

The verify endpoint only confirms `{ match: true/false }`. To retrieve the actual `devicePhoneNumber`, a separate call to `sna/number/share` using the same `pin_code + ref_code` is required. **This is not yet implemented** in the app's SNA flow.
