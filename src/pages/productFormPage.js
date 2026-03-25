import { db } from '../db/database.js';
import { createId, normalizeNumber, setRoute } from '../utils/helpers.js';
import { createRecord, listActive, softDeleteRecord, updateRecord } from '../db/repositories.js';

export async function renderProductFormPage(container, productId) {
  const [types, fields, products, values, variants] = await Promise.all([
    listActive('product_types'),
    listActive('fields'),
    listActive('products'),
    listActive('values'),
    listActive('variants')
  ]);

  const existing = products.find((p) => p.id === productId);
  const selectedTypeId = existing?.product_type_id || types[0]?.id || '';
  const fieldsByType = fields.filter((f) => f.product_type_id === selectedTypeId && !f.deleted);
  const currentValues = values.filter((v) => v.product_id === existing?.id && !v.deleted);
  const currentVariants = variants.filter((v) => v.product_id === existing?.id && !v.deleted);

  const getVal = (fieldId) => currentValues.find((v) => v.field_id === fieldId)?.value ?? '';

  container.innerHTML = `
    <section class="card">
      <div class="row-between">
        <h2>${existing ? 'Editar producto' : 'Nuevo producto'}</h2>
        <button class="btn-inline" id="backProducts">Volver</button>
      </div>
      ${types.length ? '' : '<p class="empty">Primero crea al menos un tipo.</p>'}
      <form id="productForm">
        <label>Nombre</label>
        <input name="name" required value="${existing?.name || ''}" placeholder="Nombre del producto" />
        <label>Tipo</label>
        <select name="product_type_id" ${existing ? 'disabled' : ''}>
          ${types.map((t) => `<option value="${t.id}" ${t.id === selectedTypeId ? 'selected' : ''}>${t.name}</option>`).join('')}
        </select>
        <div id="dynamicFields"></div>
        <button type="submit" class="btn-primary">Guardar producto</button>
      </form>
    </section>

    <section class="card">
      <div class="row-between">
        <h3>Campos dinámicos del tipo</h3>
        <button class="btn-inline btn-secondary" id="addFieldBtn">+ Campo</button>
      </div>
      <div id="fieldsList"></div>
    </section>

    <section class="card">
      <div class="row-between">
        <h3>Variantes (stock/precio)</h3>
        <button class="btn-inline btn-secondary" id="addVariantBtn">+ Variante</button>
      </div>
      <div id="variantsList"></div>
      ${existing ? '<button class="btn-danger" id="deleteProductBtn">Eliminar producto</button>' : ''}
    </section>
  `;

  container.querySelector('#backProducts').addEventListener('click', () => setRoute('#/products'));

  const dynamicFieldsEl = container.querySelector('#dynamicFields');
  const fieldsListEl = container.querySelector('#fieldsList');
  const variantsListEl = container.querySelector('#variantsList');

  function renderDynamicFields() {
    const selected = container.querySelector('[name="product_type_id"]').value;
    const local = fields.filter((f) => f.product_type_id === selected && !f.deleted);
    dynamicFieldsEl.innerHTML = local.length
      ? local
          .map((f) => {
            if (f.type === 'select') {
              const options = Array.isArray(f.options) ? f.options : [];
              return `<label>${f.name}</label><select name="field_${f.id}">${options
                .map((opt) => `<option ${String(getVal(f.id)) === opt ? 'selected' : ''}>${opt}</option>`)
                .join('')}</select>`;
            }
            return `<label>${f.name}</label><input name="field_${f.id}" type="${f.type === 'number' ? 'number' : 'text'}" value="${getVal(f.id)}" />`;
          })
          .join('')
      : '<p class="small">Este tipo aún no tiene campos dinámicos.</p>';

    fieldsListEl.innerHTML = local.length
      ? local
          .map(
            (f) => `<div class="list-item row-between"><div>${f.name} <span class="small">(${f.type})</span></div><button class="btn-inline btn-danger" data-delete-field="${f.id}">Eliminar</button></div>`
          )
          .join('')
      : '<p class="small">Sin campos.</p>';

    fieldsListEl.querySelectorAll('[data-delete-field]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await softDeleteRecord('fields', btn.dataset.deleteField);
        setRoute(location.hash);
      });
    });
  }

  function renderVariants() {
    variantsListEl.innerHTML = currentVariants.length
      ? currentVariants
          .map(
            (v) => `<div class="list-item row-between"><div><strong>${v.name}</strong><div class="small">Stock ${v.stock} · $${v.price}</div></div><button class="btn-inline btn-danger" data-delete-variant="${v.id}">Eliminar</button></div>`
          )
          .join('')
      : '<p class="small">Sin variantes aún.</p>';

    variantsListEl.querySelectorAll('[data-delete-variant]').forEach((btn) => {
      btn.addEventListener('click', async () => {
        await softDeleteRecord('variants', btn.dataset.deleteVariant);
        setRoute(location.hash);
      });
    });
  }

  renderDynamicFields();
  renderVariants();

  container.querySelector('[name="product_type_id"]')?.addEventListener('change', renderDynamicFields);

  container.querySelector('#addFieldBtn').addEventListener('click', async () => {
    const name = prompt('Nombre del campo');
    if (!name) return;
    const type = prompt('Tipo (text, number, select)', 'text') || 'text';
    let options = [];
    if (type === 'select') {
      options = (prompt('Opciones separadas por coma', 'Rojo,Azul,Verde') || '')
        .split(',')
        .map((x) => x.trim())
        .filter(Boolean);
    }

    await createRecord('fields', {
      product_type_id: container.querySelector('[name="product_type_id"]').value,
      name: name.trim(),
      type,
      options
    });
    setRoute(location.hash);
  });

  container.querySelector('#addVariantBtn').addEventListener('click', async () => {
    if (!existing) {
      alert('Guarda el producto primero para poder agregar variantes.');
      return;
    }
    const name = prompt('Nombre de variante (ej: 500ml)');
    if (!name) return;
    const stock = prompt('Stock inicial', '0');
    const price = prompt('Precio', '0');

    await createRecord('variants', {
      product_id: existing.id,
      name: name.trim(),
      stock: normalizeNumber(stock),
      price: normalizeNumber(price)
    });
    setRoute(location.hash);
  });

  container.querySelector('#productForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const payload = {
      name: formData.get('name')?.toString().trim(),
      product_type_id: existing?.product_type_id || formData.get('product_type_id')?.toString()
    };

    let product = existing;
    if (!existing) {
      product = await createRecord('products', payload);
    } else {
      product = await updateRecord('products', existing.id, payload);
    }

    const localFields = fields.filter((f) => f.product_type_id === payload.product_type_id && !f.deleted);
    await db.transaction('rw', db.values, async () => {
      for (const field of localFields) {
        const value = formData.get(`field_${field.id}`)?.toString() ?? '';
        const found = currentValues.find((v) => v.field_id === field.id);
        if (found) {
          await db.values.update(found.id, { value, updated_at: new Date().toISOString() });
        } else {
          await db.values.add({
            id: createId(),
            product_id: product.id,
            field_id: field.id,
            value,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            deleted: false
          });
        }
      }
    });

    setRoute(`#/product/${product.id}`);
  });

  container.querySelector('#deleteProductBtn')?.addEventListener('click', async () => {
    if (!confirm('¿Seguro que deseas eliminar este producto?')) return;
    await softDeleteRecord('products', existing.id);
    setRoute('#/products');
  });
}
