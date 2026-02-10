from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import ProductModel, StockMovementModel
from app.schemas import Product, StockMovement

router = APIRouter(prefix="/stock", tags=["stock"])


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


@router.post("/movement", response_model=Product)
def apply_stock_movement(movement: StockMovement, db: Session = Depends(get_db)) -> Product:
    product = db.get(ProductModel, movement.barcode)
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

    db.add(
        StockMovementModel(
            barcode=movement.barcode,
            quantity=movement.quantity,
            kind=movement.kind,
            note=movement.note or "",
        )
    )
    db.commit()
    db.refresh(product)
    return _to_schema(product)


@router.get("/movements")
def list_stock_movements(db: Session = Depends(get_db)) -> list[dict[str, str | int]]:
    rows = db.query(StockMovementModel).order_by(StockMovementModel.id.desc()).all()
    return [
        {"barcode": r.barcode, "quantity": r.quantity, "kind": r.kind, "note": r.note}
        for r in rows
    ]
