@echo off
REM eBay Clone - Quick Setup Script for Windows

echo ===========================================
echo eBay Clone - Full Stack Setup
echo ===========================================

REM Install backend dependencies
echo.
echo 📦 Installing backend dependencies...
cd backend
call npm install

echo.
echo ✅ Backend dependencies installed

REM Go back to root
cd ..

REM Install frontend dependencies
echo.
echo 📦 Installing frontend dependencies...
call npm install

echo.
echo ✅ Frontend dependencies installed

REM Create backend .env if not exists
if not exist "backend\.env" (
    echo.
    echo 📝 Creating backend .env file...
    copy backend\.env.example backend\.env
    echo ✅ Created backend\.env
)

echo.
echo ===========================================
echo Setup Complete! ✅
echo ===========================================
echo.
echo Next steps:
echo 1. Make sure MongoDB is running
echo 2. Run: npm run start:dev
echo.
echo Frontend: http://localhost:3000
echo Backend API: http://localhost:5000
echo.
pause
