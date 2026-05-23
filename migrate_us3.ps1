$srcRoot = "D:\projects\web\initiat2.0\frontend\src"

# ---------- T015: CharacterCreation ----------
# Move CSS file
Move-Item "$srcRoot\styles\CharacterCreation.css" "$srcRoot\components\CharacterCreation\CharacterWizard.module.css"

$f = "$srcRoot\components\CharacterCreation\CharacterWizard.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '../../styles/CharacterCreation\.css';", "import styles from './CharacterWizard.module.css';"
# Exclude App.css globals + sr-only from conversion
$globalsCW = @('sheet-preview-toolbar','sheet-main','core-stats-bar','error-message','btn-print-sheet','sr-only','btn','btn-secondary','btn-primary')
$ev = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m); $cl = $m.Groups[1].Value
    if ($globalsCW -contains $cl) { return $m.Value }
    return "className={styles['$cl']}"
}
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "CharacterWizard.tsx done"

# ---------- T016: CharacterEditor ----------
Move-Item "$srcRoot\styles\CharacterEditor.css" "$srcRoot\components\CharacterEditing\CharacterEditor.module.css"
$f = "$srcRoot\components\CharacterEditing\CharacterEditor.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '../../styles/CharacterEditor\.css';", "import styles from './CharacterEditor.module.css';"
$ev2 = [System.Text.RegularExpressions.MatchEvaluator]{ param($m); "className={styles['$($m.Groups[1].Value)']}" }
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev2)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "CharacterEditor.tsx done"

# ---------- T017: CharacterList ----------
Move-Item "$srcRoot\styles\CharacterList.css" "$srcRoot\pages\CharacterList.module.css"
$f = "$srcRoot\pages\CharacterList.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '\.\./styles/CharacterList\.css';", "import styles from './CharacterList.module.css';"
$ev3 = [System.Text.RegularExpressions.MatchEvaluator]{ param($m); "className={styles['$($m.Groups[1].Value)']}" }
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev3)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "CharacterList.tsx done"

# ---------- T018: Layout ----------
Move-Item "$srcRoot\styles\Layout.css" "$srcRoot\components\Layout.module.css"
$f = "$srcRoot\components\Layout.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '\.\./styles/Layout\.css';", "import styles from './Layout.module.css';"
$ev4 = [System.Text.RegularExpressions.MatchEvaluator]{ param($m); "className={styles['$($m.Groups[1].Value)']}" }
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev4)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "Layout.tsx done"

# ---------- T019: LoginPage + RegisterPage (shared module) ----------
Move-Item "$srcRoot\styles\LoginPage.css" "$srcRoot\pages\auth\LoginPage.module.css"
# Globals to exclude in LoginPage/RegisterPage
$globalsLP = @('opacity-25','opacity-75')
# LoginPage.tsx
$f = "$srcRoot\pages\auth\LoginPage.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '../../styles/LoginPage\.css';", "import styles from './LoginPage.module.css';"
$ev5 = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m); $cl = $m.Groups[1].Value
    if ($globalsLP -contains $cl) { return $m.Value }
    return "className={styles['$cl']}"
}
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev5)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "LoginPage.tsx done"
# RegisterPage.tsx
$f = "$srcRoot\pages\auth\RegisterPage.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '../../styles/LoginPage\.css';", "import styles from './LoginPage.module.css';"
$ev6 = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m); $cl = $m.Groups[1].Value
    if ($globalsLP -contains $cl) { return $m.Value }
    return "className={styles['$cl']}"
}
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev6)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "RegisterPage.tsx done"

# ---------- T020: HelpPage ----------
Rename-Item "$srcRoot\pages\HelpPage.css" "HelpPage.module.css"
$f = "$srcRoot\pages\HelpPage.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
$c = $c -replace "import '\./HelpPage\.css';", "import styles from './HelpPage.module.css';"
$ev7 = [System.Text.RegularExpressions.MatchEvaluator]{ param($m); "className={styles['$($m.Groups[1].Value)']}" }
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev7)
Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "HelpPage.tsx done"
