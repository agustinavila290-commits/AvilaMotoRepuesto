from app.schemas import Customer, Product


products_by_barcode: dict[str, Product] = {}
customers_by_id: dict[str, Customer] = {}
active_price_list = "card"
