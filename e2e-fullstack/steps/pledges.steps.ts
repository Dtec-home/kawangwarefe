/**
 * Pledge journeys (lane E2E-B): My pledges, the public "Pledge to give later"
 * form with its SMS code, the pledge register, Pay Bill payments applied to
 * pledges, cancelling, and the reminders job.
 *
 * Every step text mentions pledges so it cannot clash with another lane's.
 */

import { Given, Then, When, expect } from "../support/fixtures";
import { signInThroughUi } from "../support/session";
import {
  backdatePledgeDue,
  chooseInSelect,
  createPledgeCampaign,
  figure,
  myPledgeCard,
  nairobiDate,
  personNamed,
  pledgeCampaign,
  pledgeThroughApi,
  registerCell,
  registerRows,
  smsDate,
  tokenOf,
} from "../support/pledges";

const kes = (amount: string) =>
  `KES ${Number(amount).toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// ── setup ──────────────────────────────────────────────────────────────────

Given(
  "the {string} campaign with Pay Bill code {string} is taking pledges",
  async ({ backend, world }, title: string, code: string) => {
    await createPledgeCampaign(backend, world, title, code);
  },
);

Given(
  "{string} has pledged KES {int} to the {string} campaign",
  async ({ backend, world }, name: string, amount: number, title: string) => {
    const person = personNamed(world, name);
    await pledgeThroughApi(backend, world, person.key, {
      amount: String(amount),
      campaignId: pledgeCampaign(world, title).id,
    });
  },
);

Given(
  "{string} has pledged KES {int} to the {string} campaign, due in {int} days",
  async ({ backend, world }, name: string, amount: number, title: string, days: number) => {
    const person = personNamed(world, name);
    const due = nairobiDate(days);
    world.values[`due:${name}`] = due;
    await pledgeThroughApi(backend, world, person.key, {
      amount: String(amount),
      campaignId: pledgeCampaign(world, title).id,
      dueDate: due,
    });
  },
);

Given(
  "{string} has pledged KES {int} to the {string} campaign, due yesterday",
  async ({ backend, world }, name: string, amount: number, title: string) => {
    const person = personNamed(world, name);
    const id = await pledgeThroughApi(backend, world, person.key, {
      amount: String(amount),
      campaignId: pledgeCampaign(world, title).id,
      dueDate: nairobiDate(0),
    });
    const yesterday = nairobiDate(-1);
    backdatePledgeDue(id, yesterday);
    world.values[`due:${name}`] = yesterday;
  },
);

// ── My pledges ─────────────────────────────────────────────────────────────

When("I open My pledges", async ({ page }) => {
  await page.goto("/pledges");
  await expect(page.getByRole("heading", { name: "My pledges" })).toBeVisible();
});

Then("My pledges says I have no pledges yet", async ({ page }) => {
  await expect(page.getByText("You have no pledges yet")).toBeVisible();
});

async function makePledge(
  page: import("@playwright/test").Page,
  kind: "campaign" | "department",
  target: string,
  amount: number,
) {
  await page.getByRole("button", { name: "Make a pledge" }).first().click();
  const dialog = page.getByRole("dialog", { name: "Make a pledge" });
  await expect(dialog).toBeVisible();
  if (kind === "department") {
    await dialog.getByText("A department", { exact: true }).click();
    await chooseInSelect(page, "pledge-department", target);
  } else {
    await chooseInSelect(page, "pledge-campaign", target);
  }
  await dialog.locator("#pledge-amount").fill(String(amount));
  await dialog.getByRole("button", { name: "Pledge", exact: true }).click();
  await expect(dialog).toBeHidden();
  await expect(myPledgeCard(page, target, kes(String(amount)))).toBeVisible();
}

When(
  "I pledge KES {int} to the campaign {string} from My pledges",
  async ({ page }, amount: number, title: string) => {
    await makePledge(page, "campaign", title, amount);
  },
);

When(
  "I pledge KES {int} to the department {string} from My pledges",
  async ({ page }, amount: number, department: string) => {
    await makePledge(page, "department", department, amount);
  },
);

Then(
  "my pledge of {string} to {string} shows paid {string}, balance {string} and status {string}",
  async ({ page }, pledged: string, target: string, paid: string, balance: string, status: string) => {
    // Payments arrive from Safaricom's side, so the page may need a fresh look.
    await expect(async () => {
      await page.reload();
      const card = myPledgeCard(page, target, pledged);
      await expect(card).toHaveCount(1, { timeout: 5_000 });
      await expect(figure(card, "Paid")).toHaveText(paid, { timeout: 2_000 });
      await expect(figure(card, "Balance")).toHaveText(balance, { timeout: 2_000 });
      await expect(card.getByTestId("pledge-status")).toHaveText(status, { timeout: 2_000 });
    }).toPass({ timeout: 30_000 });
  },
);

Then(
  "My pledges totals show pledged {string}, paid {string} and balance {string}",
  async ({ page }, pledged: string, paid: string, balance: string) => {
    const totals = page.locator('dl[aria-label="Pledge totals"]');
    await expect(figure(totals, "Pledged")).toHaveText(pledged);
    await expect(figure(totals, "Paid")).toHaveText(paid);
    await expect(figure(totals, "Balance")).toHaveText(balance);
  },
);

When(
  "I cancel my pledge of {string} to {string} giving the reason {string}",
  async ({ page }, pledged: string, target: string, reason: string) => {
    const dialog = page.getByRole("dialog", { name: "Cancel this pledge?" });
    // After a refused reason the dialog is still open: give the new reason there.
    if (!(await dialog.isVisible())) {
      await myPledgeCard(page, target, pledged).getByRole("button", { name: "Cancel pledge" }).click();
    }
    await expect(dialog).toContainText(pledged);
    await dialog.getByLabel("Reason").fill(reason);
    await dialog.getByRole("button", { name: "Cancel pledge" }).click();
  },
);

Then("the pledge cancel dialog asks for a longer reason", async ({ page }) => {
  const dialog = page.getByRole("dialog");
  await expect(dialog.getByText("Give a reason of at least 5 characters.")).toBeVisible();
});

Then("the pledge cancel dialog closes", async ({ page }) => {
  await expect(page.getByRole("dialog")).toBeHidden();
});

Then(
  "my pledge of {string} to {string} can no longer be cancelled or paid",
  async ({ page }, pledged: string, target: string) => {
    const card = myPledgeCard(page, target, pledged);
    await expect(card.getByRole("button", { name: "Cancel pledge" })).toHaveCount(0);
    await expect(card.getByRole("link", { name: "Pay balance" })).toHaveCount(0);
  },
);

// ── Pay Bill ───────────────────────────────────────────────────────────────

When(
  "the {word} pays KES {int} by Pay Bill to the pledge campaign code {string}",
  async ({ backend, world }, role: string, amount: number, code: string) => {
    const result = await backend.paybill(world.seed!.people[role].phone, String(amount), code);
    expect(result.status).toBe(200);
  },
);

// ── the public page ────────────────────────────────────────────────────────

When("a visitor opens the public page of the {string} pledge campaign", async ({ page, world }, title: string) => {
  await page.goto(`/campaigns/${pledgeCampaign(world, title).slug}`);
  await expect(page.getByRole("heading", { name: "Pledge to give later" })).toBeVisible();
});

When(
  "the visitor asks to pledge KES {int} as {string} from phone {string}",
  async ({ page, backend, world }, amount: number, name: string, phone: string) => {
    world.smsMark = await backend.lastSmsId();
    const form = page.getByRole("form", { name: "Pledge to give later" });
    await form.getByLabel("Your name").fill(name);
    await form.locator("#guestPhone").fill(phone.replace(/^0/, ""));
    await form.getByLabel("Amount (KES)").fill(String(amount));
    await form.getByRole("button", { name: "Send me a code" }).click();
    await expect(page.getByRole("form", { name: "Confirm your pledge" })).toBeVisible();
  },
);

Then(
  "the visitor's phone {string} receives a pledge confirmation code",
  async ({ backend, world }, phone: string) => {
    const sms = await backend.expectSms(phone, ["is your code to confirm your pledge"], world.smsMark);
    world.values.guestPhone = phone;
    world.values.guestCode = sms.body.match(/\b(\d{6})\b/)![1];
    expect(await backend.latestCode(phone, world.smsMark)).toBe(world.values.guestCode);
  },
);

async function typePledgeCode(page: import("@playwright/test").Page, code: string) {
  const form = page.getByRole("form", { name: "Confirm your pledge" });
  await form.getByLabel("6-digit code").fill(code);
  await form.getByRole("button", { name: "Confirm pledge" }).click();
}

When("the visitor types a wrong pledge confirmation code", async ({ page, world }) => {
  const wrong = String((Number(world.values.guestCode) + 1) % 1_000_000).padStart(6, "0");
  await typePledgeCode(page, wrong);
});

Then("the public page refuses the pledge code with {string}", async ({ page }, message: string) => {
  const form = page.getByRole("form", { name: "Confirm your pledge" });
  await expect(form.getByRole("alert")).toContainText(message);
});

When("the visitor types the pledge confirmation code from the SMS", async ({ page, world }) => {
  await typePledgeCode(page, world.values.guestCode);
});

Then(
  "the public page confirms the pledge of {string} for {string}",
  async ({ page }, amount: string, firstName: string) => {
    const done = page.getByRole("status").filter({ hasText: "Your pledge is confirmed." });
    await expect(done).toContainText(`Thank you, ${firstName}!`);
    await expect(done).toContainText(amount);
  },
);

Then("the public page shows {string} pledged to the campaign", async ({ page }, amount: string) => {
  await expect(async () => {
    await page.reload();
    await expect(page.getByTestId("pledge-totals")).toContainText(`Pledged ${amount}`, { timeout: 3_000 });
  }).toPass({ timeout: 30_000 });
});

Then("the pledge confirmation code does not sign the visitor in", async ({ backend, world }) => {
  const result = await backend.graphql(
    `mutation($p: String!, $c: String!) { verifyOtp(phoneNumber: $p, otpCode: $c) { success accessToken } }`,
    { p: world.values.guestPhone, c: world.values.guestCode },
  );
  expect(result.data?.verifyOtp?.success).toBeFalsy();
  expect(result.data?.verifyOtp?.accessToken ?? null).toBeNull();
});

Then(
  "the visitor is on the church's books as a guest without a login",
  async ({ backend, world }) => {
    const admin = await tokenOf(backend, world, "admin");
    const result = await backend.graphql(
      `query($p: String!) { memberByPhone(phoneNumber: $p) { firstName isGuest } }`,
      { p: world.values.guestPhone },
      admin,
    );
    expect(result.errors).toBeUndefined();
    expect(result.data.memberByPhone).toMatchObject({ isGuest: true });
  },
);

// ── the pledge register ────────────────────────────────────────────────────

When("I open the pledge register", async ({ page }) => {
  await page.goto("/admin/pledges");
  await expect(page.getByRole("heading", { name: "Pledges", exact: true })).toBeVisible();
  await expect(page.getByRole("button", { name: "Record a pledge card" })).toBeVisible();
});

When(
  "I record a pledge card for new giver {string} on phone {string} pledging KES {int} to the {string} campaign",
  async ({ page }, name: string, phone: string, amount: number, title: string) => {
    await page.getByRole("button", { name: "Record a pledge card" }).click();
    const dialog = page.getByRole("dialog", { name: "Record a pledge card" });
    await dialog.locator("#phoneNumber").fill(phone.replace(/^0/, ""));
    await dialog.getByLabel("Member name").fill(name);
    await chooseInSelect(page, "record-pledge-campaign", title);
    await dialog.getByLabel("Amount (KES)").fill(String(amount));
    await dialog.getByRole("button", { name: "Save pledge" }).click();
    await expect(dialog).toBeHidden();
  },
);

Then(
  "the pledge register lists {string} pledging {string} to {string} from {string}",
  async ({ page }, name: string, amount: string, target: string, source: string) => {
    const row = registerRows(page, name).filter({ hasText: amount });
    await expect(row).toHaveCount(1);
    await expect(await registerCell(page, row, "For")).toHaveText(target);
    await expect(await registerCell(page, row, "Source")).toHaveText(source);
  },
);

Then(
  "the pledge register shows {string}'s pledge of {string} with paid {string}, balance {string} and status {string}",
  async ({ page }, name: string, amount: string, paid: string, balance: string, status: string) => {
    await expect(async () => {
      await page.reload();
      const row = registerRows(page, name).filter({ has: page.locator("td").getByText(amount, { exact: true }) });
      await expect(row.first()).toBeVisible({ timeout: 5_000 });
      // Several pledges of the same amount: the one whose paid figure matches.
      const match = row.filter({ hasText: status });
      const count = await match.count();
      let found = false;
      for (let i = 0; i < count && !found; i++) {
        const r = match.nth(i);
        const [p, b, s] = await Promise.all([
          (await registerCell(page, r, "Paid")).innerText(),
          (await registerCell(page, r, "Balance")).innerText(),
          (await registerCell(page, r, "Status")).innerText(),
        ]);
        found = p.trim() === paid && b.trim() === balance && s.trim() === status;
      }
      expect(found, `${name}: ${amount} paid ${paid} balance ${balance} ${status}`).toBe(true);
    }).toPass({ timeout: 30_000 });
  },
);

Then(
  "the pledge register totals show pledged {string}, paid {string}, outstanding {string} and {int} pledge(s)",
  async ({ page }, pledged: string, paid: string, outstanding: string, count: number) => {
    await expect(page.getByTestId("pledge-total-pledged")).toContainText(pledged);
    await expect(page.getByTestId("pledge-total-paid")).toContainText(paid);
    await expect(page.getByTestId("pledge-total-outstanding")).toContainText(outstanding);
    await expect(page.getByTestId("pledge-total-count")).toContainText(String(count));
  },
);

When("I filter the pledge register to the {string} campaign", async ({ page }, title: string) => {
  await chooseInSelect(page, "pledge-campaign", title);
});

When("I filter the pledge register by status {string}", async ({ page }, status: string) => {
  await chooseInSelect(page, "pledge-status", status);
});

When("I search the pledge register for {string}", async ({ page }, term: string) => {
  await page.locator("#pledge-search").fill(term);
  await page.getByRole("button", { name: "Search", exact: true }).click();
});

When("I reset the pledge register filters", async ({ page }) => {
  await page.getByRole("button", { name: "Reset filters" }).click();
  await expect(page.locator("#pledge-campaign")).toContainText("All campaigns");
});

Then("the pledge register lists only {string}", async ({ page }, names: string) => {
  const expected = names.split(/\s*,\s*|\s+and\s+/).filter(Boolean).sort();
  await expect(async () => {
    const shown = (await registerRows(page).locator("td:first-child").allInnerTexts()).map((n) => n.trim()).sort();
    expect(shown).toEqual(expected);
  }).toPass({ timeout: 15_000 });
});

Then("the pledge register says no pledges match", async ({ page }) => {
  await expect(page.getByText("No pledges match")).toBeVisible();
  await expect(registerRows(page)).toHaveCount(0);
});

When(
  "I export the pledge register as {string} and get a file ending in {string}",
  async ({ page }, button: string, extension: string) => {
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: button }).click();
    const file = await download;
    const name = file.suggestedFilename();
    expect(name).toMatch(new RegExp(`^Pledge_Register_[A-Za-z0-9_]+_${nairobiDate(0)}\\${extension}$`));
    const size = (await import("node:fs")).statSync(await file.path()).size;
    expect(size).toBeGreaterThan(500);
  },
);

When(
  "I cancel {string}'s pledge in the register giving the reason {string}",
  async ({ page }, name: string, reason: string) => {
    await page.getByRole("button", { name: `Cancel pledge of ${name}` }).click();
    const dialog = page.getByRole("dialog", { name: "Cancel pledge" });
    await dialog.getByLabel("Reason").fill(reason);
    await dialog.getByRole("button", { name: "Cancel pledge" }).click();
    await expect(dialog).toBeHidden();
  },
);

// ── reminders ──────────────────────────────────────────────────────────────

When("the pledge reminders job runs", async ({ backend, world }) => {
  world.smsMark = await backend.lastSmsId();
  const result = await backend.runJob("pledge-reminders");
  world.values.remindersSent = String(result.sent);
});

Then("{int} pledge reminder(s) went out", async ({ world }, count: number) => {
  expect(Number(world.values.remindersSent)).toBe(count);
});

Then(
  "{string} gets a pledge reminder SMS that it is due soon with balance {string} and Pay Bill account {string}",
  async ({ backend, world }, name: string, balance: string, code: string) => {
    const person = personNamed(world, name);
    await backend.expectSms(
      person.phone,
      [
        "a friendly reminder",
        `is due on ${smsDate(world.values[`due:${name}`])}`,
        `Balance: ${balance}`,
        `Pay Bill ${world.seed!.paybill}, Account ${code}`,
      ],
      world.smsMark,
    );
  },
);

Then(
  "{string} gets an overdue pledge notice with balance {string} and Pay Bill account {string}",
  async ({ backend, world }, name: string, balance: string, code: string) => {
    const person = personNamed(world, name);
    await backend.expectSms(
      person.phone,
      [
        "is now overdue",
        `(it was due on ${smsDate(world.values[`due:${name}`])})`,
        `Balance: ${balance}`,
        `Pay Bill ${world.seed!.paybill}, Account ${code}`,
      ],
      world.smsMark,
    );
  },
);

Then("my pledge of {string} to {string} is marked overdue", async ({ page }, pledged: string, target: string) => {
  const card = myPledgeCard(page, target, pledged);
  await expect(card.getByTestId("pledge-status")).toHaveText("Overdue");
  await expect(card.getByTestId("pledge-due")).toHaveAttribute("data-overdue", "true");
});

When("I sign in for pledges as the {word}", async ({ page, backend, world }, role: string) => {
  // A second person in the same scenario: forget the first one's session.
  await page.context().clearCookies();
  await page.goto("/");
  await page.evaluate(() => {
    localStorage.clear();
    sessionStorage.clear();
  });
  await signInThroughUi(page, backend, world.seed!.people[role].phone);
});
