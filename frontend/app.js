const API_BASE_URL = 'http://127.0.0.1:8000';

const apiStatus = document.querySelector('#api-status');
const toggleButton = document.querySelector('#toggle-price-list');
const activeListLabel = document.querySelector('#active-list-label');
const priceColumnTitle = document.querySelector('#price-column-title');
const productsBody = document.querySelector('#products-body');
const reloadButton = document.querySelector('#reload-products');

let activeList = 'card';

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

const setApiStatus = (text, ok = true) => {
  apiStatus.textContent = text;
  apiStatus.style.background = ok ? '#e7ebff' : '#ffe9e9';
  apiStatus.style.color = ok ? '#2d3a87' : '#9f2222';
};

const renderProducts = (products) => {
  if (!products.length) {
    productsBody.innerHTML = '<tr><td colspan="5" class="empty">No hay productos cargados.</td></tr>';
    return;
  }

  productsBody.innerHTML = products
    .map((product) => {
      const visiblePrice = activeList === 'card' ? product.card_price : product.cash_price;
      return `
        <tr>
          <td>${product.barcode}</td>
          <td>${product.description}</td>
          <td>${product.brand}</td>
          <td>${formatPrice(visiblePrice)}</td>
          <td>${product.stock}</td>
        </tr>
      `;
    })
    .join('');
};

const syncPriceLabels = () => {
  const isCard = activeList === 'card';
  activeListLabel.textContent = `Lista activa: ${isCard ? 'tarjeta' : 'contado'}`;
  priceColumnTitle.textContent = `Precio ${isCard ? 'tarjeta' : 'contado'}`;
  toggleButton.textContent = `Cambiar a ${isCard ? 'contado' : 'tarjeta'}`;
};

const fetchJson = async (path, options = undefined) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`Error ${response.status}: ${await response.text()}`);
  }

  return response.json();
};

const loadProducts = async () => {
  try {
    const products = await fetchJson('/products');
    renderProducts(products);
  } catch (error) {
    productsBody.innerHTML = '<tr><td colspan="5" class="empty">No se pudieron cargar productos.</td></tr>';
    setApiStatus('Error consultando /products', false);
  }
};

const loadActivePriceList = async () => {
  const payload = await fetchJson('/pricing/active');
  activeList = payload.active_list;
  syncPriceLabels();
};

const switchPriceList = async () => {
  const next = activeList === 'card' ? 'cash' : 'card';
  await fetchJson('/pricing/active', {
    method: 'POST',
    body: JSON.stringify({ active_list: next }),
  });
  activeList = next;
  syncPriceLabels();
  await loadProducts();
};

const init = async () => {
  try {
    await fetchJson('/health');
    setApiStatus('API conectada');
    await loadActivePriceList();
    await loadProducts();
  } catch (error) {
    setApiStatus('No se pudo conectar con la API', false);
    productsBody.innerHTML =
      '<tr><td colspan="5" class="empty">Iniciá el backend para ver datos de productos.</td></tr>';
  }
};

toggleButton.addEventListener('click', async () => {
  try {
    await switchPriceList();
  } catch (error) {
    setApiStatus('No se pudo cambiar la lista de precios', false);
  }
});

reloadButton.addEventListener('click', () => {
  loadProducts();
});

init();
