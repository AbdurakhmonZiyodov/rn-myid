# Yangi loyihani `rn-myid`'ga ko'chirish

`rn-myid` ishxonadagi 5–8 ta RN loyihalarning har birida MyID kodini bitta joyga birlashtirish uchun yaratilgan. Bu hujjat yangi consumer loyihani (masalan `my-order-app`, `chatxo-mobile` va h.k.) ichki MyID native modulidan `rn-myid` paketiga ko'chirish retseptini beradi.

---

## 0. Tayyorgarlik

Loyiha **React Native ≥ 0.76.9** bo'lishi kerak, **new architecture yoqilgan** bo'lishi tavsiya etiladi (`newArchEnabled=true`). Eski RN versiyalarida ham ishlashi mumkin, lekin sinab ko'rilmagan.

Migratsiya uchun alohida branch oching:

```bash
git checkout -b feat/migrate-to-rn-myid
```

---

## 1. Paketni o'rnatish

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.2
cd ios && pod install && cd ..
```

> `#v1.0.2` — eng so'nggi tag. https://github.com/AbdurakhmonZiyodov/rn-myid/tags

---

## 2. Eski iOS native kodni olib tashlash

### 2.1. Podfile

`ios/Podfile`'dan quyidagi qatorni olib tashlang:

```ruby
pod 'MyIdSDK', '~> 3.1.3'
```

MyIdSDK endi `rn-myid` orqali transitive pod sifatida keladi.

### 2.2. Swift/Obj-C fayllar

O'chiring (loyihada bu nomlar boshqacha bo'lishi mumkin — `MyIdModule`, `MyIDBridge` va h.k. deb qidiring):

```bash
rm ios/MyIdModule.swift ios/MyIdModule.m
```

### 2.3. Xcode project'dan reference'larni olib tashlash

`project.pbxproj` faylda MyIdModule ga ishoralar qoladi → build xato bo'ladi. Ikki variant:

**Variant A (avtomatik, ruby gem orqali)**:

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

**Variant B (qo'lda)**: Xcode'da loyihani oching, `MyIdModule.swift` va `MyIdModule.m`'ni Project Navigator'dan o'chiring (Delete → Remove References).

### 2.4. Podfile.lock'ni yangilash

```bash
cd ios && pod install && cd ..
```

`Podfile.lock`'da endi `MyIdSDK` `rn-myid` ning dependency'si sifatida ko'rinishi kerak:

```
- rn-myid (1.0.2):
  - MyIdSDK (~> 3.1.3)
```

---

## 3. Eski Android native kodni olib tashlash

### 3.1. Gradle dependencies

`android/app/build.gradle`'dan olib tashlang:

```gradle
debugImplementation("uz.myid.sdk.capture:myid-capture-sdk-debug:3.1.5")
releaseImplementation("uz.myid.sdk.capture:myid-capture-sdk:3.1.5")
```

Bular endi `rn-myid`'dan transitively keladi. Artifactory maven repo (`https://artifactory.aigroup.uz:443/artifactory/myid`) ham paket tomondan `rootProject.allprojects { repositories { ... } }` orqali avtomatik qo'shiladi — consumer'ning `android/build.gradle`'iga hech narsa yozishga hojat yo'q.

> **Agar `yarn android` build'da `Could not find uz.myid.sdk.capture:...` xatosi chiqsa** — consumer'ning `android/settings.gradle`'ida `dependencyResolutionManagement.repositoriesMode = FAIL_ON_PROJECT_REPOS` yoqilgan bo'lishi mumkin. Bu holda o'sha fayldagi `dependencyResolutionManagement.repositories` blokiga qo'lda qo'shing:
>
> ```gradle
> maven { url "https://artifactory.aigroup.uz:443/artifactory/myid" }
> ```

### 3.2. Kotlin fayllar

O'chiring (nomlar loyihaga qarab farqli bo'lishi mumkin):

```bash
rm android/app/src/main/java/com/<app-namespace>/MyIdModule.kt
rm android/app/src/main/java/com/<app-namespace>/ReactPackage.kt   # agar faqat MyID uchun bo'lsa
```

### 3.3. `MainApplication.kt`

Agar `getPackages()` ichida MyID uchun qo'lda `add(MyIdPackage())` yoki `add(ReactPackage())` qatori bo'lsa — olib tashlang. Autolinking `rn-myid`'ni o'zi topadi.

---

## 4. JS/TS konfiguratsiya

### 4.1. MyID config constantlari

