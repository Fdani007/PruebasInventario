export function showConfirm(message) {
  return Promise.resolve(window.confirm(message));
}
