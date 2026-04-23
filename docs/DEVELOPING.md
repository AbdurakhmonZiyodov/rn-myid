# Working on `rn-myid`

The recipe for fixing a bug, shipping a new feature, or bumping the MyID SDK version.

---

## 0. First-time setup

```bash
git clone git@github.com:AbdurakhmonZiyodov/rn-myid.git
cd rn-myid
yarn install              # deps + husky hooks + lib/ build
```

After a successful `yarn install`:

- `.husky/_/` is created automatically (pre-commit hook is active).
- `lib/` is built (it's committed to git, so consumers never have to build it).

---

## 1. Where to change what

| If you want to change…                  | Edit this                                        |
| --------------------------------------- | ------------------------------------------------ |
| JS API (MyId facade)                    | `src/MyId.ts`                                    |
| A TypeScript type                       | `src/types.ts`                                   |
| Error class / error kind                | `src/errors.ts`                                  |
| TurboModule spec                        | `src/NativeMyId.ts`                              |
| iOS native code                         | `ios/RNMyId.swift`, `ios/RNMyId.mm`              |
| iOS SDK version / pod dependency        | `rn-myid.podspec`                                |
| Android native code                     | `android/src/main/java/com/rnmyid/MyIdModule.kt` |
| Android SDK version, maven repo, minSdk | `android/build.gradle`                           |
| Android permissions                     | `android/src/main/AndroidManifest.xml`           |
| Public README                           | `README.md`                                      |
| Release recipe                          | `docs/RELEASING.md`                              |
| ESLint rules                            | `.eslintrc.js`                                   |
| Prettier style                          | `.prettierrc.js`                                 |

---

## 2. Local dev loop

To test a change in a consumer project (e.g. `rn-my-business-mob`) without publishing a new tag, use a `file:` link:

### One-time setup

```bash
cd /path/to/rn-my-business-mob
yarn add "rn-myid@file:/Users/a.ziyodovbrb-tech.uz/Desktop/works/react-native-myid"
```

That writes this into `package.json`:

```json
"rn-myid": "file:/Users/.../react-native-myid"
```

From then on, every `yarn install` in the consumer picks the package straight from your local folder.

### Dev loop

1. Edit files in `rn-myid/src/...`.
2. `cd rn-myid && yarn prepare` — `lib/` gets rebuilt.
3. `cd rn-my-business-mob && yarn install`, or to force-refresh the local link:
   ```bash
   rm -rf node_modules/rn-myid
   yarn install
   ```
4. iOS only:
   ```bash
   cd ios && pod install && cd ..
   ```
5. Rebuild the app: `yarn ios` or `yarn android`.

### Native code changes

If you touched Swift / Kotlin, Metro reload is not enough — you need a **full rebuild**. On iOS, clean the Xcode build (Shift+Cmd+K) first.

### Going back to a real tag

When you're ready to ship the change as a version:

```bash
cd /path/to/rn-my-business-mob
yarn add "rn-myid@github:AbdurakhmonZiyodov/rn-myid#vX.Y.Z"
```

(swap the `file:` link for the official tag)

---

## 3. Pre-commit hooks

Every `git commit` runs husky automatically:

- `.ts` / `.tsx` files → `prettier --write` + `eslint --fix`
- `.js` / `.jsx` / `.json` / `.md` files → `prettier --write`

If ESLint finds something it can't auto-fix, the commit aborts. Fix the error by hand and retry.

**Don't turn husky off.** In emergencies you can bypass it:

```bash
git commit --no-verify -m "..."
```

…but avoid it — keeping staged code clean is husky's job.

---

## 4. Bumping the native SDK version

When MyID releases a new SDK (e.g. iOS `3.1.3 → 3.2.0`):

### iOS

`rn-myid.podspec`:

```ruby
s.dependency 'MyIdSDK', '~> 3.2.0'
```

### Android

`android/build.gradle`:

```gradle
debugImplementation("uz.myid.sdk.capture:myid-capture-sdk-debug:3.2.0")
releaseImplementation("uz.myid.sdk.capture:myid-capture-sdk:3.2.0")
```

Then:

1. In a consumer project, run `cd ios && pod install` and `./gradlew :app:assembleDebug` — both should be green.
2. Smoke-test the MyID flow on a real device (camera + document capture especially).
3. If the SDK ships a breaking change, cut a **`major`** release. Otherwise `patch` or `minor`.

---

## 5. Adding a TypeScript type

Example: you want to expose `issuedAt: string` on `MyIdResult`.

1. `src/types.ts`:
   ```ts
   export interface MyIdResult {
     code: string;
     image?: string;
     imageFormat?: 'jpeg' | 'png';
     issuedAt?: string; // ← new
   }
   ```
2. `src/MyId.ts` — pass it through the `onSuccess` resolver (if the native layer provides it):
   ```ts
   resolve({
     code: event.code,
     image: event.image,
     issuedAt: event.issuedAt, // ← new
     // ...
   });
   ```
3. Update the native side (iOS Swift, Android Kotlin) to include `issuedAt` in the `onSuccess` event payload.
4. `yarn typecheck && yarn lint && yarn prepare` — everything stays green.
5. `yarn release minor` — it's a new optional field, so backwards compatible.

---

## 6. Adding an error kind

`src/errors.ts`:

```ts
export type MyIdErrorKind = 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'ALREADY_RUNNING' | 'USER_EXITED' | 'SDK_ERROR' | 'NETWORK_ERROR'; // ← new
```

Add the corresponding branch in the native error handler inside `src/MyId.ts`.

`yarn release minor`.

---

## 7. Breaking changes

Example: `MyId.start` renames its option from `locale` to `lang`.

1. Change the code.
2. Update `README.md` — include a migration snippet for consumers.
3. Update `docs/MIGRATING-CONSUMER.md`.
4. `yarn release major`.
5. Every consumer project needs a one-time code update.

---

## Troubleshooting

### "husky: command not found" during `yarn install`

Make sure you didn't run `yarn install --ignore-scripts`. Husky installs itself via the `prepare` lifecycle hook.

### `yarn prepare` fails with "tsc: command not found"

Either you didn't run `yarn install`, or `node_modules` is corrupted:

```bash
rm -rf node_modules yarn.lock
yarn install
```

### iOS build: "MyIdSDK not found"

`cd ios && pod install` — pods are out of sync.

### Android build: "Maven repo unreachable"

You can't reach `artifactory.aigroup.uz` (VPN, office network, etc.). Check connectivity.
