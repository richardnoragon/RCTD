# Create visually appealing icons for Tauri application
# Requires: PowerShell 5.1+ and System.Drawing assembly

# Create the icon directory if it doesn't exist
$iconDir = ".\src-tauri\icons"
if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force | Out-Null
}

# Create a temp directory for downloading
$tempDir = Join-Path ([System.IO.Path]::GetTempPath()) "tauri-icons-temp"
if (!(Test-Path $tempDir)) {
    New-Item -ItemType Directory -Path $tempDir -Force | Out-Null
}

# Function to download a file
function Download-File {
    param (
        [string]$Url,
        [string]$OutputPath
    )
    
    "Downloading $Url to $OutputPath..."
    $webClient = New-Object System.Net.WebClient
    
    try {
        $webClient.DownloadFile($Url, $OutputPath)
        return $true
    }
    catch {
        Write-Error "Failed to download $Url. Error: $_"
        return $false
    }
    finally {
        $webClient.Dispose()
    }
}

# Function to convert and resize images using System.Drawing
function Convert-Image {
    param (
        [string]$InputFile,
        [string]$OutputFile,
        [int]$Width,
        [int]$Height
    )
    
    "Converting $InputFile to $OutputFile ($Width x $Height)..."
    try {
        Add-Type -AssemblyName System.Drawing
        
        $original = [System.Drawing.Image]::FromFile($InputFile)
        $resized = New-Object System.Drawing.Bitmap($Width, $Height)
        $graphic = [System.Drawing.Graphics]::FromImage($resized)
        
        # Set high quality scaling
        $graphic.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphic.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $graphic.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
        $graphic.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
        
        # Draw the image
        $graphic.DrawImage($original, 0, 0, $Width, $Height)
        
        # Save the resized image
        $resized.Save($OutputFile)
        
        # Clean up
        $graphic.Dispose()
        $resized.Dispose()
        $original.Dispose()
        
        return $true
    }
    catch {
        Write-Error "Failed to convert image. Error: $_"
        return $false
    }
}

# Function to create an ICO file from PNG
function Convert-ToIco {
    param (
        [string]$InputFile,
        [string]$OutputFile
    )
    
    "Converting $InputFile to ICO file at $OutputFile..."
    try {
        Add-Type -AssemblyName System.Drawing
        
        $original = [System.Drawing.Bitmap]::FromFile($InputFile)
        $icon = [System.Drawing.Icon]::FromHandle($original.GetHicon())
        
        $stream = [System.IO.File]::Create($OutputFile)
        $icon.Save($stream)
        
        # Clean up
        $stream.Close()
        $stream.Dispose()
        $icon.Dispose()
        $original.Dispose()
        
        return $true
    }
    catch {
        Write-Error "Failed to create ICO file. Error: $_"
        return $false
    }
}

# Download a calendar icon from a free source (replace with your preferred icon)
$iconUrl = "https://raw.githubusercontent.com/tauri-apps/tauri/dev/core/tauri/icons/128x128.png"
$downloadedFile = Join-Path $tempDir "original.png"

# Download the icon
$success = Download-File -Url $iconUrl -OutputPath $downloadedFile

if ($success) {
    # Create the various sized PNG files
    Convert-Image -InputFile $downloadedFile -OutputFile "$iconDir\32x32.png" -Width 32 -Height 32
    Convert-Image -InputFile $downloadedFile -OutputFile "$iconDir\128x128.png" -Width 128 -Height 128
    Convert-Image -InputFile $downloadedFile -OutputFile "$iconDir\128x128@2x.png" -Width 256 -Height 256
    
    # Create the ICO file
    Convert-ToIco -InputFile "$iconDir\128x128.png" -OutputFile "$iconDir\icon.ico"
    
    # Copy the largest PNG as a placeholder for the macOS icon 
    Copy-Item "$iconDir\128x128@2x.png" -Destination "$iconDir\icon.icns" -Force
    
    "All icon files have been created successfully!"
}
else {
    "Failed to download the icon. Using blank placeholder icons instead..."
    
    # Create empty placeholder files as a fallback
    New-Item -ItemType File -Path "$iconDir\32x32.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\128x128.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\128x128@2x.png" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\icon.ico" -Force | Out-Null
    New-Item -ItemType File -Path "$iconDir\icon.icns" -Force | Out-Null
}

# Update tauri.conf.json file
"Updating tauri.conf.json file..."
$configPath = ".\src-tauri\tauri.conf.json"
$config = Get-Content -Path $configPath -Raw
$newConfig = $config -replace '"icon": \[[^\]]*\]', '"icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico", "icons/icon.icns"]'
Set-Content -Path $configPath -Value $newConfig

# Clean up temp files
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

"Icon creation and setup complete!"
