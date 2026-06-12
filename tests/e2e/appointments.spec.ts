import { test, expect } from '@playwright/test';

test.describe('Flujos de Usuario de la Clínica Mayela', () => {
  test('debería cargar el panel de gestión principal', async ({ page }) => {
    // Navegar a la raíz de la aplicación
    await page.goto('/');

    // Verificar el título principal o marca comercial
    const brandHeader = page.locator('h1');
    await expect(brandHeader).toContainText('REJUVENECE');

    // Verificar que la navegación del menú está visible
    const panelLink = page.locator('text=Panel');
    await expect(panelLink).toBeVisible();
  });

  test('debería permitir navegar a la sección de consentimientos', async ({ page }) => {
    await page.goto('/');

    // Hacer clic en el link de Consentimientos en el Sidebar
    await page.click('text=Consentimientos');

    // Verificar la URL y el encabezado de la página
    await expect(page).toHaveURL(/\/consentimientos/);
    const pageHeader = page.locator('h2');
    await expect(pageHeader).toContainText('CONSENTIMIENTOS INFORMADOS');
  });

  test('debería mostrar la agenda de citas', async ({ page }) => {
    await page.goto('/agenda');

    // Verificar que la cabecera de la agenda está visible
    const header = page.locator('h2');
    await expect(header).toContainText('Agenda de Citas');
  });
});
