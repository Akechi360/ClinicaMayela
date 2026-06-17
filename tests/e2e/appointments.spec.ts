import { test, expect } from '@playwright/test';

test.describe('Flujos de Usuario de la Clínica Mayela', () => {
  test.beforeEach(async ({ page }) => {
    // Inyectar un token de sesión de Supabase simulado en localStorage antes de que cargue la página
    await page.addInitScript(() => {
      const mockSession = {
        access_token: 'mock-access-token-12345',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'mock-refresh-token-12345',
        user: {
          id: '00000000-0000-0000-0000-000000000000',
          email: 'dra.mayela@clinicamayela.com',
          role: 'authenticated',
          aud: 'authenticated',
          app_metadata: { provider: 'email', providers: ['email'] },
          user_metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        expires_at: Math.floor(Date.now() / 1000) + 3600
      };
      window.localStorage.setItem('sb-hytrretjngjlbkkcoeoi-auth-token', JSON.stringify(mockSession));
    });
  });

  test('debería cargar el panel de gestión principal', async ({ page }) => {
    // Navegar a la raíz de la aplicación
    await page.goto('/');

    // Verificar el título principal o marca comercial (primera coincidencia para evitar duplicación de logos)
    const brandHeader = page.locator('h1').first();
    await expect(brandHeader).toContainText('Clínica Mayela');

    // Verificar que la navegación del menú está visible (buscando dentro de la barra lateral)
    const panelLink = page.locator('nav a:has-text("Panel")').first();
    await expect(panelLink).toBeVisible();
  });

  test('debería permitir navegar a la sección de consentimientos', async ({ page }) => {
    await page.goto('/');

    // Hacer clic en el link de Consentimientos en el Sidebar
    await page.click('nav a:has-text("Consentimientos")');

    // Verificar la URL y el encabezado de la página (buscando en el contenido principal)
    await expect(page).toHaveURL(/\/consentimientos/);
    const pageHeader = page.locator('main h2');
    await expect(pageHeader).toContainText('Consentimientos');
  });

  test('debería mostrar la agenda de citas', async ({ page }) => {
    await page.goto('/agenda');

    // Verificar que la cabecera de la agenda está visible (buscando en el contenido principal)
    const header = page.locator('main h2');
    await expect(header).toContainText('Agenda');
  });
});
