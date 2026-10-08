import { test, expect, type Page, type Route } from '@playwright/test';
import fs from 'node:fs';

// PNG transparente de 1×1 px: basta para comprobar el flujo de subida sin depender de archivos reales.
const PNG_1PX = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==', 'base64');

const DOCTOR = {
  id: '6cc88bb0-8af7-40fc-bcb9-6a055253685d', nombre: 'Dra. Mayela González', especialidad: 'Medicina Estética',
  correo: 'dra@clinicamayela.com', telefono: '+584144334584', foto: null, biografia: '', horario: 'Lunes a Viernes',
  mpps: '652562', col: '7645', firma_base64: null, sello_base64: null,
};
const PACIENTE = { id: 'pac-1', nombre: 'María Fernanda', apellido: 'Rojas', cedula: 'V-12.345.678', telefono: '04120000000', genero: 'Femenino', patologias: ['Hipotiroidismo'], estatura_cm: 165, peso_meta_kg: 62, activo: true };

const json = (route: Route, body: unknown, status = 200) =>
  route.fulfill({ status, contentType: 'application/json', body: JSON.stringify(body) });

/** Simula la sesión y las respuestas de Supabase (no toca la base real). Devuelve lo que la app intentó guardar. */
async function mockSupabase(page: Page) {
  const guardados: Record<string, unknown>[] = [];
  await page.addInitScript(() => {
    const exp = Math.floor(Date.now() / 1000) + 3600;
    const session = {
      access_token: 'mock', token_type: 'bearer', expires_in: 3600, expires_at: exp, refresh_token: 'mock',
      user: { id: '00000000-0000-0000-0000-000000000000', email: 'dra@clinicamayela.com', role: 'authenticated', aud: 'authenticated', app_metadata: {}, user_metadata: {}, created_at: new Date().toISOString() },
    };
    for (const ref of ['hytrretjngjlbkkcoeoi', 'xxxxxxxxxxxx']) localStorage.setItem(`sb-${ref}-auth-token`, JSON.stringify(session));
  });
  await page.route('**/auth/v1/**', (r) => json(r, { id: '00000000-0000-0000-0000-000000000000', email: 'dra@clinicamayela.com' }));
  await page.route('**/rest/v1/rpc/**', (r) => json(r, null));
  await page.route('**/rest/v1/**', async (route) => {
    const req = route.request();
    const tabla = new URL(req.url()).pathname.split('/').pop() ?? '';
    const unico = (req.headers()['accept'] ?? '').includes('vnd.pgrst.object');
    if (req.method() === 'PATCH' || req.method() === 'POST') {
      guardados.push({ tabla, metodo: req.method(), ...(req.postDataJSON() ?? {}) });
      return json(route, tabla === 'doctor_profile' ? { ...DOCTOR, ...req.postDataJSON() } : {}, 200);
    }
    const filas = tabla === 'doctor_profile' ? [DOCTOR] : tabla === 'pacientes' ? [PACIENTE] : [];
    if (unico) return filas[0] ? json(route, filas[0]) : json(route, { code: 'PGRST116', message: 'no rows' }, 406);
    return json(route, filas);
  });
  return guardados;
}

test.describe('Perfil, logo y PDFs', () => {
  test('sube firma y sello, los guarda y el avatar usa el logo nuevo', async ({ page }) => {
    const guardados = await mockSupabase(page);
    await page.goto('/perfil');
    await expect(page.getByText('Perfil', { exact: false }).first()).toBeVisible();

    // Sin foto cargada, el menú y la barra superior muestran el símbolo del logo (no la "M" antigua)
    await expect(page.locator('aside img[src*="simbolo"]').first()).toBeVisible();
    await expect(page.locator('header img[src*="simbolo"]').first()).toBeVisible();
    await expect(page.getByText('Colegio de Médicos (CM)')).toBeVisible();

    const inputs = page.locator('input[type="file"][accept="image/*"]');
    await inputs.nth(0).setInputFiles({ name: 'firma.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(page.locator('img[alt="Firma digitalizada"]')).toBeVisible();
    await inputs.nth(1).setInputFiles({ name: 'sello.png', mimeType: 'image/png', buffer: PNG_1PX });
    await expect(page.locator('img[alt="Sello"]')).toBeVisible();

    await page.getByRole('button', { name: /guardar/i }).first().click();
    await expect.poll(() => guardados.find((g) => g.tabla === 'doctor_profile')).toBeTruthy();
    const perfil = guardados.find((g) => g.tabla === 'doctor_profile') as Record<string, string>;
    expect(perfil.firma_base64).toMatch(/^data:image\/png;base64,/);
    expect(perfil.sello_base64).toMatch(/^data:image\/png;base64,/);
  });

  test('descarga la historia clínica en PDF desde la ficha del paciente', async ({ page }) => {
    await mockSupabase(page);
    await page.goto('/pacientes/pac-1');
    const boton = page.getByTitle('Descargar historia clínica (PDF)');
    await expect(boton).toBeVisible();
    const [descarga] = await Promise.all([page.waitForEvent('download', { timeout: 60_000 }), boton.click()]);
    expect(descarga.suggestedFilename()).toMatch(/^historia_clinica_.*\.pdf$/);
    const ruta = await descarga.path();
    const bytes = fs.readFileSync(ruta!);
    expect(bytes.subarray(0, 4).toString()).toBe('%PDF');
    expect(bytes.length).toBeGreaterThan(20_000); // incluye el logo
  });
});

test('todas las pantallas del panel cargan sin errores de JavaScript', async ({ page }) => {
  test.setTimeout(180_000);
  await mockSupabase(page);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  const rutas = ['/dashboard', '/pacientes', '/pacientes/pac-1', '/agenda', '/tratamientos', '/finanzas', '/galeria', '/ajustes', '/consentimientos', '/perfil', '/peptides', '/calculadora', '/nueva-entrada'];
  for (const r of rutas) {
    await page.goto(r, { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle').catch(() => {});
    await expect(page.locator('aside').first(), `no cargó el menú en ${r}`).toBeVisible();
    await expect(page.getByText(/algo salió mal|something went wrong/i), `error de pantalla en ${r}`).toHaveCount(0);
  }
  expect(errores, errores.join('\n')).toEqual([]);
});
