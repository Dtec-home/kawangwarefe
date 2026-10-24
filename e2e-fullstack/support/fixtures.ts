/**
 * Fixtures and the Given/When/Then functions every step file uses.
 *
 * `backend`: the /e2e/ helpers. `world`: what a scenario has learnt so far
 * (the seed, campaign codes, the last SMS id seen, …), fresh per scenario.
 */

import { expect } from "@playwright/test";
import { createBdd, test as base } from "playwright-bdd";
import { Backend, Seed } from "./backend";

export interface World {
  seed?: Seed;
  smsMark: number;
  values: Record<string, string>;
}

export const test = base.extend<{ backend: Backend; world: World }>({
  backend: async ({ request }, use) => {
    await use(new Backend(request));
  },
  world: async ({}, use) => {
    await use({ smsMark: 0, values: {} });
  },
});

export { expect };
export const { Given, When, Then } = createBdd(test);
