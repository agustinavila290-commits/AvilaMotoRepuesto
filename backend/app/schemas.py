from pydantic import BaseModel, Field


class Product(BaseModel):
    barcode: str = Field(min_length=3)
    description: str
    brand: str
    cost_price: float = Field(ge=0)
    cash_price: float = Field(ge=0)
    card_price: float = Field(ge=0)
    supplier: str
    stock: int = Field(ge=0, default=0)


class ProductImportRow(BaseModel):
    codigo_barra: str
    descripcion: str
    marca: str
    precio_costo: float
    precio_contado: float
    precio_tarjeta: float
    proveedor: str


class Customer(BaseModel):
    id: str
    full_name: str
    phone: str | None = None
    debt_balance: float = Field(default=0, ge=0)


class AccountMovement(BaseModel):
    customer_id: str
    amount: float = Field(gt=0)
    kind: str = Field(description="sale_debt o payment")
    note: str | None = None


class PriceListSwitch(BaseModel):
    active_list: str = Field(description="card o cash")


class StockMovement(BaseModel):
    barcode: str
    quantity: int = Field(gt=0)
    kind: str = Field(description="purchase, adjustment_in, adjustment_out o sale")
    note: str | None = None
