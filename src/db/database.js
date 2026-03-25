import Dexie from 'https://cdn.jsdelivr.net/npm/dexie@4.0.8/+esm';

export const db = new Dexie('inventory_pwa_db');

db.version(1).stores({
  product_types: 'id, name, updated_at, deleted',
  fields: 'id, product_type_id, name, type, updated_at, deleted',
  products: 'id, product_type_id, name, updated_at, deleted',
  values: 'id, product_id, field_id, updated_at, deleted',
  variants: 'id, product_id, updated_at, deleted',
  meta: 'key, updated_at'
});

export const ALL_TABLES = ['product_types', 'fields', 'products', 'values', 'variants'];
