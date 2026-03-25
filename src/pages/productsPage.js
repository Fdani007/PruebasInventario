import { db } from '../db/database.js';
import { listActive } from '../db/repositories.js';
import { escapeHtml, setRoute } from '../utils/helpers.js';

function fieldValue(values, fieldId) {
  return values.find((v) => v.field_id === fieldId && !v.deleted)?.value ?? '';
}

export async function renderProductsPage(container) {
  const [types, products, fields, values, variants] = await Promise.all([
    listActive('product_types'),
    listActive('products'),
    listActive('fields'),
    listActive('values'),
    listActive('variants')
  ]);

  const typeId = new URLSearchParams(location.hash.split('?')[1] || '').get('type') || '';
  const query = new URLSearchParams(location.hash.split('?')[1] || '').get('q') || '';

  const visible = products.filter((p) => {
    if (typeId && p.product_type_id !== typeId) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  container.innerHTML = `
    <section class="card">
      <div class="row-between">
        <h2>Productos</h2>
        <button class="btn-inline btn-primary" id="newProduct">+ Nuevo</button>
      </div>
      <div class="row">
        <select id="filterType">
          <option value="">Todos los tipos</option>
          ${types.map((t) => `<option value="${t.id}" ${t.id === typeId ? 'selected' : ''}>${escapeHtml(t.name)}</option>`).join('')}
        </select>
        <input id="searchName" placeholder="Buscar por nombre" value="${escapeHtml(query)}" />
      </div>
    </section>

    <section class="card">
      ${visible.length ? '' : '<p class="empty">No se encontraron productos.</p>'}
      ${visible
        .map((product) => {
          const type = types.find((t) => t.id === product.product_type_id);
          const fByType = fields.filter((f) => f.product_type_id === product.product_type_id && !f.deleted);
          const productValues = values.filter((v) => v.product_id === product.id && !v.deleted);
          const productVariants = variants.filter((v) => v.product_id === product.id && !v.deleted);
          const totalStock = productVariants.reduce((acc, item) => acc + Number(item.stock || 0), 0);
          return `
            <article class="list-item">
              <div class="row-between">
                <div>
                  <strong>${escapeHtml(product.name)}</strong>
                  <p class="small">Tipo: ${escapeHtml(type?.name || 'N/A')}</p>
                </div>
                <button class="btn-inline btn-secondary" data-open-product="${product.id}">Abrir</button>
              </div>
              <div class="small">Stock total: ${totalStock}</div>
              <div>
                ${fByType
                  .map((f) => `<span class="tag">${escapeHtml(f.name)}: ${escapeHtml(String(fieldValue(productValues, f.id) || '-'))}</span>`)
                  .join('')}
              </div>
            </article>
          `;
        })
        .join('')}
    </section>
  `;

  container.querySelector('#newProduct').addEventListener('click', () => setRoute('#/product/new'));

  container.querySelectorAll('[data-open-product]').forEach((btn) => {
    btn.addEventListener('click', () => setRoute(`#/product/${btn.dataset.openProduct}`));
  });

  const applyFilters = () => {
    const p = new URLSearchParams();
    const t = container.querySelector('#filterType').value;
    const q = container.querySelector('#searchName').value.trim();
    if (t) p.set('type', t);
    if (q) p.set('q', q);
    setRoute(`#/products${p.toString() ? `?${p.toString()}` : ''}`);
  };

  container.querySelector('#filterType').addEventListener('change', applyFilters);
  container.querySelector('#searchName').addEventListener('input', applyFilters);
}
