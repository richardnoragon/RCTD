# Simple icon creation script with actual icons
# Create the icon directory if it doesn't exist
$iconDir = ".\src-tauri\icons"
if (!(Test-Path $iconDir)) {
    New-Item -ItemType Directory -Path $iconDir -Force
}

# Download actual icon files
"Downloading and creating actual icon files..."
Add-Type -AssemblyName System.Drawing

# Create a temp directory for downloading
$tempDir = Join-Path $env:TEMP "tauri-icons-temp"
New-Item -ItemType Directory -Path $tempDir -Force -ErrorAction SilentlyContinue | Out-Null

# Download a sample calendar icon (using a more reliable source)
$iconUrl = "https://img.icons8.com/fluency/96/calendar.png"
$downloadPath = Join-Path $tempDir "original.png"

try {
    "Downloading icon from $iconUrl..."
    Invoke-WebRequest -Uri $iconUrl -OutFile $downloadPath -ErrorAction Stop
    
    # Function to resize image
    function Resize-Image {
        param (
            [string]$InputFile,
            [string]$OutputFile,
            [int]$Width,
            [int]$Height
        )
        
        $img = [System.Drawing.Image]::FromFile($InputFile)
        $canvas = New-Object System.Drawing.Bitmap($Width, $Height)
        $graph = [System.Drawing.Graphics]::FromImage($canvas)
        $graph.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graph.DrawImage($img, 0, 0, $Width, $Height)
        $canvas.Save($OutputFile)
        $graph.Dispose()
        $canvas.Dispose()
        $img.Dispose()
    }

    # Create the various icon sizes
    "Creating 32x32 icon..."
    Resize-Image -InputFile $downloadPath -OutputFile "$iconDir\32x32.png" -Width 32 -Height 32
    
    "Creating 128x128 icon..."
    Resize-Image -InputFile $downloadPath -OutputFile "$iconDir\128x128.png" -Width 128 -Height 128
    
    "Creating 128x128@2x icon..."
    Resize-Image -InputFile $downloadPath -OutputFile "$iconDir\128x128@2x.png" -Width 256 -Height 256
    
    # Create icon.ico
    "Creating Windows icon file (icon.ico)..."
    $img = [System.Drawing.Image]::FromFile("$iconDir\128x128.png")
    $bmp = New-Object System.Drawing.Bitmap($img)
    $icon = [System.Drawing.Icon]::FromHandle($bmp.GetHicon())
    $fileStream = [System.IO.File]::Create("$iconDir\icon.ico")
    $icon.Save($fileStream)
    $fileStream.Close()
    $icon.Dispose()
    $bmp.Dispose()
    $img.Dispose()
    
    # We'll use a copy of the 128x128@2x.png as a placeholder for icon.icns
    "Creating macOS icon placeholder (icon.icns)..."
    Copy-Item "$iconDir\128x128@2x.png" -Destination "$iconDir\icon.icns" -Force
    
    "Successfully created all icon files with actual icons!"
}
catch {
    "Error: $_"
    "Failed to download or process icons. Creating empty placeholder files instead..."
    
    # Create empty placeholder files as fallback
    New-Item -ItemType File -Path "$iconDir\32x32.png" -Force
    New-Item -ItemType File -Path "$iconDir\128x128.png" -Force
    New-Item -ItemType File -Path "$iconDir\128x128@2x.png" -Force
    New-Item -ItemType File -Path "$iconDir\icon.ico" -Force
    New-Item -ItemType File -Path "$iconDir\icon.icns" -Force
    
    "Created empty placeholder icon files."
}

# Clean up temp files
if (Test-Path $tempDir) {
    Remove-Item -Path $tempDir -Recurse -Force
}

"Updating tauri.conf.json file..."
# Update the tauri.conf.json file to include these icons
$configPath = ".\src-tauri\tauri.conf.json"
$config = Get-Content -Path $configPath -Raw
$newConfig = $config -replace '"icon": \[\]', '"icon": ["icons/32x32.png", "icons/128x128.png", "icons/128x128@2x.png", "icons/icon.ico", "icons/icon.icns"]'
Set-Content -Path $configPath -Value $newConfig

"Icon creation complete!"
