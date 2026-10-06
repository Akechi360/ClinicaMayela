import { describe, expect, it } from 'vitest';
import { resolveStorageUrl, toStorageRef } from './storageUrl';

describe('storageUrl', () => {
  it('arma una referencia permanente', () => {
    expect(toStorageRef('examenes', 'p1/a.pdf')).toBe('sb://examenes/p1/a.pdf');
  });
  it('deja pasar las URLs antiguas y los vacíos sin tocar Storage', async () => {
    expect(await resolveStorageUrl('https://x.supabase.co/object/sign/a?token=1')).toBe('https://x.supabase.co/object/sign/a?token=1');
    expect(await resolveStorageUrl(null)).toBe('');
  });
});
