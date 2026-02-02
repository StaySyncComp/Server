function Show-Tree {
    param (
        [string]$Path = ".",
        [string]$Indent = ""
    )

    $items = Get-ChildItem -Path $Path -Force | Where-Object { $_.Name -ne 'node_modules' -and $_.Name -ne '.git' -and $_.Name -ne '.vs' }
    $count = $items.Count
    $i = 0

    foreach ($item in $items) {
        $i++
        $isLast = $i -eq $count
        $marker = if ($isLast) { "\-- " } else { "+-- " }
        
        Write-Output "$Indent$marker$($item.Name)"

        if ($item.PSIsContainer) {
            $nextIndent = if ($isLast) { "$Indent    " } else { "$Indent|   " }
            Show-Tree -Path $item.FullName -Indent $nextIndent
        }
    }
}

$outputFile = "tree.txt"
$treeOutput = & {
    (Get-Item .).Name
    Show-Tree -Path .
}

$treeOutput | Out-File -FilePath $outputFile -Encoding utf8
$treeOutput
