# Inventario PWA (Offline-First)

Aplicación web progresiva para gestionar inventario sin backend, con persistencia local en IndexedDB (Dexie), soporte offline y despliegue gratis en GitHub Pages.

## Estructura

```text
/src
  /db
    database.js
    repositories.js
  /ui
    modal.js
  /pages
    homePage.js
    productsPage.js
    productFormPage.js
    settingsPage.js
  /utils
    helpers.js
    backup.js
/service-worker.js
/manifest.json
/index.html
/styles.css
```

## Funcionalidades incluidas

- Gestión de tipos de producto.
- Campos dinámicos por tipo (text, number, select).
- Gestión de productos por tipo.
- Valores dinámicos por producto.
- Variantes con stock y precio.
- Búsqueda por nombre y filtro por tipo.
- Soft delete (`deleted`).
- Exportar/importar backup JSON.
- Estructura preparada para sincronización futura (`meta.lastSync`).
- Soporte offline con Service Worker.

## Esquema de backup JSON

El backup exporta:

- `product_types`
- `fields`
- `products`
- `values`
- `variants`
- `meta`

## Ejecutar localmente

> Recomendado: servir por HTTP local para que el Service Worker funcione.

### Opción simple con Python

```bash
python -m http.server 8080
```

Abrir: `http://localhost:8080/index.html#/home`

## Desplegar en GitHub Pages (gratis)

1. Subir el proyecto a un repositorio en GitHub.
2. Ir a **Settings → Pages**.
3. En **Build and deployment**, elegir:
   - **Source**: `Deploy from a branch`
   - **Branch**: `main` (o la rama que uses) y carpeta `/ (root)`
4. Guardar.
5. Esperar publicación y abrir la URL de Pages.

## Notas iPhone Safari

- Abrir la app publicada.
- Compartir → **Add to Home Screen** para instalar como PWA.
- Primera carga requiere conexión para cachear assets; después funciona offline.

