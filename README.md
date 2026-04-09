# Liftly (Expo + React Native)

This project is already an **Expo React Native** app and can run directly in **Expo Go**.

## 1) Install dependencies

From the project folder:

```powershell
npm install
```

## 2) Start the Expo dev server (Windows PowerShell)

Use either of these:

```powershell
npx expo start
```

or:

```powershell
npm run start
```

`npx expo start` is the core command/script that launches Metro and shows a QR code in the terminal.

## 3) Open in Expo Go on your phone

1. Install **Expo Go** from the App Store (iPhone) or Play Store (Android).
2. Make sure your phone and computer are on the same Wi-Fi network.
3. Run:

   ```powershell
   npx expo start
   ```

4. When the QR code appears:
   - **Android**: open Expo Go and tap **Scan QR Code**.
   - **iPhone**: open the **Camera** app and scan the QR code, then tap the Expo Go link.
5. Expo Go will open your app.

## 4) If QR scan does not connect

Try tunnel mode:

```powershell
npx expo start --tunnel
```

Then scan the new QR code.
