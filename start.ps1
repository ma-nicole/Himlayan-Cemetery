# Himlayan - Start Both Frontend and Backend
Write-Host "Starting Himlayan System..." -ForegroundColor Green

# Start Backend in new window
Write-Host "Starting Backend (Laravel)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd 'C:\Users\Miggy Taduran\Himlayan-Cemetery\backend'; php artisan serve --host=0.0.0.0 --port=8000" -WindowStyle Normal

# Wait 2 seconds for backend to start
Start-Sleep -Seconds 2

# Start Frontend in new window
Write-Host "Starting Frontend (React)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "cd 'C:\Users\Miggy Taduran\Himlayan-Cemetery\frontend'; npm start" -WindowStyle Normal

# Wait for frontend to start
Start-Sleep -Seconds 5

Write-Host "=" * 50 -ForegroundColor Green
Write-Host "Both servers are starting!" -ForegroundColor Green
Write-Host "=" * 50
Write-Host "Frontend:  http://localhost:3000" -ForegroundColor Cyan
Write-Host "Backend:   http://localhost:8000" -ForegroundColor Cyan
Write-Host "=" * 50
