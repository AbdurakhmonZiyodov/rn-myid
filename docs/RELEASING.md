# Releasing `rn-myid`

Do this whenever you've made a change to `rn-myid` and need the other projects to pick it up.

---

## TL;DR

```bash
# 1. Make the change
# ... edit files in src/ or ios/ or android/
git add -A
git commit -m "fix: ..."          # husky auto-formats and auto-lints staged files
git push origin main

# 2. Release
yarn release patch                 # 1.0.2 → 1.0.3 (bugfix, doc, tiny tweak)
# or
yarn release minor                 # 1.0.2 → 1.1.0 (new API, backwards compatible)
# or
yarn release major                 # 1.0.2 → 2.0.0 (breaking change)
# or interactive:
yarn release                       # prompts for patch/minor/major

# 3. In every consumer project
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.3
cd ios && pod install
```

---

## Picking the bump level

| Example                                                                                | Bump    |
| -------------------------------------------------------------------------------------- | ------- |
| README typo, internal refactor, one-line bugfix, log message change                    | `patch` |
| New optional param on `MyId.start`, new public method, new event                       | `minor` |
| `MyId.start` signature change, method removed, behavior change consumers must adapt to | `major` |

**Rule of thumb**: if consumers have to write code → `major`. If consumers use a new feature without changing existing code → `minor`. If consumers notice nothing → `patch`.

---

## Preconditions (enforced by release-it)

`yarn release` checks the following automatically and aborts if any fails:

1. **You are on `main`** — release from a feature branch is rejected.
2. **Working tree is clean** — no uncommitted changes. If you have WIP:
   ```bash
   git stash
   yarn release patch
   git stash pop
   ```
3. **`yarn typecheck` passes** (TS).
4. **`yarn lint` passes** (ESLint).

---

## Preview first (dry-run)

To see what would happen without actually releasing:

```bash
yarn release:dry --ci --increment=patch
```

The terminal shows:

- What the new version would be
- The changelog of commits that would be included
- Which commands would run

…but changes nothing.

---

## What happens during a release (automatic)

After you run `yarn release patch`:

```
1. before:init
   ↓
   yarn typecheck      ← aborts on failure
   yarn lint           ← aborts on failure

2. version bump
   ↓
   package.json: 1.0.2 → 1.0.3

3. after:bump
   ↓
   yarn prepare                               ← lib/ is rebuilt (bob)
   node ./scripts/update-readme-version.js    ← README: v1.0.2 → v1.0.3

4. git commit
   ↓
   single commit: "chore: release v1.0.3"
   (package.json + lib/ + README.md)

5. git tag
   ↓
   tag: v1.0.3

6. git push --follow-tags
   ↓
   main and the tag are both pushed
```

Seconds later the new tag appears on GitHub: https://github.com/AbdurakhmonZiyodov/rn-myid/tags

---

## Updating consumer projects

In every project that uses `rn-myid` (e.g. `rn-my-business-mob`):

```bash
yarn add rn-myid@github:AbdurakhmonZiyodov/rn-myid#v1.0.3
cd ios && pod install                # iOS only
# Android needs nothing extra — autolinking handles it
```

Then rebuild the app on a real device (or simulator) and you're done.

---

## Troubleshooting

### "No upstream configured for current branch"

First time releasing from a fresh clone:

```bash
git branch --set-upstream-to=origin/main main
```

### "Please stash or commit your changes"

Working tree must be clean:

```bash
git status           # see what's dirty
git stash            # park the changes
yarn release patch   # release
git stash pop        # bring them back
```

### "npm ERR! version not found" or "husky not working"

Dependencies may be stale:

```bash
rm -rf node_modules yarn.lock
yarn install
```

### README wasn't auto-updated

Run the script manually:

```bash
node ./scripts/update-readme-version.js
```

---

## Don't do these

- ❌ **Don't `git tag` + `git push --tags` manually** — `yarn release` does it. Doing it twice causes a tag conflict.
- ❌ **Don't bump `version` in `package.json` by hand** — `release-it` bumps it automatically. Mixing manual and automatic bumps breaks the lockstep.
- ❌ **Don't force-push `main`** — existing tags are pinned by consumers, rewriting history breaks their installs.
- ❌ **Don't `npm publish`** — we don't use the npm registry, only GitHub git-URL installs.
