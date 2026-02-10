const API_BASE_URL = 'http://127.0.0.1:8000';

const apiStatus = document.querySelector('#api-status');
const toggleButton = document.querySelector('#toggle-price-list');
const activeListLabel = document.querySelector('#active-list-label');
const priceColumnTitle = document.querySelector('#price-column-title');
const productsBody = document.querySelector('#products-body');
const reloadButton = document.querySelector('#reload-products');
const navButtons = document.querySelectorAll('.nav-btn');
const modulePanels = document.querySelectorAll('.module');
const searchBarcodeInput = document.querySelector('#search-barcode');
const searchNameInput = document.querySelector('#search-name');
const clearSearchButton = document.querySelector('#clear-search');
const addProductForm = document.querySelector('#add-product-form');
const editProductForm = document.querySelector('#edit-product-form');
const settingsForm = document.querySelector('#settings-form');
const multiUserInput = document.querySelector('#multi-user-enabled');
const loginRequiredInput = document.querySelector('#login-required');
const settingsStatus = document.querySelector('#settings-status');
const checkoutDock = document.querySelector('.checkout-dock');
const checkoutTotal = document.querySelector('#checkout-total');
const payOptions = document.querySelectorAll('.pay-option');
const clientIdInput = document.querySelector('#client-id-input');
const payToClientButton = document.querySelector('#pay-to-client');
const generateQuoteButton = document.querySelector('#generate-quote');
const invoiceStatus = document.querySelector('#invoice-status');

let activeList = 'card';
let allProducts = [];
const saleQtyByBarcode = new Map();

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumFractionDigits: 0 }).format(value);

const setApiStatus = (text, ok = true) => {
  apiStatus.textContent = text;
  apiStatus.style.background = ok ? '#e7ebff' : '#ffe9e9';
  apiStatus.style.color = ok ? '#2d3a87' : '#9f2222';
};

const getCurrentPrice = (product) => (activeList === 'card' ? product.card_price : product.cash_price);
const getQty = (barcode) => saleQtyByBarcode.get(barcode) ?? 0;

const buildSaleItems = () =>
  allProducts
    .filter((product) => getQty(product.barcode) > 0)
    .map((product) => ({
      barcode: product.barcode,
      description: product.description,
      quantity: getQty(product.barcode),
      unitPrice: getCurrentPrice(product),
    }));

const updateCheckoutTotal = () => {
  const total = buildSaleItems().reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  checkoutTotal.textContent = formatPrice(total);
};

const setModule = (moduleName) => {
  navButtons.forEach((button) => button.classList.toggle('active', button.dataset.module === moduleName));
  modulePanels.forEach((panel) => panel.classList.toggle('hidden', panel.dataset.modulePanel !== moduleName));
  checkoutDock.classList.toggle('hidden', moduleName !== 'pos');
};

const addQty = (barcode) => {
  const product = allProducts.find((p) => p.barcode === barcode);
  if (!product) return;
  const next = getQty(barcode) + 1;
  if (next > product.stock) {
    setApiStatus('No podés superar el stock disponible', false);
    return;
  }
  saleQtyByBarcode.set(barcode, next);
  applyFilters();
  setApiStatus(`Agregado: ${product.description}`);
};

const removeQty = (barcode) => {
  const current = getQty(barcode);
  if (current <= 0) return;
  if (current === 1) saleQtyByBarcode.delete(barcode);
  else saleQtyByBarcode.set(barcode, current - 1);
  applyFilters();
};

const renderProducts = (products) => {
  if (!products.length) {
    productsBody.innerHTML = '<tr><td colspan="8" class="empty">No hay productos para los filtros aplicados.</td></tr>';
    updateCheckoutTotal();
    return;
  }

  productsBody.innerHTML = products
    .map((product) => {
      const visiblePrice = getCurrentPrice(product);
      const qty = getQty(product.barcode);
      const subtotal = qty * visiblePrice;
      return `
        <tr>
          <td>${product.barcode}</td>
          <td>${product.description}</td>
          <td>${product.brand}</td>
          <td>${formatPrice(visiblePrice)}</td>
          <td>${product.stock}</td>
          <td>${qty}</td>
          <td>${formatPrice(subtotal)}</td>
          <td>
            <button class="qty-btn" data-action="minus" data-barcode="${product.barcode}" type="button">-</button>
            <button class="qty-btn" data-action="plus" data-barcode="${product.barcode}" type="button">+</button>
          </td>
        </tr>
      `;
    })
    .join('');

  document.querySelectorAll('.qty-btn').forEach((button) => {
    button.addEventListener('click', () => {
      if (button.dataset.action === 'plus') addQty(button.dataset.barcode);
      else removeQty(button.dataset.barcode);
    });
  });

  updateCheckoutTotal();
};

const applyFilters = () => {
  const barcode = searchBarcodeInput.value.trim().toLowerCase();
  const rawName = searchNameInput.value.trim().toLowerCase();

  const filtered = allProducts.filter((product) => {
    const barcodeOk = !barcode || product.barcode.toLowerCase().includes(barcode);
    if (!rawName) return barcodeOk;
    const term = rawName.startsWith('%') ? rawName.slice(1) : rawName;
    return barcodeOk && product.description.toLowerCase().includes(term);
  });

  renderProducts(filtered);
};

const syncPriceLabels = () => {
  const isCard = activeList === 'card';
  activeListLabel.textContent = `Lista activa: ${isCard ? 'tarjeta' : 'contado'}`;
  priceColumnTitle.textContent = `Precio ${isCard ? 'tarjeta' : 'contado'}`;
  toggleButton.textContent = `Cambiar a ${isCard ? 'contado' : 'tarjeta'}`;
  applyFilters();
};

