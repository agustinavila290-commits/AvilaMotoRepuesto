# Frontend inicial (POS)

Interfaz base para mostrador con foco en:
- Visualizar productos y alternar lista activa (`card`/`cash`).
- Buscar por código de barras.
- Buscar por nombre/palabra clave (soporta prefijo `%`, por ejemplo `%arb`).
- Navegar por módulos: POS, Clientes, Productos y Configuración.
- Agregar/modificar productos desde UI.
- Configurar opciones de login/multiusuario (guardado local en navegador).
- Armar listado de venta y ver total final en margen inferior derecho.
- Cobrar directo por método (`efectivo`, `tarjeta`, `cuenta corriente`) emitiendo factura (simulación ARCA) y obtener PDF para descargar/imprimir.
- Opción de `Presupuesto` que redirige a pantalla imprimible.

## Ejecutar
Con backend en `http://127.0.0.1:8000`:

```bash
python -m http.server 4173 --directory frontend
```

Luego abrir:

- `http://127.0.0.1:4173`
