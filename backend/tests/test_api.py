from fastapi.testclient import TestClient

from app.main import app


client = TestClient(app)


def test_health() -> None:
    response = client.get('/health')
    assert response.status_code == 200
    assert response.json() == {'status': 'ok'}


def test_import_products_and_get() -> None:
    payload = [
        {
            'codigo_barra': '7791234567890',
            'descripcion': 'Pastillas de freno',
            'marca': 'Brembo',
            'precio_costo': 10000,
            'precio_contado': 17500,
            'precio_tarjeta': 18400,
            'proveedor': 'MotoPartes SA',
        }
    ]
    import_response = client.post('/products/import', json=payload)
    assert import_response.status_code == 200
    get_response = client.get('/products/7791234567890')
    assert get_response.status_code == 200
    assert get_response.json()['supplier'] == 'MotoPartes SA'


def test_switch_price_list() -> None:
    response = client.post('/pricing/active', json={'active_list': 'cash'})
    assert response.status_code == 200
    current = client.get('/pricing/active')
    assert current.status_code == 200
    assert current.json()['active_list'] == 'cash'


def test_customer_account_movement() -> None:
    create = client.post(
        '/customers',
        json={
            'id': 'c1',
            'full_name': 'Juan Perez',
            'phone': '1122334455',
            'debt_balance': 0,
        },
    )
    assert create.status_code == 200

    debt = client.post(
        '/customers/movement',
        json={'customer_id': 'c1', 'amount': 20000, 'kind': 'sale_debt', 'note': 'venta fiada'},
    )
    assert debt.status_code == 200
    assert debt.json()['debt_balance'] == 20000

    payment = client.post(
        '/customers/movement',
        json={'customer_id': 'c1', 'amount': 5000, 'kind': 'payment', 'note': 'abono'},
    )
    assert payment.status_code == 200
    assert payment.json()['debt_balance'] == 15000


def test_stock_movement_purchase_and_sale() -> None:
    create = client.post(
        '/products',
        json={
            'barcode': '7790000000001',
            'description': 'Cadena 428',
            'brand': 'DID',
            'cost_price': 20000,
            'cash_price': 35000,
            'card_price': 36800,
            'supplier': 'Repuestos Centro',
            'stock': 0,
        },
    )
    assert create.status_code == 200

    purchase = client.post(
        '/stock/movement',
        json={'barcode': '7790000000001', 'quantity': 5, 'kind': 'purchase', 'note': 'ingreso'},
    )
    assert purchase.status_code == 200
    assert purchase.json()['stock'] == 5

    sale = client.post(
        '/stock/movement',
        json={'barcode': '7790000000001', 'quantity': 2, 'kind': 'sale', 'note': 'venta mostrador'},
    )
    assert sale.status_code == 200
    assert sale.json()['stock'] == 3


def test_stock_movement_insufficient_stock() -> None:
    create = client.post(
        '/products',
        json={
            'barcode': '7790000000002',
            'description': 'Bujia',
            'brand': 'NGK',
            'cost_price': 7000,
            'cash_price': 12000,
            'card_price': 12600,
            'supplier': 'Repuestos Centro',
            'stock': 1,
        },
    )
    assert create.status_code == 200

    response = client.post(
        '/stock/movement',
        json={'barcode': '7790000000002', 'quantity': 3, 'kind': 'sale', 'note': 'venta'},
    )
    assert response.status_code == 400
    assert response.json()['detail'] == 'Stock insuficiente'