Loyihangizda `clientHash` va `clientHashId` qayerda saqlanayotganini toping (odatda `src/enums/myId.js` yoki `src/config/`'da). Saqlang. Olib tashlang:

- `clientId` (hech qachon ishlatilmagan, dead code)
- `buildMode` (endi kerak emas)

### 4.2. App bootstrap

App'ning eng yuqori joyida (masalan `App.tsx` yoki `src/app/app.model.ts`) module-level'da `MyId.configure()` chaqiring:

```ts
import {MyId} from 'rn-myid';
import {clientHash, clientHashId} from '@/enums/myId';

MyId.configure({
  clientHash,
  clientHashId,
  environment: 'production', // MUHIM: __DEV__ bilan bog'lamang!
});
```

> ⚠️ **`environment: __DEV__ ? 'debug' : 'production'` qilmang.** `'debug'` MyID sandbox environmentni tanlaydi. Sizning `sessionId` backend'dan production MyID uchun chiqadi → SDK ochilib darhol yopilib ketadi. Doim `'production'` qoldiring (yoki butunlay tashlab yuboring — default shunday).

### 4.3. MY_ID_EVENTS enum va dead flaglar

Loyihada `MY_ID_EVENTS` enum fayli bo'lsa (`constants/my-id.ts` yoki shunga o'xshash) — o'chiring. Endi kerak emas.

`StorageKeys.MY_ID_ENTERED` va unga o'xshash dead flaglar bo'lsa — ularni ham olib tashlang.

---

## 5. Call-site'larni Promise API'ga ko'chirish

Har bir `MyIdModule.startMyId(...)` chaqiruvini `MyId.start(...)` Promise API'ga ko'chiring. Pattern:

### Eski kod (olib tashlanadi):

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

### Yangi kod:

```ts
import {MyId, MyIdError} from 'rn-myid';

async function handleStart() {
  if (!sessionId) return;
  setLoading(true);
  try {
    const {code} = await MyId.start({sessionId, locale: language});
    await onSuccess(code); // sizning onSuccess logikangiz
  } catch (e) {
    if (e instanceof MyIdError && e.kind === 'USER_EXITED') {
      // user bekor qildi — toast ko'rsating, boshqa hech narsa qilmang
      return;
    }
    showMessage({type: 'danger', message: (e as Error).message});
  } finally {
    setLoading(false);
  }
}
```

**Sezilarli farqlar**:

- `setTimeout(200)` yo'q — paket o'zi boshqaradi.
- `NativeEventEmitter` yo'q — Promise lifecycle'ni avtomatik boshqaradi.
- `useEffect([])` bilan stale-closure bug yo'q.
- Double-tap himoyasi avtomatik (`ALREADY_RUNNING` error).
- `USER_EXITED` idiomatik rejection — `if (e.kind === 'USER_EXITED') return`.

---

## 6. Typecheck + Lint

```bash
yarn tsc --noEmit
yarn lint
```

Agar xatolar chiqsa — odatda import qolib ketgan (`NativeEventEmitter`, `MY_ID_EVENTS`) yoki `MyIdModule` destructuring'ni olib tashlash esdan chiqqan.

---

## 7. Sinash

**iOS**:

```bash
yarn ios
# yoki haqiqiy qurilmada:
yarn ios:device
```

**Android**:

```bash
yarn android
# yoki haqiqiy qurilmada:
adb devices
yarn android
```

Ikkala platformada MyID flowning 3 ta holatini sinang:

1. **Success** — kod qaytadi, backend sync bo'ladi.
2. **User exit** — X tugmasini bosing, toast ko'rinadi, ekran joyida qoladi.
3. **SDK error** — internet uzish yoki boshqa xato, error toast chiqadi.

---

## 8. Commit va PR

```bash
git add -A
git commit -m "refactor: migrate MyID to rn-myid package"
git push origin feat/migrate-to-rn-myid
```

PR ochib review'ga jo'nating. Merge'dan oldin yana bir marta real qurilmada sinash yaxshi odat.

---

## Muammolar

### `MyId.start` chaqiruvi darhol `UNAVAILABLE` reject bo'ladi

- iOS: `pod install` qilinmagan yoki app rebuild qilinmagan. `yarn ios`'ni qayta yurgizing.
- Android: `MainApplication.kt`'da qo'lda `add(ReactPackage())` qoldirib qo'ygansiz va u eski MyID package'ga ishora qilmoqda. O'chiring.

### SDK ochiladi, darhol yopiladi (no error)

`environment: 'debug'` sababli. `MyId.configure`'da `environment: 'production'` ga o'zgartiring.

### iOS build xato: "MyIdModule.swift not found"

Xcode project'dan reference olib tashlanmagan. 2.3 bo'limni qayta bajaring.

### Android build xato: duplicate MyIdSDK classes

Eski gradle dep qoldi. 3.1 bo'limni tekshiring.
