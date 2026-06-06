 = "C:\Users\lalit\.gemini\antigravity-ide\brain\1e3cb9eb-02df-4758-bd0f-37878f3e4484\.system_generated\logs\transcript.jsonl"
 = "C:\Users\lalit\Documentos\BUSINESS-CONTROL\business-control\business-control\frontend\src\pages\home\ProductDetail.jsx"

 = ""
 = ""

foreach ($line in Get-Content $transcriptPath) {
    if ($line -match "Showing lines 1 to 800") {
        $json = $line | ConvertFrom-Json
        $content1 = $json.content
        break
    }
}

foreach ($line in Get-Content $transcriptPath) {
    if ($line -match "Showing lines 800 to 803") {
        $json = $line | ConvertFrom-Json
        $content2 = $json.content
        break
    }
}

$fileContent = @()

foreach ($l in $content1 -split "
") {
    if ($l -match "^\d+:(.*)") {
        $fileContent += $matches[1] -replace "^ ", ""
    }
}

foreach ($l in $content2 -split "
") {
    if ($l -match "^800:") { continue }
    if ($l -match "^\d+:(.*)") {
        $fileContent += $matches[1] -replace "^ ", ""
    }
}

$fileContent | Out-File -FilePath $targetPath -Encoding utf8
Write-Host "Recovered lines:" $fileContent.Length
