from fastapi import APIRouter, HTTPException

from app.schemas import Product, ProductImportRow
from app.store import products_by_barcode

router = APIRouter(prefix="/products", tags=["products"])


@router.get("", response_model=list[Product])
def list_products() -> list[Product]:
    return list(products_by_barcode.values())


@router.post("", response_model=Product)
def upsert_product(product: Product) -> Product:
    products_by_barcode[product.barcode] = product
    return product


@router.post("/import", response_model=list[Product])
def import_products(rows: list[ProductImportRow]) -> list[Product]:
    imported: list[Product] = []
    for row in rows:
        product = Product(
            barcode=row.codigo_barra,
            description=row.descripcion,
            brand=row.marca,
            cost_price=row.precio_costo,
            cash_price=row.precio_contado,
            card_price=row.precio_tarjeta,
            supplier=row.proveedor,
            stock=0,
        )
        products_by_barcode[product.barcode] = product
        imported.append(product)
    return imported


@router.get("/{barcode}", response_model=Product)
def get_product(barcode: str) -> Product:
    product = products_by_barcode.get(barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")
    return product
