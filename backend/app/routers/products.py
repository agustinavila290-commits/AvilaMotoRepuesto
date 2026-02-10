from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import ProductModel
from app.schemas import Product, ProductImportRow

router = APIRouter(prefix="/products", tags=["products"])


def _to_schema(model: ProductModel) -> Product:
    return Product(
        barcode=model.barcode,
        description=model.description,
        brand=model.brand,
        cost_price=model.cost_price,
        cash_price=model.cash_price,
        card_price=model.card_price,
        supplier=model.supplier,
        stock=model.stock,
    )


@router.get("", response_model=list[Product])
def list_products(db: Session = Depends(get_db)) -> list[Product]:
    return [_to_schema(p) for p in db.query(ProductModel).order_by(ProductModel.description).all()]


@router.post("", response_model=Product)
def upsert_product(product: Product, db: Session = Depends(get_db)) -> Product:
    current = db.get(ProductModel, product.barcode)
    if current is None:
        current = ProductModel(barcode=product.barcode)
        db.add(current)

    current.description = product.description
    current.brand = product.brand
    current.cost_price = product.cost_price
    current.cash_price = product.cash_price
    current.card_price = product.card_price
    current.supplier = product.supplier
    current.stock = product.stock
    db.commit()
    db.refresh(current)
    return _to_schema(current)


@router.post("/import", response_model=list[Product])
def import_products(rows: list[ProductImportRow], db: Session = Depends(get_db)) -> list[Product]:
    imported: list[Product] = []
    for row in rows:
        model = db.get(ProductModel, row.codigo_barra)
        if model is None:
            model = ProductModel(barcode=row.codigo_barra)
            db.add(model)

        model.description = row.descripcion
        model.brand = row.marca
        model.cost_price = row.precio_costo
        model.cash_price = row.precio_contado
        model.card_price = row.precio_tarjeta
        model.supplier = row.proveedor
        model.stock = model.stock or 0
        imported.append(_to_schema(model))

    db.commit()
    return imported


@router.get("/{barcode}", response_model=Product)
def get_product(barcode: str, db: Session = Depends(get_db)) -> Product:
    product = db.get(ProductModel, barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return _to_schema(product)
