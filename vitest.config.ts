import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['supabase/functions/**/*.test.ts', 'src/**/*.test.ts', 'src/**/*.spec.ts', 'src/**/*.test.tsx', 'src/**/*.spec.tsx'],
  },
});
