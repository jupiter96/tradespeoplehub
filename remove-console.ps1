# Script to remove console statements from TypeScript/JavaScript files

$paths = @(
    "client/src",
    "routes",
    "models"
)

$totalRemoved = 0
$filesModified = 0

foreach ($path in $paths) {
    if (Test-Path $path) {
        $files = Get-ChildItem -Path $path -Recurse -Include *.ts,*.tsx,*.js,*.jsx
        
        foreach ($file in $files) {
            $content = Get-Content $file.FullName -Raw
            $originalContent = $content
            
            # Remove console.log statements
            $content = $content -replace '(?m)^\s*console\.log\([^)]*\);?\s*$\r?\n?', ''
            
            # Remove console.warn statements
            $content = $content -replace '(?m)^\s*console\.warn\([^)]*\);?\s*$\r?\n?', ''
            
            # Remove console.error statements (keep only in catch blocks)
            $content = $content -replace '(?m)^\s*console\.error\([^)]*\);?\s*$\r?\n?', ''
            
            # Remove console.info statements
            $content = $content -replace '(?m)^\s*console\.info\([^)]*\);?\s*$\r?\n?', ''
            
            # Remove console.debug statements
            $content = $content -replace '(?m)^\s*console\.debug\([^)]*\);?\s*$\r?\n?', ''
            
            if ($content -ne $originalContent) {
                Set-Content -Path $file.FullName -Value $content -NoNewline
                $filesModified++
                $removed = ([regex]::Matches($originalContent, 'console\.')).Count - ([regex]::Matches($content, 'console\.')).Count
                $totalRemoved += $removed
                Write-Host "Modified: $($file.FullName) - Removed $removed console statements"
            }
        }
    }
}

Write-Host "`nTotal files modified: $filesModified"
Write-Host "Total console statements removed: $totalRemoved"

