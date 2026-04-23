# `rn-myid`'ga o'zgartirish kirgizish

Paketga bug fix, yangi feature yoki SDK versiyasini yangilash uchun retsept.

---

## 0. Birinchi marta setup

```bash
git clone git@github.com:AbdurakhmonZiyodov/rn-myid.git
cd rn-myid
yarn install              # deps + husky hooks + lib/ build
```

Agar `yarn install` muvaffaqiyatli ketgan bo'lsa:

- `.husky/_/` avtomatik yaratilgan (pre-commit hook ishga tushadi)
- `lib/` qurilgan (git'ga commit qilingan, consumer'lar `yarn add` qilganda yaratish shart emas)

---

## 1. O'zgartirish joylari

| Nima o'zgartirmoqchisiz                   | Qaysi fayl                                       |
| ----------------------------------------- | ------------------------------------------------ |
| JS API (MyId facade)                      | `src/MyId.ts`                                    |
| Yangi TypeScript type                     | `src/types.ts`                                   |
| Error class/kind                          | `src/errors.ts`                                  |
| TurboModule spec                          | `src/NativeMyId.ts`                              |
| iOS native kodi                           | `ios/RNMyId.swift`, `ios/RNMyId.mm`              |
| iOS SDK versiyasi yoki dep                | `rn-myid.podspec`                                |
| Android native kodi                       | `android/src/main/java/com/rnmyid/MyIdModule.kt` |
| Android SDK versiyasi, Maven repo, minSdk | `android/build.gradle`                           |
| Android permission                        | `android/src/main/AndroidManifest.xml`           |
| README                                    | `README.md`                                      |
| Release retsepti                          | `docs/RELEASING.md` (bu fayl)                    |
| ESLint rules                              | `.eslintrc.js`                                   |
| Prettier stili                            | `.prettierrc.js`                                 |

---

## 2. Loop: lokal sinash

`rn-myid`'dagi o'zgartirishni consumer loyihada (masalan `rn-my-business-mob`) real sinash uchun `file:` link ishlating:

### Bir marta setup

```bash
cd /path/to/rn-my-business-mob
yarn add "rn-myid@file:/Users/a.ziyodovbrb-tech.uz/Desktop/works/react-native-myid"
```

Bu `package.json`'da:

```json
"rn-myid": "file:/Users/.../react-native-myid"
```

qatorini yaratadi. Yarn har `yarn install` paytida paketni lokal papkadan oladi.

### Sikl

1. `rn-myid/src/...`'da o'zgartirish
2. `cd rn-myid && yarn prepare` — lib/ qayta quriladi
3. `cd rn-my-business-mob && yarn install` yoki lokal linkni majburan yangilash uchun:
   ```bash
   rm -rf node_modules/rn-myid
   yarn install
   ```
4. iOS uchun qo'shimcha:
   ```bash
   cd ios && pod install && cd ..
   ```
5. App'ni rebuild: `yarn ios` yoki `yarn android`.

### Native kod o'zgarishi

Native (Swift/Kotlin) o'zgartirgan bo'lsangiz Metro reload yetarli emas — **to'liq rebuild** kerak. iOS'da Xcode'ni tozalab (Shift+Cmd+K) qayta quring.

### Sikl tugagach

Real release qilmoqchi bo'lsangiz:

```bash
cd /path/to/rn-my-business-mob
yarn add "rn-myid@github:AbdurakhmonZiyodov/rn-myid#vX.Y.Z"
```

(lokal `file:` linkni rasmiy tag'ga almashtiring)

---

## 3. Pre-commit hooks

Har `git commit` qilganda husky avtomatik ishga tushadi:

- `.ts` / `.tsx` fayllar → `prettier --write` + `eslint --fix`
- `.js`/`.jsx`/`.json`/`.md` fayllar → `prettier --write`

Eslint xato bo'lib, auto-fix qila olmasa — commit to'xtaydi. Xatoni qo'lda tuzating va qayta commit qiling.

Husky'ni o'chirishga **hojat yo'q**. Agar emergency bo'lsa:

```bash
git commit --no-verify -m "..."
```

Lekin bundan qochishga harakat qiling — staged kodni toza saqlash husky'ning vazifasi.

---

## 4. Native SDK versiyasini yangilash

MyID SDK yangilansa (masalan iOS `3.1.3 → 3.2.0`):

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

So'ng:

1. Consumer loyihada `cd ios && pod install` va `./gradlew :app:assembleDebug` bilan build yashil bo'lishini tekshiring.
2. Real qurilmada MyID flow'ni sinang (ayniqsa camera + doc capture).
3. Agar SDK breaking change chiqargan bo'lsa → **`major` bump**. Aks holda `patch` yoki `minor`.

---

## 5. Yangi TypeScript type qo'shish

Misol: `MyIdResult`'ga `issuedAt: string` qo'shmoqchisiz.

1. `src/types.ts`'da:
   ```ts
   export interface MyIdResult {
     code: string;
     image?: string;
     imageFormat?: 'jpeg' | 'png';
     issuedAt?: string; // ← yangi
   }
   ```
2. `src/MyId.ts`'ning `onSuccess` emitterida qiymatni uzatish (agar native layer beradigan bo'lsa):
   ```ts
   resolve({
     code: event.code,
     image: event.image,
     issuedAt: event.issuedAt,    // ← yangi
     ...
   });
   ```
3. Native (iOS Swift, Android Kotlin)'da `onSuccess` event payload'iga `issuedAt` qo'shing.
4. `yarn typecheck && yarn lint && yarn prepare` — hammasi yashil.
5. `yarn release minor` (yangi optional field — backward compatible).

---

## 6. Yangi error kind qo'shish

`src/errors.ts`:

```ts
export type MyIdErrorKind = 'NOT_CONFIGURED' | 'UNAVAILABLE' | 'ALREADY_RUNNING' | 'USER_EXITED' | 'SDK_ERROR' | 'NETWORK_ERROR'; // ← yangi
```

`src/MyId.ts`'ning native error handler'ida tegishli switch qo'shing.

`yarn release minor`.

---

## 7. Breaking change

Misol: `MyId.start` signatura o'zgardi (`locale` → `lang`).

1. Kod o'zgartirish
2. README'ni yangilash — consumer migratsiya retsepti qo'shish
3. `docs/MIGRATING-CONSUMER.md` ni yangilash
4. `yarn release major`
5. Barcha consumer loyihalarda bir marta migrate qilish kerak bo'ladi

---

## Muammolar

### "husky: command not found" `yarn install` paytida

`yarn install --ignore-scripts` bilan ishlatmaganingizga ishonch hosil qiling. Husky `prepare` lifecycle hook'ida o'rnatiladi.

### `yarn prepare` xato: "tsc: command not found"

`yarn install` qilmagansiz yoki node_modules buzilgan:

```bash
rm -rf node_modules yarn.lock
yarn install
```

### iOS build: "MyIdSDK not found"

`cd ios && pod install` — pod sync qilinmagan.

### Android build: "Maven repo unreachable"

`artifactory.aigroup.uz`'ga kira olmayapsiz (VPN yoki network). Internet tekshiring.
