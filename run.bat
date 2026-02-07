@echo off
echo ============================================
echo      Starting ExamGen AI Installer
echo ============================================

echo.
echo [0/4] Cleaning up existing ports...
powershell -Command "try { Stop-Process -Id (Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue } catch {}"
powershell -Command "try { Stop-Process -Id (Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue } catch {}"
powershell -Command "try { Stop-Process -Id (Get-NetTCPConnection -LocalPort 5174 -ErrorAction SilentlyContinue).OwningProcess -Force -ErrorAction SilentlyContinue } catch {}"

echo.
echo [1/4] Installing Backend Dependencies...
cd server
if not exist node_modules (
    call npm install
) else (
    echo node_modules exists, skipping install (delete to reinstall)
)

echo.
echo [2/4] Starting Backend Server...
start "ExamGen Backend" cmd /k "npm start"
cd ..

echo.
echo [3/4] Installing Frontend Dependencies...
cd client
if not exist node_modules (
    call npm install
) else (
    echo node_modules exists, skipping install
)

echo.
echo [4/4] Starting Frontend Client...
start "ExamGen Client" cmd /k "npm run dev"

echo.
echo ============================================
echo      SUCCESS! App is launching...
echo ============================================
echo Check the new windows for server output.
echo Press any key to close this launcher.
pause
