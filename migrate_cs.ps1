$f = "D:\projects\web\initiat2.0\frontend\src\components\Character\CharacterSheet.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# 1. Update import
$c = $c -replace "import '../../styles/CharacterSheet\.css';", "import styles from './CharacterSheet.module.css';"

# 2. Convert all simple single-class className="xxx" (exclude globals loading/error)
$ev = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    $cl = $m.Groups[1].Value
    if ($cl -eq 'loading' -or $cl -eq 'error') { return $m.Value }
    return "className={styles['$cl']}"
}
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)

Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "CharacterSheet.tsx done"
