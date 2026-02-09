# Propuesta inicial: Sistema local + Tienda web para repuestos de motocicletas

## 1) Objetivo del proyecto
Construir un ecosistema unificado para **Avila Moto Repuesto** con:

- **Sistema local de tienda** para gestión diaria del negocio físico:
  - Control de stock.
  - Caja (ingresos/egresos/cierre).
  - Facturación.
- **Tienda web** para vender los mismos productos online.
- **Sincronización en tiempo real** entre ambos canales para evitar sobreventa y mantener inventario consistente.
- **Logística híbrida**:
  - Envío a domicilio por correo privado.
  - Retiro en local físico.
- **Arquitectura modular** para evolucionar partes del sistema sin romper el resto.

## 2) Definiciones de negocio confirmadas
- **Condición fiscal**: Responsable Inscripto en Argentina.
- **Facturación e impuestos**: facturación online con ARCA usando token ya habilitado.
- **Hardware en local**: periféricos genéricos (lector de código de barras e impresora ticket/fiscal genéricos).
- **Puestos de trabajo**: 2 PCs en mostrador, ambas se usan tanto para vender como para cobrar.
- **Usuarios**: operación inicial con 1 usuario, dejando estructura lista para crear más usuarios/roles.
- **Sucursales**: 1 sola tienda física.
- **Envíos prioritarios**: Andreani y OCA.
- **Medios de pago prioritarios**: todos los métodos habituales excepto cheque.
- **Datos de catálogo inicial**: el catálogo actual está en Excel y debe poder importarse al sistema.
- **Listas de precios en local**: 2 listas de venta, `contado/efectivo` (75%) y `tarjeta` (84%), con vista principal en precio tarjeta y botón para alternar lista.

## 3) Alcance funcional recomendado (MVP)

### A. Sistema local (Backoffice)
- Catálogo de productos (SKU, marca, modelo compatible, precio costo, precio contado, precio tarjeta, stock mínimo, código de barras, proveedor).
- **Gestión de doble lista de precios en POS**:
  - Lista principal visible: **precio tarjeta**.
  - Botón para alternar visualización rápida a **precio contado/efectivo**.
  - Parámetros configurables de cálculo inicial: contado 75% y tarjeta 84% (sobre costo/base definida por negocio).
- **Importador de catálogo desde Excel** con:
  - Mapeo de columnas.
  - Validaciones de datos obligatorios.
  - Vista previa de errores y confirmación antes de importar.
  - Plantilla estándar inicial: `codigo_barra`, `descripcion`, `marca`, `precio_costo`, `precio_contado`, `precio_tarjeta`, `proveedor`.
- Movimientos de stock:
  - Compras a proveedores.
  - Venta mostrador.
  - Ajustes por merma/rotura.
  - Devoluciones.
- Caja:
  - Apertura y cierre por turno.
  - Registro de medios de pago (efectivo, débito, crédito, transferencia, billeteras virtuales).
  - Arqueo y diferencias.
- Facturación:
  - Emisión de comprobantes online vía ARCA.
  - Historial de ventas y estado de comprobantes.
- **Módulo de clientes con cuenta corriente**:
  - Alta/edición de clientes.
  - Registro de saldo deudor, pagos parciales y movimientos.
  - Consulta de estado de cuenta e historial.
- Proveedores (datos básicos).
- Reportes:
  - Ventas por período.
  - Productos más vendidos.
  - Quiebre de stock.

### B. Tienda web
- Catálogo público con buscador y filtros (marca/modelo/tipo de repuesto).
- Carrito de compras y checkout.
- Selección de entrega:
  - Envío (con costo y zona, contemplando Andreani/OCA).
  - Retiro en local.
- Pasarela de pago online (sin opción de cheque).
- Panel de administración web básico:
  - Estado de pedidos.
  - Confirmación de pagos.
  - Preparación/entrega.

### C. Integración entre sistema local y web
- **Stock único centralizado**.
- Reserva de stock al crear pedido online.
- Descuento automático de stock al confirmar venta local u online.
- Sincronización de precios.
- Sincronización de estados de pedido (pendiente, pagado, preparado, enviado, retirado, cancelado).

## 4) Arquitectura sugerida (modular)

