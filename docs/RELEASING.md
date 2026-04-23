# Reliz chiqarish — `rn-myid`

Har safar `rn-myid`'ga o'zgartirish kirgizib, boshqa loyihalarga yetkazmoqchi bo'lsangiz shuni qiling.

---

## TL;DR

```bash
# 1. Kod o'zgartirish
# ... src/ yoki ios/ yoki android/ da o'zgarishlar qiling
git add -A
git commit -m "fix: ..."          # husky avtomatik format/lint qiladi
git push origin main

# 2. Release
yarn release patch                 # 1.0.2 → 1.0.3 (bugfix, doc, kichik tuzatish)
# yoki
yarn release minor                 # 1.0.2 → 1.1.0 (yangi API, eskisi ishlayveradi)
# yoki
yarn release major                 # 1.0.2 → 2.0.0 (breaking change)
# yoki interactive:
yarn release                       # CLI so'raydi: patch/minor/major

# 3. Har bir consumer loyihada
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.3
cd ios && pod install
```

---

## Qachon qaysi bumpni tanlash

| Misol                                                                             | Qaysi bump |
| --------------------------------------------------------------------------------- | ---------- |
| README typo, internal refactor, bir baytlik bugfix, log xabari o'zgarishi         | `patch`    |
| `MyId.start`'ga yangi optional param, yangi public method, yangi event            | `minor`    |
| `MyId.start` signaturasi o'zgarishi, method olib tashlash, xulqiy breaking change | `major`    |

**Qoida**: agar consumer kod yozishi kerak bo'lsa → `major`. Agar hech narsa o'zgartirmasdan yangi feature ishlatsa → `minor`. Agar hech narsa ko'rmasa → `patch`.

---

## Tayyorgarlik (release-it shart qiladi)

`yarn release` buyrug'i quyidagilarni avtomatik tekshiradi va yashil bo'lmasa to'xtaydi:

1. **`main` branch'da turibsiz** — feature branch'dan release qilib bo'lmaydi.
2. **Working tree toza** — commit qilinmagan o'zgarishlar yo'q. Agar WIP bo'lsa:
   ```bash
   git stash
   yarn release patch
   git stash pop
   ```
3. **`yarn typecheck` xatosiz** (TS).
4. **`yarn lint` xatosiz** (ESLint).

---

## Avvalroq tekshirish (dry-run)

Haqiqiy release qilmasdan nima bo'lishini ko'rish uchun:

```bash
yarn release:dry --ci --increment=patch
```

Natijada terminal:

- Yangi version nima bo'lishini
- Qaysi commitlar kiradigan changelog'ni
- Qaysi buyruqlar ishga tushishini
  — ko'rsatadi, lekin hech narsa o'zgartirmaydi.

---

## Release ichida nima bo'ladi (avtomatik)

`yarn release patch` ni bosganingizdan keyin:

```
1. before:init
   ↓
   yarn typecheck      ← xato bo'lsa to'xtaydi
   yarn lint           ← xato bo'lsa to'xtaydi

2. version bump
   ↓
   package.json: 1.0.2 → 1.0.3

3. after:bump
   ↓
   yarn prepare                               ← lib/ qayta quriladi (bob)
   node ./scripts/update-readme-version.js    ← README'da v1.0.2 → v1.0.3

4. git commit
   ↓
   hammasi bitta commit: "chore: release v1.0.3"
   (package.json + lib/ + README.md)

5. git tag
   ↓
   tag: v1.0.3

6. git push --follow-tags
   ↓
   main va tag — ikkalasi pushlanadi
```

Ozdan GitHub'da yangi tag ko'rinadi: https://github.com/AbdurakhmonZiyodov/rn-myid/tags

---

## Consumer loyihalarni yangilash

Har bir `rn-myid` ishlatadigan loyihada (masalan `rn-my-business-mob`):

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.3
cd ios && pod install                # iOS loyihalarida
# Android uchun qo'shimcha hech narsa kerak emas — autolinking ishlaydi
```

Keyin app'ni real qurilmada (yoki simulyatorda) sinaydi va ishi tugaydi.

---

## Muammolar

### "No upstream configured for current branch"

Agar birinchi marta release qilayotgan bo'lsangiz:

```bash
git branch --set-upstream-to=origin/main main
```

### "Please stash or commit your changes"

Working tree toza bo'lishi kerak:

```bash
git status           # nima qolganini ko'rish
git stash            # o'zgarishlarni vaqtincha yashirish
yarn release patch   # release qilish
git stash pop        # keyin qaytarib olish
```

### "npm ERR! version not found" yoki "husky ishlamayapti"

Dependencies yangilanmagan bo'lishi mumkin:

```bash
rm -rf node_modules yarn.lock
yarn install
```

### README o'z-o'zidan yangilanmadi

Skriptni qo'lda yurgizing:

```bash
node ./scripts/update-readme-version.js
```

---

## Nima qilmaslik kerak

- ❌ **`git tag` va `git push tag` qo'lda urmang** — `yarn release` buni o'zi qiladi. Ikki marta qilsangiz konflikt bo'ladi.
- ❌ **`package.json`'da `version`'ni qo'lda o'zgartirmang** — `release-it` uni avtomatik bump qiladi. Aralash bo'lsa kiyinchiliklar chiqadi.
- ❌ **Force-push qilmang** — eski tag'lar consumerlarga pin qilingan.
- ❌ **`npm publish` qilmang** — bizda npm registry yo'q, faqat GitHub git-URL orqali tarqatamiz.
