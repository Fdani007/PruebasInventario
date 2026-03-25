import { createRecord, listActive, softDeleteRecord, updateRecord } from '../db/repositories.js';
import { escapeHtml } from '../utils/helpers.js';

export async function renderHomePage(container, refresh) {
  const types = await listActive('product_types');

  container.innerHTML = `
    <section class="card">
      <h2>Tipos de producto</h2>
      <form id="typeForm" class="row">
        <input name="name" required placeholder="Ej: Bebidas" />
        <button class="btn-primary" type="submit">Crear tipo</button>
      </form>
    </section>

    <section class="card">
      <h3>Lista</h3>
      ${types.length ? '' : '<p class="empty">Aún no hay tipos.</p>'}
      ${types
        .map(
          (type) => `
            <article class="list-item">
              <div class="row-between">
                <strong>${escapeHtml(type.name)}</strong>
                <div class="row">
                  <button class="btn-inline btn-secondary" data-action="edit-type" data-id="${type.id}">Editar</button>
                  <button class="btn-inline btn-danger" data-action="delete-type" data-id="${type.id}">Eliminar</button>
                </div>
              </div>
            </article>
        `
        )
        .join('')}
    </section>
  `;

  container.querySelector('#typeForm').addEventListener('submit', async (event) => {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    await createRecord('product_types', { name: data.get('name')?.toString().trim() });
    refresh();
  });

  container.querySelectorAll('[data-action="delete-type"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      await softDeleteRecord('product_types', btn.dataset.id);
      refresh();
    });
  });

  container.querySelectorAll('[data-action="edit-type"]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const current = types.find((t) => t.id === btn.dataset.id);
      if (!current) return;
      const next = prompt('Nuevo nombre del tipo', current.name);
      if (!next) return;
      await updateRecord('product_types', current.id, { name: next.trim() });
      refresh();
    });
  });
}
