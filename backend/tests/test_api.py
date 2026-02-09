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
