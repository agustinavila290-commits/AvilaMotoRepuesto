@echo off
setlocal

if not exist .venv (
  python -m venv .venv
)

call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements-windows.txt

pyinstaller ^
  --clean ^
  --noconfirm ^
  --onefile ^
  --name AvilaMotoPOS ^
  --add-data "backend;backend" ^
  --add-data "frontend;frontend" ^
  desktop_launcher.py

echo.
echo Ejecutable generado en: dist\AvilaMotoPOS.exe
endlocal
