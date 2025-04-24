$ErrorActionPreference = "Stop"

# Create a temporary directory for downloads
$tempDir = Join-Path $env:TEMP "icon-download"
New-Item -ItemType Directory -Path $tempDir -Force | Out-Null

# Download a sample calendar icon (this is a free icon from icons8.com)
$iconUrl = "https://img.icons8.com/fluency/96/calendar.png"
$downloadPath = Join-Path $tempDir "calendar.png"
Invoke-WebRequest -Uri $iconUrl -OutFile $downloadPath

# Define the icon directory
$iconDir = "C:\Users\HP1\Dev\RCTD\calendar-todo-app\src-tauri\icons"

# Function to resize image
function Resize-Image {
    param (
        [string]$InputFile,
        [string]$OutputFile,
        [int]$Width,
        [int]$Height
    )
    
    Add-Type -AssemblyName System.Drawing
    $img = [System.Drawing.Image]::FromFile($InputFile)
    $canvas = New-Object System.Drawing.Bitmap($Width, $Height)
    $graph = [System.Drawing.Graphics]::FromImage($canvas)
    $graph.DrawImage($img, 0, 0, $Width, $Height)
    $canvas.Save($OutputFile)
    $graph.Dispose()
    $canvas.Dispose()
    $img.Dispose()
}

# Create the various icon sizes
Resize-Image -InputFile $downloadPath -OutputFile (Join-Path $iconDir "32x32.png") -Width 32 -Height 32
Resize-Image -InputFile $downloadPath -OutputFile (Join-Path $iconDir "128x128.png") -Width 128 -Height 128
Resize-Image -InputFile $downloadPath -OutputFile (Join-Path $iconDir "128x128@2x.png") -Width 256 -Height 256

Write-Host "PNG icons created successfully!"

# Now convert to .ico file
Add-Type -AssemblyName System.Drawing
$icon = [System.Drawing.Icon]::FromHandle(([System.Drawing.Bitmap]::FromFile($downloadPath)).GetHicon())
$fileStream = New-Object System.IO.FileStream (Join-Path $iconDir "icon.ico"), "OpenOrCreate"
$icon.Save($fileStream)
$fileStream.Close()
$icon.Dispose()

Write-Host "ICO file created successfully!"

# We can't easily create .icns (Mac) files on Windows, so we'll leave that for later or use a placeholder
Write-Host "Note: icon.icns file for macOS was not created as it requires specialized tools."
Write-Host "All icon generation complete!"

# Clean up temp directory
Remove-Item -Path $tempDir -Recurse -Force

# Update tauri.conf.json to use the icons
$configPath = "C:\Users\HP1\Dev\RCTD\calendar-todo-app\src-tauri\tauri.conf.json"
$config = Get-Content -Path $configPath -Raw | ConvertFrom-Json
$config.tauri.bundle.icon = @(
    "icons/32x32.png",
    "icons/128x128.png", 
    "icons/128x128@2x.png", 
    "icons/icon.ico"
)
$config | ConvertTo-Json -Depth 10 | Set-Content -Path $configPath

Write-Host "tauri.conf.json updated to use the newly created icons!"
