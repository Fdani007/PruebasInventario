import { db, ALL_TABLES } from './database.js';
import { createId, nowIso } from '../utils/helpers.js';

const SOFT_DELETE_TABLES = new Set(ALL_TABLES);

function baseEntity(data = {}) {
  const ts = nowIso();
  return { id: createId(), created_at: ts, updated_at: ts, deleted: false, ...data };
}

export async function createRecord(table, data) {
  const entity = baseEntity(data);
  await db.table(table).add(entity);
  return entity;
}

export async function updateRecord(table, id, patch) {
  const ts = nowIso();
  await db.table(table).update(id, { ...patch, updated_at: ts });
  return db.table(table).get(id);
}

export async function softDeleteRecord(table, id) {
  if (!SOFT_DELETE_TABLES.has(table)) return db.table(table).delete(id);
  return updateRecord(table, id, { deleted: true });
}

export async function listActive(table, where = null) {
  const coll = where ? db.table(table).where(where.index).equals(where.value) : db.table(table).toCollection();
  return coll.filter((row) => !row.deleted).toArray();
}

export async function getBundleForBackup() {
  const payload = {};
  for (const table of ALL_TABLES) {
    payload[table] = await db.table(table).toArray();
  }
  payload.meta = {
    exported_at: nowIso(),
    lastSync: (await db.meta.get('lastSync'))?.value || null
  };
  return payload;
}

export async function restoreBackup(payload, mode = 'replace') {
  const missing = ALL_TABLES.filter((table) => !Array.isArray(payload[table]));
  if (missing.length) {
    throw new Error(`Formato inválido, faltan: ${missing.join(', ')}`);
  }

  await db.transaction('rw', [...ALL_TABLES.map((t) => db.table(t)), db.meta], async () => {
    if (mode === 'replace') {
      await Promise.all(ALL_TABLES.map((table) => db.table(table).clear()));
    }

    for (const table of ALL_TABLES) {
      for (const row of payload[table]) {
        await db.table(table).put({ deleted: false, ...row, updated_at: row.updated_at || nowIso() });
      }
    }

    await db.meta.put({ key: 'lastSync', value: payload?.meta?.lastSync || null, updated_at: nowIso() });
  });
}

export async function setLastSync(isoValue) {
  await db.meta.put({ key: 'lastSync', value: isoValue, updated_at: nowIso() });
}

export async function getLastSync() {
  return (await db.meta.get('lastSync'))?.value || null;
}
