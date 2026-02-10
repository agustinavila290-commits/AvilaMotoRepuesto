from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.db import get_db
from app.models import CustomerModel
from app.schemas import AccountMovement, Customer

router = APIRouter(prefix="/customers", tags=["customers"])


def _to_schema(model: CustomerModel) -> Customer:
    return Customer(id=model.id, full_name=model.full_name, phone=model.phone, debt_balance=model.debt_balance)


@router.get("", response_model=list[Customer])
def list_customers(db: Session = Depends(get_db)) -> list[Customer]:
    return [_to_schema(c) for c in db.query(CustomerModel).order_by(CustomerModel.full_name).all()]


@router.post("", response_model=Customer)
def create_customer(customer: Customer, db: Session = Depends(get_db)) -> Customer:
    model = db.get(CustomerModel, customer.id)
    if model is None:
        model = CustomerModel(id=customer.id)
        db.add(model)
    model.full_name = customer.full_name
    model.phone = customer.phone
    model.debt_balance = customer.debt_balance
    db.commit()
    db.refresh(model)
    return _to_schema(model)


@router.post("/movement", response_model=Customer)
def add_account_movement(movement: AccountMovement, db: Session = Depends(get_db)) -> Customer:
    customer = db.get(CustomerModel, movement.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if movement.kind == "sale_debt":
        customer.debt_balance += movement.amount
    elif movement.kind == "payment":
        customer.debt_balance = max(0, customer.debt_balance - movement.amount)
    else:
        raise HTTPException(status_code=400, detail="Movimiento inválido")

    db.commit()
    db.refresh(customer)
    return _to_schema(customer)
