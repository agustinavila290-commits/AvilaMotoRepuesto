const quoteItemsBody = document.querySelector('#quote-items');
const quoteTotal = document.querySelector('#quote-total');
const quoteDate = document.querySelector('#quote-date');
const printButton = document.querySelector('#print-quote');

const formatPrice = (value) =>
  new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(value);

const raw = sessionStorage.getItem('pending_quote');
const payload = raw ? JSON.parse(raw) : { items: [] };

quoteDate.textContent = `Fecha: ${new Date().toLocaleString('es-AR')}`;

if (!payload.items.length) {
  quoteItemsBody.innerHTML = '<tr><td colspan="5" class="empty">No hay items para presupuesto.</td></tr>';
  quoteTotal.textContent = formatPrice(0);
} else {
  quoteItemsBody.innerHTML = payload.items
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

  const total = payload.items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
  quoteTotal.textContent = `Total presupuesto: ${formatPrice(total)}`;
}

printButton.addEventListener('click', () => window.print());
