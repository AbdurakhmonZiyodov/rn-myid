# Migrating a project to `rn-myid`

`rn-myid` consolidates the MyID native module code that each of the 5–8 internal RN apps used to carry inline. This guide walks through porting a new consumer project (e.g. `my-order-app`, `chatxo-mobile`, …) from its own copy-pasted native module to the shared package.

---

## 0. Prerequisites

The project needs **React Native ≥ 0.76.9**, ideally with **new architecture enabled** (`newArchEnabled=true`). Older RN versions may work but haven't been verified.

Open a dedicated branch for the migration:

```bash
git checkout -b feat/migrate-to-rn-myid
```

---

## 1. Install the package

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.5
cd ios && pod install && cd ..
```

> `#v1.0.5` is the latest tag. See the full list: https://github.com/AbdurakhmonZiyodov/rn-myid/tags

---

## 2. Remove the legacy iOS native code

### 2.1. Podfile

Delete this line from `ios/Podfile`:

```ruby
pod 'MyIdSDK', '~> 3.1.3'
```

`MyIdSDK` now comes in transitively through `rn-myid`.

### 2.2. Swift / Obj-C files

Delete the custom module files (names may differ — look for `MyIdModule`, `MyIDBridge`, etc.):

```bash
rm ios/MyIdModule.swift ios/MyIdModule.m
```

### 2.3. Remove the Xcode project references

`project.pbxproj` still references those files and will fail to build. Two options:

**Option A (automated, ruby gem)**:

```bash
ruby -e '
require "xcodeproj"
proj = Xcodeproj::Project.open("ios/<AppName>.xcodeproj")
proj.files.to_a.each do |f|
  if f.path =~ /MyIdModule\.(swift|m)$/
    f.remove_from_project
  end
end
proj.save
'
```

**Option B (manual)**: open the project in Xcode, find `MyIdModule.swift` and `MyIdModule.m` in the Project Navigator, right-click → Delete → "Remove References".

### 2.4. Refresh `Podfile.lock`

```bash
cd ios && pod install && cd ..
```

`Podfile.lock` should now list `MyIdSDK` as a dependency of `rn-myid`:

```
- rn-myid (1.0.5):
  - MyIdSDK (~> 3.1.3)
```

---

## 3. Remove the legacy Android native code

### 3.1. Gradle dependencies

Delete these lines from `android/app/build.gradle`:

```gradle
debugImplementation("uz.myid.sdk.capture:myid-capture-sdk-debug:3.1.5")
releaseImplementation("uz.myid.sdk.capture:myid-capture-sdk:3.1.5")
```

They now come in transitively from `rn-myid`. The artifactory maven repo (`https://artifactory.aigroup.uz:443/artifactory/myid`) is injected automatically by the package via `rootProject.allprojects { repositories { ... } }`, so you don't need to add it to the consumer's gradle either.

> **If `yarn android` still fails with `Could not find uz.myid.sdk.capture:...`** — your `android/settings.gradle` probably has `dependencyResolutionManagement.repositoriesMode = FAIL_ON_PROJECT_REPOS`. In that case, add the repo to the `dependencyResolutionManagement.repositories` block there:
>
> ```gradle
> maven { url "https://artifactory.aigroup.uz:443/artifactory/myid" }
> ```

### 3.2. Kotlin files

Delete them (paths depend on your app's package namespace):

```bash
rm android/app/src/main/java/com/<app-namespace>/MyIdModule.kt
rm android/app/src/main/java/com/<app-namespace>/ReactPackage.kt   # only if it contains the MyID registration and nothing else
```

### 3.3. `MainApplication.kt`

If `getPackages()` manually adds `MyIdPackage()` or a bare `ReactPackage()` for MyID — remove that line. Autolinking picks `rn-myid` up on its own.

---

## 4. JS / TS configuration

### 4.1. MyID config constants

Find where `clientHash` and `clientHashId` are stored in your project (usually `src/enums/myId.js` or `src/config/`). Keep those; drop:

- `clientId` (never used in practice, dead code)
- `buildMode` (no longer needed)

### 4.2. App bootstrap

At the top of your app module (e.g. `App.tsx` or `src/app/app.model.ts`) configure MyId once:

```ts
import {MyId} from 'rn-myid';
import {clientHash, clientHashId} from '@/enums/myId';

MyId.configure({
  clientHash,
  clientHashId,
  environment: 'production', // IMPORTANT: don't tie this to __DEV__
});
```

> ⚠️ **Do not write `environment: __DEV__ ? 'debug' : 'production'`.** `'debug'` selects MyID's sandbox backend, but your `sessionId` is issued against production MyID — the SDK will open and dismiss itself immediately, with no `onError` event. Leave it as `'production'` (or omit entirely — that's the default).

