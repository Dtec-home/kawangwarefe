/**
 * Steps shared by every journey: setting up the church, signing in, and the
 * checks that every journey ends with (SMS received, nothing left the machine).
 */

import { Given, Then, expect } from "../support/fixtures";
import { signInThroughUi } from "../support/session";

Given("the church is set up with its departments and people", async ({ backend, world }) => {
  world.seed = await backend.reset();
  world.smsMark = 0;
});

Given("I am signed in as the {word}", async ({ page, backend, world }, role: string) => {
  const person = world.seed!.people[role];
  if (!person) throw new Error(`no seeded person "${role}"`);
  await signInThroughUi(page, backend, person.phone);
});

Then("the {word} receives an SMS containing {string}", async ({ backend, world }, role: string, text: string) => {
  await backend.expectSms(world.seed!.people[role].phone, [text]);
});

Then("no request left the machine", async ({ backend }) => {
  expect(await backend.blockedRequests()).toEqual([]);
});