const fetchJson = async (path, options = undefined) => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!response.ok) throw new Error(`Error ${response.status}: ${await response.text()}`);
  return response.json();
};

const loadProducts = async () => {
  allProducts = await fetchJson('/products');
  applyFilters();
};

const loadActivePriceList = async () => {
  const payload = await fetchJson('/pricing/active');
  activeList = payload.active_list;
  syncPriceLabels();
};

const switchPriceList = async () => {
  const next = activeList === 'card' ? 'cash' : 'card';
  await fetchJson('/pricing/active', { method: 'POST', body: JSON.stringify({ active_list: next }) });
  activeList = next;
  syncPriceLabels();
};

const handleSaveProduct = async (form, mode) => {
  const formData = new FormData(form);
  const payload = {
    barcode: String(formData.get('barcode')),
    description: String(formData.get('description')),
    brand: String(formData.get('brand')),
    supplier: String(formData.get('supplier')),
    cost_price: Number(formData.get('cost_price')),
    cash_price: Number(formData.get('cash_price')),
    card_price: Number(formData.get('card_price')),
    stock: Number(formData.get('stock')),
  };
  await fetchJson('/products', { method: 'POST', body: JSON.stringify(payload) });
  await loadProducts();
  form.reset();
  setApiStatus(`Producto ${mode === 'add' ? 'agregado' : 'actualizado'} correctamente`);
};

const loadSettings = () => {
  const saved = localStorage.getItem('pos_settings');
  if (!saved) return;
  try {
    const settings = JSON.parse(saved);
    multiUserInput.checked = Boolean(settings.multiUserEnabled);
    loginRequiredInput.checked = Boolean(settings.loginRequired);
    settingsStatus.textContent = 'Configuración cargada desde navegador.';
  } catch {
    settingsStatus.textContent = 'No se pudo leer la configuración guardada.';
  }
};

const clearSale = () => {
  saleQtyByBarcode.clear();
  applyFilters();
};

const chargeAndInvoice = async (paymentMethod, customerId = null) => {
  const items = buildSaleItems();
  if (!items.length) {
    setApiStatus('No hay productos en el listado para cobrar', false);
    return;
  }

  const result = await fetchJson('/billing/charge', {
    method: 'POST',
    body: JSON.stringify({
      payment_method: paymentMethod,
      customer_id: customerId,
      items: items.map((it) => ({
        barcode: it.barcode,
        description: it.description,
        quantity: it.quantity,
        unit_price: it.unitPrice,
      })),
    }),
  });

  const invoiceUrl = `${API_BASE_URL}${result.pdf_url}`;
  invoiceStatus.innerHTML = `Factura ${result.invoice_number} (CAE ${result.cae}) lista: <a href="${invoiceUrl}" target="_blank" rel="noreferrer">descargar/imprimir PDF</a>`;
  window.open(invoiceUrl, '_blank');
  setApiStatus(`Cobro registrado y factura ARCA aprobada (${result.invoice_number})`);
  clearSale();
};

const goToQuoteScreen = () => {
  const items = buildSaleItems();
  if (!items.length) {
    setApiStatus('No hay productos para generar presupuesto', false);
    return;
  }
  sessionStorage.setItem('pending_quote', JSON.stringify({ items }));
  window.location.href = './quote.html';
};

const init = async () => {
  try {
    await fetchJson('/health');
    setApiStatus('API conectada');
    await loadActivePriceList();
    await loadProducts();
  } catch {
    setApiStatus('No se pudo conectar con la API', false);
    productsBody.innerHTML = '<tr><td colspan="8" class="empty">Iniciá el backend para ver datos.</td></tr>';
  }
  loadSettings();
  setModule('pos');
};

navButtons.forEach((button) => button.addEventListener('click', () => setModule(button.dataset.module)));
searchBarcodeInput.addEventListener('input', applyFilters);
searchNameInput.addEventListener('input', applyFilters);
clearSearchButton.addEventListener('click', () => {
  searchBarcodeInput.value = '';
  searchNameInput.value = '';
  applyFilters();
});

toggleButton.addEventListener('click', async () => {
  try {
    await switchPriceList();
  } catch {
    setApiStatus('No se pudo cambiar la lista de precios', false);
  }
});

reloadButton.addEventListener('click', async () => {
  try {
    await loadProducts();
    setApiStatus('Productos recargados');
  } catch {
    setApiStatus('Error consultando /products', false);
  }
});

addProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await handleSaveProduct(addProductForm, 'add');
  } catch {
    setApiStatus('No se pudo agregar el producto', false);
  }
});

editProductForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  try {
    await handleSaveProduct(editProductForm, 'edit');
  } catch {
    setApiStatus('No se pudo actualizar el producto', false);
  }
});

settingsForm.addEventListener('submit', (event) => {
  event.preventDefault();
  localStorage.setItem(
    'pos_settings',
    JSON.stringify({ multiUserEnabled: multiUserInput.checked, loginRequired: loginRequiredInput.checked }),
  );
  settingsStatus.textContent = 'Configuración guardada correctamente.';
});

payOptions.forEach((button) => {
  button.addEventListener('click', async () => {
    try {
      await chargeAndInvoice(button.dataset.payMethod);
    } catch {
      setApiStatus('No se pudo registrar el cobro/factura', false);
    }
  });
});

payToClientButton.addEventListener('click', async () => {
  const clientId = clientIdInput.value.trim();
  if (!clientId) {
    setApiStatus('Ingresá un ID de cliente para sumar a cuenta corriente', false);
    return;
  }
  try {
    await chargeAndInvoice('customer_account', clientId);
    clientIdInput.value = '';
  } catch {
    setApiStatus('No se pudo cargar a cuenta corriente/facturar', false);
  }
});

generateQuoteButton.addEventListener('click', goToQuoteScreen);

init();
