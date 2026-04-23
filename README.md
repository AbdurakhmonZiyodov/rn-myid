# rn-myid

React Native wrapper for the Uzbek MyID identification SDK (`uz.myid`). Promise-based API, single configure step, no event-listener boilerplate in consumers.

- iOS: `MyIdSDK ~> 3.1.3`
- Android: `uz.myid.sdk.capture:myid-capture-sdk(-debug):3.1.5`
- React Native: ≥ 0.76 (new architecture supported)

---

## Install

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.0
cd ios && pod install
```

For private installs via SSH:

```json
"rn-myid": "git+ssh://git@github.com/AbdurakhmonZiyodov/rn-myid.git#v1.0.0"
```

The Android Artifactory repository (`https://artifactory.aigroup.uz/artifactory/myid`) is declared inside the library, so consumers do **not** need to add it to their `android/build.gradle`.

## Required permissions

### iOS — `ios/<App>/Info.plist`

```xml
<key>NSCameraUsageDescription</key>
<string>We need access to the camera for MyID identification.</string>
<key>NSMicrophoneUsageDescription</key>
<string>We need access to the microphone for MyID liveness checks.</string>
<key>NSPhotoLibraryUsageDescription</key>
<string>We need access to the photo library for MyID document capture.</string>
<key>NSPhotoLibraryAddUsageDescription</key>
<string>We need access to save photos used for MyID identification.</string>
```

A `postinstall` check will warn (not fail) if any of these keys is missing.

### Android

`CAMERA` and `INTERNET` are declared in the library manifest and merged automatically. Request camera permission at runtime before calling `MyId.start()` (e.g., via `react-native-permissions`).

## Usage

### 1. Configure once at app bootstrap

```ts
import { MyId } from 'rn-myid';

MyId.configure({
  clientHash: '<YOUR_MYID_CLIENT_HASH>',
  clientHashId: '<YOUR_MYID_CLIENT_HASH_ID>',
  environment: __DEV__ ? 'debug' : 'production',
});
```

### 2. Start a session

```ts
import { MyId, MyIdError } from 'rn-myid';

try {
  const { code } = await MyId.start({
    sessionId,       // from your backend (GetMyIdSessionId)
    locale: 'uz',    // 'uz' | 'uz-cyrl' | 'ru' | 'en'
  });
  await api.syncByMyId({ userId, code });
} catch (e) {
  if (e instanceof MyIdError && e.kind === 'USER_EXITED') return;
  showMessage({ type: 'danger', message: (e as Error).message });
}
```

### API

| Method | Returns | Notes |
| --- | --- | --- |
| `MyId.configure(config)` | `void` | Sets `clientHash`, `clientHashId`, `environment`. Call once at startup. |
| `MyId.isAvailable()` | `boolean` | `false` on simulators where the native module is absent. |
| `MyId.isConfigured()` | `boolean` | Helper for guards. |
| `MyId.start(opts)` | `Promise<MyIdResult>` | Resolves with `{ code, image?, imageFormat? }`. Rejects with `MyIdError`. |

### `MyIdError.kind`

- `NOT_CONFIGURED` — `start()` was called before `configure()`.
- `UNAVAILABLE` — native module not linked (Expo Go, missing rebuild).
- `ALREADY_RUNNING` — another `start()` is in flight.
- `USER_EXITED` — user cancelled the native flow.
- `SDK_ERROR` — MyID SDK raised an error; `.code` and `.message` preserved.

## Troubleshooting

- **"No current activity to start MyId"** (Android): `start()` was called while the activity stack was empty (e.g., during cold start or with the app backgrounded). Wait for `AppState === 'active'`.
- **`UNAVAILABLE` on iOS**: run `pod install` after adding the dependency and rebuild the app via Xcode / `yarn ios`.
- **Stale session**: `sessionId` is single-use. Re-fetch a new one for each `start()` call.
- **Image data needed**: The `image` field is returned as base64 (JPEG on iOS, PNG on Android). `imageFormat` tells you which.

## Development

```bash
yarn install
yarn typecheck
yarn prepare   # builds lib/ via react-native-builder-bob
```

Release checklist:

1. Bump `version` in `package.json`.
2. `yarn prepare`.
3. Commit `lib/` on a `release/vX.Y.Z` branch (or use a CI action).
4. `git tag vX.Y.Z && git push --tags`.
5. Update consumers' `package.json` tag.

## License

UNLICENSED — internal use only.
