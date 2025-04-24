@echo off
echo Creating Tauri icons...

:: Create a simple .ico file manually
echo Creating a simple placeholder icon.ico file
echo Set oWS = WScript.CreateObject("WScript.Shell") > %TEMP%\createicon.vbs
echo sLinkFile = "%CD%\src-tauri\icons\icon.ico" >> %TEMP%\createicon.vbs
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %TEMP%\createicon.vbs
echo oLink.Save >> %TEMP%\createicon.vbs
cscript /nologo %TEMP%\createicon.vbs
del %TEMP%\createicon.vbs

:: Create placeholder PNG files
echo Creating placeholder PNG icons
copy nul src-tauri\icons\32x32.png
copy nul src-tauri\icons\128x128.png
copy nul src-tauri\icons\128x128@2x.png

:: Update tauri.conf.json to include icons
echo Updating tauri.conf.json configuration
powershell -Command "(Get-Content src-tauri\tauri.conf.json) -replace '\"icon\": \[\]', '\"icon\": [\"icons/32x32.png\", \"icons/128x128.png\", \"icons/128x128@2x.png\", \"icons/icon.ico\"]' | Set-Content src-tauri\tauri.conf.json"

echo Icon creation completed!
