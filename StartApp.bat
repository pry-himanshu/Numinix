@echo off
cd /d "D:\Numinix-main - Copy - Copy"
start "Backend" cmd /k "node groqProxy.js"
start "Frontend" cmd /k "npm run dev"
REM Wait a few seconds for servers to start
ping 127.0.0.1 -n 6 > nul
start "App" "C:\Program Files\Google\Chrome\Application\chrome.exe" --app=http://localhost:5173