### Opción recomendada
1. **Backend central (API + base de datos)** como “fuente de verdad”.
2. **Módulo POS/Caja** consumiendo API central (usado en ambas PCs de mostrador).
3. **Módulo Facturación ARCA** desacoplado del POS para facilitar mantenimiento fiscal.
4. **Módulo Inventario** con reglas de stock y auditoría.
5. **Módulo E-commerce** (catálogo, checkout, pedidos).
6. **Módulo Integraciones logísticas** (Andreani/OCA).
7. **Módulo Importador Excel** para altas/actualizaciones masivas de productos.
8. **Módulo Clientes/Cuenta corriente** para gestión de saldos deudores.

Ventajas del enfoque modular:
- Cambios en un módulo con bajo impacto sobre otros.
- Mantenimiento más simple.
- Mejor escalabilidad funcional.

## 5) Modelo de datos mínimo
- `productos`
- `inventario`
- `movimientos_inventario`
- `ventas`
- `detalle_venta`
- `facturas`
- `listas_precios`
- `productos_precios`
- `caja_turnos`
- `caja_movimientos`
- `pedidos_web`
- `detalle_pedido_web`
- `clientes`
- `cuentas_corrientes_clientes`
- `movimientos_cuenta_corriente`
- `proveedores`
- `usuarios`
- `roles`
- `importaciones_productos` (auditoría de cargas desde Excel)

## 6) Reglas de negocio críticas
- No vender si stock disponible = 0.
- Al iniciar checkout web, reservar stock por tiempo limitado (ej. 15 min).
- Si pago falla o expira reserva, devolver stock.
- Si pedido se cancela, devolver stock.
- Toda variación de stock debe generar movimiento auditable.
- Permisos por rol (admin, vendedor, caja, depósito).
- El POS debe permitir cambiar entre lista de precio tarjeta y contado mediante botón, sin afectar stock ni auditoría de venta.
- Validar que ningún flujo de pago permita cheque.
- Toda factura emitida debe guardar respuesta de ARCA (CAE/resultado/error) para trazabilidad.

## 7) Fases del proyecto

### Fase 1 (4-6 semanas) – MVP operativo
- Backoffice: productos, stock, ventas mostrador, caja básica.
- Doble lista de precios (tarjeta/contado) con alternancia en POS y tarjeta como vista por defecto.
- Módulo clientes con cuenta corriente (deuda/saldos/pagos).
- Integración con lector de código de barras e impresora genérica.
- Importación inicial del catálogo desde Excel usando plantilla definida (incluyendo proveedor).
- Web: catálogo, carrito, checkout con retiro en local.
- Integración de stock en tiempo real.

### Fase 2 (3-4 semanas)
- Facturación online ARCA usando token habilitado.
- Envíos por zona y cálculo de costos con Andreani/OCA.
- Reportes gerenciales.

### Fase 3 (2-3 semanas)
- Mejoras UX.
- Promociones/cupones.
- Endurecimiento de módulos e integraciones (logging, alertas, reintentos).

## 8) Stack tecnológico sugerido

### Backend
- Node.js + NestJS (o Python + Django/FastAPI).
- PostgreSQL.
- Redis para reservas temporales de stock.

### Frontend web
- Next.js + Tailwind CSS.

### App local
- Opción 1: Web app en modo local (PWA) para evitar instalación compleja.
- Opción 2: Electron si se requiere experiencia desktop más tradicional.

### Infraestructura
- Deploy cloud (VPS o servicios gestionados).
- Backups automáticos diarios.
- Monitoreo básico y logs.

## 9) Seguridad y operación
- Autenticación con JWT + refresh tokens.
- Cifrado TLS/HTTPS obligatorio.
- Registro de auditoría de acciones críticas.
- Políticas de respaldo y recuperación ante fallos.

## 10) Próximos pasos concretos
1. Relevar estructura del Excel actual (columnas, calidad de datos, duplicados).
2. Definir y validar plantilla estándar de importación: `codigo_barra`, `descripcion`, `marca`, `precio_costo`, `precio_contado`, `precio_tarjeta`, `proveedor`.
3. Implementar módulos base: inventario + POS/caja + usuarios/roles + clientes/cuenta corriente.
4. Implementar lógica de doble lista de precios en POS (tarjeta por defecto + botón de alternancia).
5. Implementar módulo de facturación ARCA con token existente.
6. Implementar módulo e-commerce y sincronización de stock.
7. Implementar módulo de envíos Andreani/OCA.
