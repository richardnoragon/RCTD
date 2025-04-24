# Simple script to create icon files for Tauri
# This script creates actual icon files for a Tauri app

# Create the icons directory if it doesn't exist
$iconDir = ".\src-tauri\icons"
if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force | Out-Null
}

# Create temp directory for downloading
$tempDir = Join-Path $env:TEMP "icon-temp"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

$iconUrl = "https://img.icons8.com/fluency/96/calendar.png"
$downloadPath = Join-Path $tempDir "calendar.png"

try {
    # Download the icon
    Write-Host "Downloading icon from $iconUrl..."
    Invoke-WebRequest -Uri $iconUrl -OutFile $downloadPath
    
    # Add the System.Drawing assembly
    Add-Type -AssemblyName System.Drawing
    
    # Function to resize images
    function Resize-Icon {
        param (
            [string]$InputFile,
            [string]$OutputFile,
            [int]$Width,
            [int]$Height
        )
        
        Write-Host "Creating $OutputFile..."
        $img = [System.Drawing.Image]::FromFile($InputFile)
        $bitmap = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
        $graphics.DrawImage($img, 0, 0, $Width, $Height)
        $bitmap.Save($OutputFile)
        $graphics.Dispose()
        $bitmap.Dispose()
        $img.Dispose()
    }
    
    # Create PNG files of various sizes
    Resize-Icon -InputFile $downloadPath -OutputFile "$iconDir\32x32.png" -Width 32 -Height 32
    Resize-Icon -InputFile $downloadPath -OutputFile "$iconDir\128x128.png" -Width 128 -Height 128
    Resize-Icon -InputFile $downloadPath -OutputFile "$iconDir\128x128@2x.png" -Width 256 -Height 256
    
    # Create .ico file
    Write-Host "Creating icon.ico..."
    $img = [System.Drawing.Image]::FromFile("$iconDir\128x128.png")
    $bitmap = New-Object System.Drawing.Bitmap($img)
    $icon = [System.Drawing.Icon]::FromHandle($bitmap.GetHicon())
    $stream = [System.IO.FileStream]::new("$iconDir\icon.ico", [System.IO.FileMode]::Create)
    $icon.Save($stream)
    $stream.Close()
    $icon.Dispose()
    $bitmap.Dispose()
    $img.Dispose()
    
    # Create a placeholder for macOS icon.icns
    Write-Host "Creating icon.icns placeholder..."
    Copy-Item "$iconDir\128x128@2x.png" -Destination "$iconDir\icon.icns" -Force
    
    Write-Host "Icon files created successfully!"
} 
catch {
    Write-Host "Error: $_"
    Write-Host "Creating empty placeholder files instead..."
    
    # Create empty placeholder files as fallback
    New-Item -ItemType File -Path "$iconDir\32x32.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\128x128.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\128x128@2x.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\icon.ico" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\icon.icns" -Force | Out-Null
}

# Clean up
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

# Update tauri.conf.json
Write-Host "Updating tauri.conf.json..."
$configPath = ".\src-tauri\tauri.conf.json"
$json = Get-Content $configPath -Raw | ConvertFrom-Json

# Update the icon array
$json.tauri.bundle.icon = @(
    "icons/32x32.png",
    "icons/128x128.png",
    "icons/128x128@2x.png",
    "icons/icon.ico",
    "icons/icon.icns"
)

# Save the updated configuration
$json | ConvertTo-Json -Depth 20 | Set-Content $configPath

Write-Host "All done! Icons created and configuration updated."
