from fastapi import FastAPI

from app.routers.customers import router as customers_router
from app.routers.pricing import router as pricing_router
from app.routers.products import router as products_router

app = FastAPI(title="Avila Moto Repuesto API", version="0.1.0")


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(products_router)
app.include_router(customers_router)
app.include_router(pricing_router)
