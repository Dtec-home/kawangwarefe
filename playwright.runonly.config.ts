import base from './playwright.config';
import { defineConfig } from '@playwright/test';

const merged = defineConfig({
  ...base,
  use: {
    ...base.use,
    baseURL: 'http://localhost:3000',
  },
  webServer: undefined,
});

export default merged;