### 4.3. `MY_ID_EVENTS` enum and dead flags

If your project has a `MY_ID_EVENTS` enum (in `constants/my-id.ts` or similar) — delete it. It's no longer needed.

If there are dead storage flags like `StorageKeys.MY_ID_ENTERED` that were set to `false` but never `true` — remove them too.

---

## 5. Migrate call-sites to the Promise API

Replace every `MyIdModule.startMyId(...)` call-site with `MyId.start(...)`. Pattern:

### Old code (to be removed):

```ts
import {NativeEventEmitter, NativeModules} from 'react-native';
import {MY_ID_EVENTS} from '@/shared/constants';
import {clientHash, clientHashId, buildMode} from '@/enums/myId';

const {MyIdModule} = NativeModules;

// ...

useEffect(() => {
  const emitter = new NativeEventEmitter(MyIdModule);
  emitter.addListener(MY_ID_EVENTS.ON_SUCCESS, onSuccess);
  emitter.addListener(MY_ID_EVENTS.ON_ERROR, onError);
  emitter.addListener(MY_ID_EVENTS.ON_USER_EXITED, onUserExited);
  return () => {
    emitter.removeAllListeners(MY_ID_EVENTS.ON_SUCCESS);
    emitter.removeAllListeners(MY_ID_EVENTS.ON_ERROR);
    emitter.removeAllListeners(MY_ID_EVENTS.ON_USER_EXITED);
  };
}, []);

function handleStart() {
  setLoading(true);
  setTimeout(() => {
    MyIdModule.startMyId(sessionId, clientHash, clientHashId, buildMode, language);
  }, 200);
}
```

### New code:

```ts
import {MyId, MyIdError} from 'rn-myid';

async function handleStart() {
  if (!sessionId) return;
  setLoading(true);
  try {
    const {code} = await MyId.start({sessionId, locale: language});
    await onSuccess(code); // your existing onSuccess logic
  } catch (e) {
    if (e instanceof MyIdError && e.kind === 'USER_EXITED') {
      // user cancelled — show a toast, do nothing else
      return;
    }
    showMessage({type: 'danger', message: (e as Error).message});
  } finally {
    setLoading(false);
  }
}
```

**What you get for free**:

- No `setTimeout(200)` hack — the package handles it.
- No `NativeEventEmitter` — the Promise lifecycle manages subscriptions.
- No stale-closure bug from `useEffect([])`.
- Double-tap protection built in (`ALREADY_RUNNING` error).
- `USER_EXITED` is an idiomatic rejection: `if (e.kind === 'USER_EXITED') return`.

---

## 6. Typecheck + lint

```bash
yarn tsc --noEmit
yarn lint
```

If errors appear they're usually leftover imports (`NativeEventEmitter`, `MY_ID_EVENTS`) or a `const {MyIdModule} = NativeModules` destructuring you forgot to delete.

---

## 7. Verify

**iOS**:

```bash
yarn ios
# or on a real device:
yarn ios:device
```

**Android**:

```bash
yarn android
# or on a real device:
adb devices
yarn android
```

Exercise all three outcomes of the MyID flow on both platforms:

1. **Success** — code is returned, backend sync runs.
2. **User exit** — tap the X button; a toast appears, the screen stays put.
3. **SDK error** — kill the network or trigger another failure; an error toast appears.

---

## 8. Commit and PR

```bash
git add -A
git commit -m "refactor: migrate MyID to rn-myid package"
git push origin feat/migrate-to-rn-myid
```

Open a PR for review. It's a good habit to re-run the on-device test one more time before merge.

---

## Troubleshooting

### `MyId.start` rejects immediately with `UNAVAILABLE`

- iOS: you didn't run `pod install` or didn't rebuild the app. Run `yarn ios` again.
- Android: you left a stale `add(ReactPackage())` line in `MainApplication.kt` pointing at the removed MyID package. Delete it.

### SDK opens, then closes with no error

Caused by `environment: 'debug'`. Change it to `'production'` in `MyId.configure`.

### iOS build error: "MyIdModule.swift not found"

Xcode project reference still points at the deleted file. Redo step 2.3.

### Android build error: duplicate MyIdSDK classes

A gradle dep is still pinning MyID directly. Recheck step 3.1.

### Android runtime error: "Exception in HostObject::get for prop 'RNMyId': ParsingException"

This was fixed in `rn-myid` v1.0.5. Upgrade the consumer: `yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.5`.
