@echo off
echo Starting Spooky Game Development Environment...
echo.
echo Starting save/load server on port 3001...
start "Save/Load Server" cmd /k npm run server
timeout /t 2 /nobreak >nul
echo.
echo Starting Vite dev server...
start "Vite Dev Server" cmd /k npm run dev
echo.
echo Both servers are starting in separate windows.
echo Close this window or press any key to exit.
pause >nul
