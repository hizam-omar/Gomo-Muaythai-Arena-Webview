export const ADMIN_SESSION_KEY = 'gomo-admin-authenticated';
export const ADMIN_PASSWORD = 'G0M0@';

export function isAdminAuthenticated(): boolean {
  return window.sessionStorage.getItem(ADMIN_SESSION_KEY) === 'true';
}

export function startAdminSession(): void {
  window.sessionStorage.setItem(ADMIN_SESSION_KEY, 'true');
}

export function endAdminSession(): void {
  window.sessionStorage.removeItem(ADMIN_SESSION_KEY);
}
