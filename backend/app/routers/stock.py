from fastapi import APIRouter, HTTPException

from app.schemas import Product, StockMovement
from app.store import products_by_barcode, stock_movements

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("/movement", response_model=Product)
def apply_stock_movement(movement: StockMovement) -> Product:
    product = products_by_barcode.get(movement.barcode)
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    if movement.kind in {"purchase", "adjustment_in"}:
        product.stock += movement.quantity
    elif movement.kind in {"sale", "adjustment_out"}:
        if product.stock < movement.quantity:
            raise HTTPException(status_code=400, detail="Stock insuficiente")
        product.stock -= movement.quantity
    else:
        raise HTTPException(status_code=400, detail="Movimiento de stock inválido")

    products_by_barcode[product.barcode] = product
    stock_movements.append(
        {
            "barcode": movement.barcode,
            "quantity": movement.quantity,
            "kind": movement.kind,
            "note": movement.note or "",
        }
    )
    return product


@router.get("/movements")
def list_stock_movements() -> list[dict[str, str | int]]:
    return stock_movements
