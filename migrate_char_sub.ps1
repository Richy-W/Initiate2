$src = "D:\projects\web\initiat2.0\frontend\src\components\Character"
$globalsChar = @('btn', 'loading', 'error')

# ── SavingThrows.tsx ──────────────────────────────────────
$f = "$src\SavingThrows.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
# Add import after first import line
$c = $c -replace "(^import React.*\r?\n)", "`$1import styles from './CharacterSheet.module.css';`n"
# Bulk single-class conversion
$ev = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m); $cl = $m.Groups[1].Value
    if ($globalsChar -contains $cl) { return $m.Value }
    return "className={styles['$cl']}"
}
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "SavingThrows.tsx import + bulk done"

# ── SkillRolls.tsx ────────────────────────────────────────
$f = "$src\SkillRolls.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "(^import React.*\r?\n)", "`$1import styles from './CharacterSheet.module.css';`n"
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "SkillRolls.tsx import + bulk done"

# ── AttackRolls.tsx ───────────────────────────────────────
$f = "$src\AttackRolls.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "(^import React.*\r?\n)", "`$1import styles from './CharacterSheet.module.css';`n"
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "AttackRolls.tsx import + bulk done"
