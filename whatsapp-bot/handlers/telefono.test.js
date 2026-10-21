import test from 'node:test';
import assert from 'node:assert/strict';
import { formatoLocal, mismoTelefono, normalizarTelefono } from './telefono.js';

test('normaliza teléfonos venezolanos en cualquier formato', () => {
  assert.equal(normalizarTelefono('0414-433.4584'), '584144334584');
  assert.equal(normalizarTelefono('+58 414 4334584'), '584144334584');
  assert.equal(normalizarTelefono('4144334584'), '584144334584');
  assert.equal(normalizarTelefono(''), '');
});

test('reconoce el mismo número escrito distinto', () => {
  assert.equal(mismoTelefono('0414-433.4584', '584144334584'), true);
  assert.equal(mismoTelefono('+58 424-5500042', '04245500042'), true);
  assert.equal(mismoTelefono('0414-1111111', '584144334584'), false);
  assert.equal(mismoTelefono('', '584144334584'), false);
});

test('formato local para guardar en la app', () => {
  assert.equal(formatoLocal('584144334584'), '04144334584');
});
