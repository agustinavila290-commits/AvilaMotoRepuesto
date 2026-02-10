# Ejecutable para Windows (.exe)

Este proyecto ya está preparado para empaquetarse como un único ejecutable:

- Backend FastAPI en `127.0.0.1:8000`
- Frontend estático en `127.0.0.1:4173`
- Apertura automática del navegador al iniciar

## 1) Requisitos en Windows

- Python 3.10+ instalado
- PowerShell o CMD

## 2) Generar el .exe

Desde la raíz del repo:

```bat
build_windows_exe.bat
```

## 3) Resultado

Se genera:

- `dist\AvilaMotoPOS.exe`

## 4) Uso

Doble click en `AvilaMotoPOS.exe`.

El ejecutable:
1. levanta API backend,
2. levanta frontend,
3. abre el navegador en `http://127.0.0.1:4173`.

## Nota

La facturación ARCA en este MVP sigue siendo una simulación funcional del flujo.
