import test from 'node:test';
import assert from 'node:assert/strict';
import { avisoDeLlave, rolDeLlave } from './llave.js';

// JWT de ejemplo (no es una llave real): payload {"role":"service_role"} y {"role":"anon"}
const jwt = (payload) => `eyJhbGciOiJIUzI1NiJ9.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.firma`;

test('lee el rol de una llave JWT', () => {
  assert.equal(rolDeLlave(jwt({ role: 'service_role' })), 'service_role');
  assert.equal(rolDeLlave(jwt({ role: 'anon' })), 'anon');
  assert.equal(rolDeLlave('basura'), null);
  assert.equal(rolDeLlave(undefined), null);
});

test('no avisa si es la service_role', () => {
  assert.equal(avisoDeLlave(jwt({ role: 'service_role' })), null);
});

test('avisa con claridad si pegaste otra llave', () => {
  assert.match(avisoDeLlave(jwt({ role: 'anon' })), /anon/);
  assert.match(avisoDeLlave('sb_secret_abc'), /sb_secret_/);
  assert.match(avisoDeLlave('sb_publishable_abc'), /pública/);
  assert.match(avisoDeLlave(''), /No pude leer/);
});
