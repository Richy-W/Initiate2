# Branch Recovery Reference

Created: 2026-04-22  
Purpose: Snapshot of branch state before merging `001-dnd-web-app` into `main`.  
If something goes wrong, paste this file into a new Copilot chat and ask for help recovering.

---

## Branch State at Time of Merge

| Branch | Tip Commit | Contains |
|--------|-----------|----------|
| `origin/main` | `d0300df` | Initial commit + CSS Modules migration (PR #2) only |
| `origin/001-dnd-web-app` | `02ad568` | Full app: character creation, campaigns, combat, constitution compliance, human feat fix (PRs #1, #3) |
| `origin/003-fix-human-origin-feat-dropdown` | `cd0ee16` | Human origin feat dropdown (already merged into 001) |
| local `main` | `1a9f624` | Initial commit only (never pulled) |
| local `004-spells-integration` | `1a9f624` | Initial commit + specs/004 working files |

### Key Commit SHAs

```
1a9f624  Initial commit from Specify template  (common ancestor of all branches)
36c1419  feat: Complete D&D 2024 Character Creation Web App
e99f147  feat: campaign invite codes, accept/decline, proficiency fix, weapon mastery, Tough feat HP
6745f4c  chore: enforce constitution compliance (WebSocket + cross-boundary imports)
90dfba2  Merge pull request #1 from Richy-W/chore/constitution-compliance
e2ec61c  feat(characters): add tool_proficiencies JSONField to Character model
8899e21  test(characters): add TDD contract tests for species-options proficiency assignment
cd0ee16  feat(human): replace origin feat text input with select dropdown
02ad568  Merge pull request #3 from Richy-W/003-fix-human-origin-feat-dropdown  ← 001 tip
d0300df  Merge pull request #2 from Richy-W/002-css-modules-migration             ← origin/main tip
```

---

## Recovery Scenarios

### Scenario A — Merge went wrong, need to abort mid-merge
```powershell
git merge --abort
# You are back to the pre-merge state on main
```

### Scenario B — Merge was committed but is broken, need to undo the merge commit
```powershell
# Find the merge commit SHA
git log --oneline -5

# Reset main back to before the merge (origin/main tip before the bad merge)
git reset --hard d0300df   # or whatever the pre-merge tip was

# Force push ONLY if you haven't shared the bad state with any collaborator
# git push --force origin main   ← ask a human first before running this
```

### Scenario C — main was pushed with bad content, need to restore origin/main
```powershell
# Restore origin/main to the known-good state before the merge
git push --force origin d0300df:main
# Then restore 001 as a fallback baseline
git checkout -b recovery-from-001 origin/001-dnd-web-app
```

### Scenario D — 004-spells-integration branch lost local work (specs/ files)
The specs are plain markdown — they are not tracked by origin/main or origin/001.
Check local branch first:
```powershell
git checkout 004-spells-integration
ls specs/004-spells-integration/
```
If the branch is gone:
```powershell
git reflog | Select-Object -First 20
# Find the last commit SHA on 004-spells-integration and checkout
git checkout -b 004-spells-integration <sha-from-reflog>
```

### Scenario E — Need to get back to a fully working baseline without the merge
```powershell
# The safest known-working state is origin/001-dnd-web-app
git checkout -b working-baseline origin/001-dnd-web-app

# CSS modules are on origin/main — cherry-pick the CSS modules merge commit
git cherry-pick d0300df
# Resolve any conflicts, then continue
git cherry-pick --continue
```

---

## What the Merge Does

Merging `origin/001-dnd-web-app` into `main` combines:
- **From 001**: All Django backend (Character, Campaign, Combat apps), React frontend (CharacterSheet, CharacterCreation, CombatTracker), constitution compliance refactor, human feat dropdown fix
- **From main (002)**: CSS Modules migration for frontend components

**Expected conflict zones** (files touched by both branches):
- `frontend/src/App.css` — global styles
- `frontend/src/components/Character/CharacterSheet.*` — sheet component + styles
- `frontend/src/components/CharacterCreation/*` — wizard components + styles
- Any `.css` file that was globally styled in 001 and converted to `.module.css` in 002

**Resolution strategy**: Keep the CSS Module version (`.module.css`) for component styles, keep the global version for truly global tokens in `App.css` and `index.css`.

---

## After a Successful Merge

1. `origin/main` should point to the new merge commit containing all work
2. Change GitHub default branch: **Settings → General → Default branch** → switch from `001-dnd-web-app` to `main`
3. `001-dnd-web-app` is kept open on GitHub as a permanent safety reference — do not delete it
4. Rebase all active feature branches (`004-spells-integration`) onto the new `main`

---

## Context for New Chat Session

If you need to give this file to a new Copilot session for recovery:
1. Open this file in VS Code
2. Start a new chat and say: "Here is a recovery reference doc. I need help with [describe the problem]"
3. Attach this file as context
