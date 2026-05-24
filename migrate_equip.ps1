$dir = "D:\projects\web\initiat2.0\frontend\src\components\Equipment"

# Rename all 4 CSS files
Rename-Item "$dir\EquipmentBrowser.css"  "EquipmentBrowser.module.css"
Rename-Item "$dir\EquippedItems.css"     "EquippedItems.module.css"
Rename-Item "$dir\ItemDetail.css"        "ItemDetail.module.css"
Rename-Item "$dir\MagicalProperties.css" "MagicalProperties.module.css"

# Update all 4 TSX files: fix imports and convert single-class classNames
$files = @("EquipmentBrowser.tsx","EquippedItems.tsx","ItemDetail.tsx","MagicalProperties.tsx")
foreach ($fname in $files) {
    $f = "$dir\$fname"
    $c = [System.IO.File]::ReadAllText($f, [System.Text.Encoding]::UTF8)
    $mod = $fname -replace '\.tsx$','.module.css'
    # Fix import
    $c = $c -replace "import '\./[A-Za-z]+\.css';", "import styles from './$mod';"
    # Convert simple single-class classNames
    $ev = [System.Text.RegularExpressions.MatchEvaluator]{
        param($m)
        $cl = $m.Groups[1].Value
        return "className={styles['$cl']}"
    }
    $c = [regex]::Replace($c, 'className="([a-z][a-z0-9-]*)"', $ev)
    Set-Content -Path $f -Value $c -Encoding UTF8 -NoNewline
    Write-Host "Done: $fname"
}
