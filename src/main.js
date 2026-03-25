import { db } from './db/database.js';
import { renderHomePage } from './pages/homePage.js';
import { renderProductsPage } from './pages/productsPage.js';
import { renderProductFormPage } from './pages/productFormPage.js';
import { renderSettingsPage } from './pages/settingsPage.js';
import { setRoute } from './utils/helpers.js';

const app = document.querySelector('#app');
const syncStatus = document.querySelector('#syncStatus');

async function renderRoute() {
  const hash = location.hash || '#/home';
  const [routePath] = hash.split('?');

  document.querySelectorAll('.nav-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.dataset.route === routePath || (routePath.startsWith('#/product') && btn.dataset.route === '#/products'));
  });

  if (routePath === '#/home') return renderHomePage(app, renderRoute);
  if (routePath === '#/products') return renderProductsPage(app, renderRoute);
  if (routePath === '#/settings') return renderSettingsPage(app, renderRoute);
  if (routePath === '#/product/new') return renderProductFormPage(app, null, renderRoute);
  if (routePath.startsWith('#/product/')) return renderProductFormPage(app, routePath.replace('#/product/', ''), renderRoute);

  return setRoute('#/home');
}

function bindNav() {
  document.querySelectorAll('.nav-btn').forEach((btn) => btn.addEventListener('click', () => setRoute(btn.dataset.route)));
}

function bindConnectivity() {
  const update = () => {
    syncStatus.textContent = navigator.onLine ? 'Online (datos locales activos)' : 'Offline (modo local)';
  };
  window.addEventListener('online', update);
  window.addEventListener('offline', update);
  update();
}

async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return;
  try {
    await navigator.serviceWorker.register('./service-worker.js');
  } catch (error) {
    console.warn('No se pudo registrar el service worker', error);
  }
}

async function bootstrap() {
  await db.open();
  bindNav();
  bindConnectivity();
  window.addEventListener('hashchange', renderRoute);
  await registerServiceWorker();
  renderRoute();
}

bootstrap();
