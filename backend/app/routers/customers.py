from fastapi import APIRouter, HTTPException

from app.schemas import AccountMovement, Customer
from app.store import customers_by_id

router = APIRouter(prefix="/customers", tags=["customers"])


@router.get("", response_model=list[Customer])
def list_customers() -> list[Customer]:
    return list(customers_by_id.values())


@router.post("", response_model=Customer)
def create_customer(customer: Customer) -> Customer:
    customers_by_id[customer.id] = customer
    return customer


@router.post("/movement", response_model=Customer)
def add_account_movement(movement: AccountMovement) -> Customer:
    customer = customers_by_id.get(movement.customer_id)
    if not customer:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    if movement.kind == "sale_debt":
        customer.debt_balance += movement.amount
    elif movement.kind == "payment":
        customer.debt_balance = max(0, customer.debt_balance - movement.amount)
    else:
        raise HTTPException(status_code=400, detail="Movimiento inválido")

    customers_by_id[customer.id] = customer
    return customer
