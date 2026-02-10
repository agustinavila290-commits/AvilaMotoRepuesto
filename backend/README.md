# Backend inicial (MVP modular)

Base de API para arrancar el desarrollo del sistema local + e-commerce.

## Módulos incluidos
- Productos + importación desde Excel (formato JSON equivalente).
- Precios (lista activa `card`/`cash` para POS).
- Clientes con cuenta corriente (deuda y pagos).
- Movimientos de stock auditables (compra, venta y ajustes).
- Facturación de venta con simulación de flujo ARCA + descarga de PDF.
- Persistencia con PostgreSQL (SQLAlchemy).

## Configuración de base de datos (PostgreSQL)
Por defecto la app usa:

`postgresql+psycopg2://postgres:postgres@127.0.0.1:5432/avila_pos`

Podés personalizarlo con la variable `DATABASE_URL`.

### Levantar PostgreSQL rápido (Docker)
```bash
cd backend
docker compose -f docker-compose.postgres.yml up -d
```

## Ejecutar
```bash
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```

## Test
```bash
pytest -q
```
