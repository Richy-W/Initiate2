$f = "D:\projects\web\initiat2.0\frontend\src\components\Character\Inventory.tsx"
$c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)

# 1. Update import
$c = $c -replace "import '\./Inventory\.css';", "import styles from './Inventory.module.css';"

# 2. Convert all simple single-class className="xxx"
$ev = [System.Text.RegularExpressions.MatchEvaluator]{
    param($m)
    $cl = $m.Groups[1].Value
    return "className={styles['$cl']}"
}
$c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)

Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
Write-Host "Inventory.tsx done"
