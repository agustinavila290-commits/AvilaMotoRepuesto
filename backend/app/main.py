from fastapi import FastAPI

from app.db import engine
from app.models import Base
from app.routers.billing import router as billing_router
from app.routers.customers import router as customers_router
from app.routers.pricing import router as pricing_router
from app.routers.products import router as products_router
from app.routers.stock import router as stock_router

app = FastAPI(title="Avila Moto Repuesto API", version="0.1.0")


@app.on_event("startup")
def startup() -> None:
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(products_router)
app.include_router(customers_router)
app.include_router(pricing_router)
app.include_router(stock_router)
app.include_router(billing_router)
