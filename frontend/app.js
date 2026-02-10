const API_BASE_URL = 'http://127.0.0.1:8000';

const apiStatus = document.querySelector('#api-status');
const toggleButton = document.querySelector('#toggle-price-list');
const activeListLabel = document.querySelector('#active-list-label');
const priceColumnTitle = document.querySelector('#price-column-title');
const productsBody = document.querySelector('#products-body');
const saleItemsBody = document.querySelector('#sale-items-body');
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
let saleItems = [];

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

const getCurrentPrice = (product) => (activeList === 'card' ? product.card_price : product.cash_price);

const updateCheckoutTotal = () => {
  const total = saleItems.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  checkoutTotal.textContent = formatPrice(total);
};

const renderSaleItems = () => {
  if (!saleItems.length) {
    saleItemsBody.innerHTML =
      '<tr><td colspan="5" class="empty">Todavía no agregaste productos al listado.</td></tr>';
    updateCheckoutTotal();
    return;
  }

  saleItemsBody.innerHTML = saleItems
    .map(
      (item) => `
        <tr>
          <td>${item.barcode}</td>
          <td>${item.description}</td>
          <td>${item.quantity}</td>
          <td>${formatPrice(item.unitPrice)}</td>
          <td>${formatPrice(item.quantity * item.unitPrice)}</td>
        </tr>
      `,
    )
    .join('');

  updateCheckoutTotal();
};

const addProductToSale = (barcode) => {
  const product = allProducts.find((entry) => entry.barcode === barcode);
  if (!product) {
    setApiStatus('No se encontró el producto seleccionado', false);
    return;
  }

  const unitPrice = getCurrentPrice(product);
  const existing = saleItems.find((item) => item.barcode === barcode);

  if (existing) {
    existing.quantity += 1;
    existing.unitPrice = unitPrice;
  } else {
    saleItems.push({
      barcode: product.barcode,
      description: product.description,
      quantity: 1,
      unitPrice,
    });
  }

  renderSaleItems();
  setApiStatus(`Agregado al listado: ${product.description}`);
};

const setModule = (moduleName) => {
  navButtons.forEach((button) => {
    button.classList.toggle('active', button.dataset.module === moduleName);
  });

  modulePanels.forEach((panel) => {
    panel.classList.toggle('hidden', panel.dataset.modulePanel !== moduleName);
  });

  const isPos = moduleName === 'pos';
  checkoutDock.classList.toggle('hidden', !isPos);
};

const applyFilters = () => {
  const barcode = searchBarcodeInput.value.trim().toLowerCase();
  const rawName = searchNameInput.value.trim().toLowerCase();

  const filtered = allProducts.filter((product) => {
    const barcodeOk = !barcode || product.barcode.toLowerCase().includes(barcode);

    if (!rawName) {
      return barcodeOk;
    }

    const description = product.description.toLowerCase();
    const term = rawName.startsWith('%') ? rawName.slice(1) : rawName;
    const nameOk = description.includes(term);

    return barcodeOk && nameOk;
  });

  renderProducts(filtered);
};

const renderProducts = (products) => {
  if (!products.length) {
    productsBody.innerHTML =
      '<tr><td colspan="6" class="empty">No hay productos para los filtros aplicados.</td></tr>';
    return;
  }

  productsBody.innerHTML = products
    .map((product) => {
      const visiblePrice = getCurrentPrice(product);
      return `
        <tr>
          <td>${product.barcode}</td>
          <td>${product.description}</td>
          <td>${product.brand}</td>
          <td>${formatPrice(visiblePrice)}</td>
          <td>${product.stock}</td>
          <td><button class="add-to-sale" data-barcode="${product.barcode}" type="button">Agregar</button></td>
        </tr>
      `;
    })
    .join('');

  document.querySelectorAll('.add-to-sale').forEach((button) => {
    button.addEventListener('click', () => addProductToSale(button.dataset.barcode));
  });
};

const syncPriceLabels = () => {
  const isCard = activeList === 'card';
  activeListLabel.textContent = `Lista activa: ${isCard ? 'tarjeta' : 'contado'}`;
  priceColumnTitle.textContent = `Precio ${isCard ? 'tarjeta' : 'contado'}`;
  toggleButton.textContent = `Cambiar a ${isCard ? 'contado' : 'tarjeta'}`;

  saleItems = saleItems.map((item) => {
    const product = allProducts.find((entry) => entry.barcode === item.barcode);
    if (!product) {
      return item;
    }
    return { ...item, unitPrice: getCurrentPrice(product) };
  });
  renderSaleItems();
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
  const products = await fetchJson('/products');
  allProducts = products;
  applyFilters();
  syncPriceLabels();
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
  applyFilters();
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

  await fetchJson('/products', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  await loadProducts();
  form.reset();
  setApiStatus(`Producto ${mode === 'add' ? 'agregado' : 'actualizado'} correctamente`);
};

const loadSettings = () => {
  const saved = localStorage.getItem('pos_settings');
  if (!saved) {
    return;
  }

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
  saleItems = [];
  renderSaleItems();
};

const chargeAndInvoice = async (paymentMethod, customerId = null) => {
  if (!saleItems.length) {
    setApiStatus('No hay productos en el listado para cobrar', false);
    return;
  }

  const payload = {
    payment_method: paymentMethod,
    customer_id: customerId,
    items: saleItems.map((item) => ({
      barcode: item.barcode,
      description: item.description,
      quantity: item.quantity,
      unit_price: item.unitPrice,
    })),
  };

  const result = await fetchJson('/billing/charge', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

  const invoiceUrl = `${API_BASE_URL}${result.pdf_url}`;
  invoiceStatus.innerHTML = `Factura ${result.invoice_number} (CAE ${result.cae}) lista: <a href="${invoiceUrl}" target="_blank" rel="noreferrer">descargar/imprimir PDF</a>`;

  window.open(invoiceUrl, '_blank');
  setApiStatus(`Cobro registrado y factura ARCA aprobada (${result.invoice_number})`);
  clearSale();
};

const goToQuoteScreen = () => {
  if (!saleItems.length) {
    setApiStatus('No hay productos para generar presupuesto', false);
    return;
  }

  sessionStorage.setItem('pending_quote', JSON.stringify({ items: saleItems }));
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
    productsBody.innerHTML =
      '<tr><td colspan="6" class="empty">Iniciá el backend para ver datos de productos.</td></tr>';
  }

  renderSaleItems();
  loadSettings();
  setModule('pos');
};

navButtons.forEach((button) => {
  button.addEventListener('click', () => setModule(button.dataset.module));
});

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
  const payload = {
    multiUserEnabled: multiUserInput.checked,
    loginRequired: loginRequiredInput.checked,
  };
  localStorage.setItem('pos_settings', JSON.stringify(payload));
  settingsStatus.textContent = 'Configuración guardada correctamente.';
});

payOptions.forEach((button) => {
  button.addEventListener('click', async () => {
    const method = button.dataset.payMethod;
    try {
      await chargeAndInvoice(method);
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
