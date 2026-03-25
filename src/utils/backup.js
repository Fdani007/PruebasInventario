import { downloadJson, readJsonFile } from './helpers.js';
import { getBundleForBackup, restoreBackup } from '../db/repositories.js';

export async function exportBackup() {
  const payload = await getBundleForBackup();
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  downloadJson(`inventario-backup-${stamp}.json`, payload);
}

export async function importBackup(file, mode = 'replace') {
  const payload = await readJsonFile(file);
  await restoreBackup(payload, mode);
  return payload;
}
