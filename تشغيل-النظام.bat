@echo off
chcp 65001 > nul
title نظام الوسائل العامة - كلية الحقوق - جامعة برج بوعريريج
color 0A

echo.
echo  =====================================================
echo   نظام الوسائل العامة - كلية الحقوق - برج بوعريريج
echo  =====================================================
echo.

:: Check Node.js
node -v >nul 2>&1
if errorlevel 1 (
    echo [خطأ] Node.js غير مثبت!
    echo.
    echo يرجى تثبيت Node.js من: https://nodejs.org
    echo اختر النسخة LTS
    echo.
    pause
    exit /b 1
)

echo [✓] Node.js موجود
echo.

:: Backend setup
echo [1/4] تثبيت مكتبات الخادم...
cd backend
if not exist ".env" (
    copy .env.example .env
    echo [!] تم إنشاء ملف backend\.env
    echo [!] افتحه وعدّل DATABASE_URL بالرابط من Supabase
    echo.
    notepad .env
    echo.
    echo بعد تعديل الملف اضغط أي مفتاح للمتابعة...
    pause > nul
)
call npm install
echo.

:: DB setup
echo [2/4] إعداد قاعدة البيانات...
call npm run db:generate
call npm run db:push
call npm run db:seed
echo.

:: Frontend setup
echo [3/4] تثبيت مكتبات الواجهة...
cd ..\frontend
if not exist ".env" (
    copy .env.example .env
)
call npm install
echo.

echo [4/4] تشغيل النظام...
echo.
echo  =====================================================
echo   الخادم: http://localhost:5000
echo   الواجهة: http://localhost:5173
echo.
echo   البريد:  masoul@univ-bba.dz
echo   الرقم:   Admin@2025
echo  =====================================================
echo.

:: Start backend in new window
start "خادم الـ Backend" cmd /k "cd /d %~dp0backend && npm run dev"

:: Wait a moment
timeout /t 3 /nobreak > nul

:: Start frontend
start "واجهة Frontend" cmd /k "cd /d %~dp0frontend && npm run dev"

:: Open browser
timeout /t 5 /nobreak > nul
start http://localhost:5173

echo [✓] تم تشغيل النظام! افتح المتصفح على http://localhost:5173
echo.
pause
