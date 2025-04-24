@echo off
setlocal enabledelayedexpansion

:: Get the new project path from the user
set /p NEW_PATH="Enter the new project path (without spaces, e.g., C:\Dev\calendar-todo): "

:: Validate input
if "%NEW_PATH%"=="" (
    echo Error: Path cannot be empty
    exit /b 1
)

:: Check if path contains spaces
echo %NEW_PATH% | find " " > nul
if not errorlevel 1 (
    echo Error: New path must not contain spaces
    exit /b 1
)

:: Create directories
mkdir "%NEW_PATH%"
mkdir "%NEW_PATH%\migrations"
mkdir "%NEW_PATH%\src"
mkdir "%NEW_PATH%\src\db"
mkdir "%NEW_PATH%\src\services"
mkdir "%NEW_PATH%\src\utils"
mkdir "%NEW_PATH%\tests"
mkdir "%NEW_PATH%\ui"

:: Copy files with directory structure
xcopy /E /I /Y "calendar-todo-app\*" "%NEW_PATH%"

:: Copy the project requirements and checklist
copy "Product Requirements Document Calander ToDo Start.md" "%NEW_PATH%\docs\requirements.md"
copy "project_checklist.md" "%NEW_PATH%\docs\project_checklist.md"

echo.
echo Project has been copied to: %NEW_PATH%
echo.
echo Please update any absolute paths in your configuration files
echo and ensure all dependencies are properly installed in the new location.
echo.
echo Next steps:
echo 1. cd into %NEW_PATH%
echo 2. Run 'npm install' in the ui directory
echo 3. Test the application in the new location
echo.
pause
