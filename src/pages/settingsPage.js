import { getLastSync, setLastSync } from '../db/repositories.js';
import { exportBackup, importBackup } from '../utils/backup.js';

export async function renderSettingsPage(container, refresh) {
  const lastSync = await getLastSync();

  container.innerHTML = `
    <section class="card">
      <h2>Respaldo y restauración</h2>
      <p class="small">Última sincronización (estructura futura): ${lastSync || 'Nunca'}</p>
      <div class="row">
        <button id="exportBtn" class="btn-primary">Exportar JSON</button>
        <label class="btn-secondary" style="display:block; text-align:center; cursor:pointer;">
          Importar JSON
          <input id="importInput" type="file" accept="application/json" hidden />
        </label>
      </div>
      <div class="row">
        <button id="markSync" class="btn-inline">Marcar sync ahora</button>
      </div>
      <p class="small">Importar en modo reemplazo borra los datos actuales y carga el archivo.</p>
    </section>
  `;

  container.querySelector('#exportBtn').addEventListener('click', exportBackup);

  container.querySelector('#importInput').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      await importBackup(file, 'replace');
      alert('Backup importado correctamente.');
      refresh();
    } catch (error) {
      alert(`Error al importar backup: ${error.message}`);
    }
  });

  container.querySelector('#markSync').addEventListener('click', async () => {
    await setLastSync(new Date().toISOString());
    refresh();
  });
}
