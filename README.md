# Verify Demo Application

A production-ready Expo React Native application demonstrating **Silent Network Authentication (SNA)** and **Passkey (FIDO2/WebAuthn)** authentication.

## Features

- **Silent Network Authentication (SNA)**: One-tap login using cellular network.
- **Passkey Authentication**: Secure biometric login (Face ID, Touch ID, Fingerprint).
- **Session Management**: Secure session persistence using Expo Secure Store.
- **Clean Architecture**: Separation of concerns with dedicated API, Service, and Store layers.
- **Modern UI**: Built with NativeWind (Tailwind CSS) for a sleek, banking-app-like experience.

## Tech Stack

- **Framework**: Expo SDK 57
- **Language**: TypeScript
- **State Management**: Zustand
- **Navigation**: React Navigation
- **Styling**: NativeWind (Tailwind CSS)
- **Networking**: Axios
- **Biometrics**: expo-passkeys
- **Storage**: expo-secure-store

## Prerequisites

- Node.js (v18 or newer)
- Expo Go app on your physical device OR a configured emulator/simulator.
- **For SNA**: A physical device with a SIM card and active mobile data.

## Installation

1. Clone the repository.
2. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```

## Configuration

Create a `.env` file in the root directory and add the following:

```env
EXPO_PUBLIC_API_BASE_URL=https://dev.m360.com.ph/verify/v1
```

## Running the App

### Start the development server
```bash
npx expo start
```

### Run on Android
```bash
npx expo run:android
```

### Run on iOS
```bash
npx expo run:ios
```

## Project Structure

- `src/api`: Axios clients and API module definitions.
- `src/services`: Business logic and integration with native modules (Auth, Passkey, SNA).
- `src/store`: Global state management with Zustand.
- `src/screens`: UI components for each app screen.
- `src/styles`: Global CSS and Tailwind configurations.
- `src/navigation`: App routing and navigation types.

## Important Notes

- **SNA** requires the device to be on a mobile network. Ensure Wi-Fi is turned off during SNA testing.
- **Passkeys** require a physical device with biometric capabilities enabled.
- The application stores only the `access_token`, `ref_code`, and `pin_code` in the Secure Store. No private key material is stored.
