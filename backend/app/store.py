from app.schemas import Customer, Product


products_by_barcode: dict[str, Product] = {}
customers_by_id: dict[str, Customer] = {}
active_price_list = "card"
stock_movements: list[dict[str, str | int]] = []
invoices_by_id: dict[str, dict[str, str | float]] = {}
invoice_pdf_by_id: dict[str, bytes] = {}
