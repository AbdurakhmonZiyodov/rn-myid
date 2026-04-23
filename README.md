# rn-myid

React Native wrapper for the Uzbek MyID identification SDK (`uz.myid`). Promise-based API, single configure step, no event-listener boilerplate in consumers.

- iOS: `MyIdSDK ~> 3.1.3`
- Android: `uz.myid.sdk.capture:myid-capture-sdk(-debug):3.1.5`
- React Native: ≥ 0.76 (new architecture supported)

> **O'zbekcha qo'llanma** `docs/` papkasida: [releasing](./docs/RELEASING.md) · [consumer migration](./docs/MIGRATING-CONSUMER.md) · [developing](./docs/DEVELOPING.md)

---

## Install

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.2
cd ios && pod install
```

For private installs via SSH:

```json
"rn-myid": "git+ssh://git@github.com/AbdurakhmonZiyodov/rn-myid.git#v1.0.2"
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
import {MyId} from 'rn-myid';

MyId.configure({
  clientHash: '<YOUR_MYID_CLIENT_HASH>',
  clientHashId: '<YOUR_MYID_CLIENT_HASH_ID>',
  // `environment` is optional and defaults to 'production'.
});
```

> **Do not tie `environment` to `__DEV__`.** The `'debug'` value selects MyID's own sandbox backend and will immediately dismiss the SDK if your `sessionId` was issued against production (which it almost always is). Leave it as `'production'` unless you specifically have MyID sandbox credentials.

### 2. Start a session

```ts
import {MyId, MyIdError} from 'rn-myid';

try {
  const {code} = await MyId.start({
    sessionId, // from your backend (GetMyIdSessionId)
    locale: 'uz', // 'uz' | 'uz-cyrl' | 'ru' | 'en'
  });
  await api.syncByMyId({userId, code});
} catch (e) {
  if (e instanceof MyIdError && e.kind === 'USER_EXITED') return;
  showMessage({type: 'danger', message: (e as Error).message});
}
```

### API

| Method                   | Returns               | Notes                                                                     |
| ------------------------ | --------------------- | ------------------------------------------------------------------------- |
| `MyId.configure(config)` | `void`                | Sets `clientHash`, `clientHashId`, `environment`. Call once at startup.   |
| `MyId.isAvailable()`     | `boolean`             | `false` on simulators where the native module is absent.                  |
| `MyId.isConfigured()`    | `boolean`             | Helper for guards.                                                        |
| `MyId.start(opts)`       | `Promise<MyIdResult>` | Resolves with `{ code, image?, imageFormat? }`. Rejects with `MyIdError`. |

### `MyIdError.kind`

- `NOT_CONFIGURED` — `start()` was called before `configure()`.
- `UNAVAILABLE` — native module not linked (Expo Go, missing rebuild).
- `ALREADY_RUNNING` — another `start()` is in flight.
- `USER_EXITED` — user cancelled the native flow.
- `SDK_ERROR` — MyID SDK raised an error; `.code` and `.message` preserved.

## Troubleshooting

- **SDK opens then immediately closes with no `onError`**: most often caused by `environment: 'debug'` against a production `sessionId`. Set `environment: 'production'` (or omit — it's the default) and retry.
- **"No current activity to start MyId"** (Android): `start()` was called while the activity stack was empty (e.g., during cold start or with the app backgrounded). Wait for `AppState === 'active'`.
- **`UNAVAILABLE` on iOS**: run `pod install` after adding the dependency and rebuild the app via Xcode / `yarn ios`.
- **Stale session**: `sessionId` is single-use. Re-fetch a new one for each `start()` call.
- **Image data needed**: The `image` field is returned as base64 (JPEG on iOS, PNG on Android). `imageFormat` tells you which.

## Development

```bash
yarn install          # installs deps, sets up husky hooks, builds lib/
yarn typecheck        # tsc --noEmit
yarn lint             # ESLint on src/
yarn lint:fix         # ESLint auto-fix
yarn format           # Prettier check
yarn format:fix       # Prettier auto-format
yarn prepare          # rebuild lib/ via react-native-builder-bob
```

Staged `.ts` / `.tsx` files are auto-formatted and auto-fixed on commit via husky + lint-staged — you don't need to run prettier/eslint manually before `git commit`.

## Releasing a new version

`release-it` handles the whole dance — version bump, `lib/` rebuild, commit, tag, push — in one command:

```bash
yarn release            # interactive: prompts for patch / minor / major
yarn release patch      # 1.0.1 → 1.0.2 (bugfix, doc tweak)
yarn release minor      # 1.0.1 → 1.1.0 (new API, backward-compatible)
yarn release major      # 1.0.1 → 2.0.0 (breaking API change)
yarn release:dry        # dry-run: shows what would happen, changes nothing
```

**Preconditions enforced by release-it**:

- You are on `main`.
- Working tree is clean (`git stash` any WIP first).
- `yarn typecheck` and `yarn lint` pass (these run automatically as `before:init` hooks).

**What happens under the hood**:

1. `release-it` bumps `version` in `package.json`.
2. `yarn prepare` runs (bob rebuilds `lib/`).
3. `scripts/update-readme-version.js` rewrites `rn-myid#vX.Y.Z` snippets in `README.md` to the new version.
4. All changes are committed as `chore: release v${version}`.
5. Tag `v${version}` is created.
6. `main` and the tag are pushed to `origin`.

**Then update each consumer**:

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#vX.Y.Z
cd ios && pod install       # iOS only
```

**Semver cheat sheet**:

| Change                                                                            | Bump    |
| --------------------------------------------------------------------------------- | ------- |
| README typo, internal refactor, bugfix                                            | `patch` |
| New public method, new optional param, new event                                  | `minor` |
| Renamed/removed method, signature change, behavior change consumers must adapt to | `major` |

## License

UNLICENSED — internal use only.
