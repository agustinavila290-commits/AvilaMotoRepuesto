# Backend inicial (MVP modular)

Base de API para arrancar el desarrollo del sistema local + e-commerce.

## Módulos incluidos
- Productos + importación desde Excel (formato JSON equivalente).
- Precios (lista activa `card`/`cash` para POS).
- Clientes con cuenta corriente (deuda y pagos).

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
