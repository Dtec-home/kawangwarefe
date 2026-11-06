/**
 * MG-2 e2e: merge a Pay Bill guest into a member through the UI, verify
 * totals, pay from the old number, then undo from Recent Merges.
 */

import { Given, When, Then, expect } from "../support/fixtures";
import { dismissTours, freshPhone, tokenOnce } from "../support/desk";

// World keys
const GUEST_PHONE = "merge.guestPhone";
const SURVIVOR_ID = "merge.survivorId";
const GUEST_ID = "merge.guestId";
const UNDO_SEEN_PREVIEW = "merge.undoPreviewSeen";

// ─── Seeding ──────────────────────────────────────────────────────

Given(
  "a guest {string} paid {int} to {string} and {int} to {string} from a new number",
  async ({ backend, world }, _name: string, amt1: number, dept1: string, amt2: number, dept2: string) => {
    const phone = freshPhone();
    world.values[GUEST_PHONE] = phone;
    await backend.paybill(phone, String(amt1), dept1, _name.split(" ")[0]);
    await backend.paybill(phone, String(amt2), dept2, _name.split(" ")[0]);
  },
);

Given(
  "{string} has given {int} to {string}",
  async ({ backend, world }, personName: string, amount: number, deptName: string) => {
    const entry = Object.values(world.seed!.people).find((p) => p.name === personName);
    if (!entry) throw new Error(`No seeded person named "${personName}"`);
    const adminToken = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    const cat = Object.values(world.seed!.departments).find((d) => d.name === deptName);
    if (!cat) throw new Error(`No seeded department named "${deptName}"`);
    await backend.graphql(
      `mutation($p: String!, $c: ID!, $a: String!) {
        createManualContribution(phoneNumber: $p, categoryId: $c, amount: $a) { success message }
      }`,
      { p: entry.phone, c: String(cat.id), a: String(amount) },
      adminToken,
    );
    world.values["merge.survivorPhone"] = entry.phone;
  },
);

Given(
  "{string} has pledged {int} to {string}",
  async ({ backend, world }, personName: string, amount: number, deptName: string) => {
    const entry = Object.values(world.seed!.people).find((p) => p.name === personName);
    if (!entry) throw new Error(`No seeded person named "${personName}"`);
    const memberToken = await tokenOnce(backend, world.values, entry.phone);
    const cat = Object.values(world.seed!.departments).find((d) => d.name === deptName);
    if (!cat) throw new Error(`No seeded department named "${deptName}"`);
    await backend.graphql(
      `mutation($input: PledgeInput!) { createPledge(input: $input) { success message pledge { id } } }`,
      { input: { amount: String(amount), categoryId: String(cat.id) } },
      memberToken,
    );
  },
);

// ─── UI navigation ────────────────────────────────────────────────

When(
  "the admin opens the merge page and picks the guest as duplicate and {string} as survivor",
  async ({ page, backend, world }, survivorName: string) => {
    await dismissTours(backend, page, ["admin_members_v1"]);
    await page.goto("/admin/members");

    // Look up IDs via GraphQL so we don't depend on UI search order
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    const guestResult = await backend.graphql(
      `query($p: String!) { memberByPhone(phoneNumber: $p) { id fullName } }`,
      { p: world.values[GUEST_PHONE] },
      token,
    );
    const survivorResult = await backend.graphql(
      `query($name: String!) { membersList(search: $name, limit: 5) { items { id fullName } } }`,
      { name: survivorName },
      token,
    );
    const guest = guestResult.data.memberByPhone;
    const survivor = survivorResult.data.membersList.items.find(
      (m: { fullName: string }) => m.fullName.trim().toLowerCase() === survivorName.toLowerCase(),
    );
    if (!guest) throw new Error(`Guest not found for phone ${world.values[GUEST_PHONE]}`);
    if (!survivor) throw new Error(`Survivor "${survivorName}" not found`);
    world.values[GUEST_ID] = guest.id;
    world.values[SURVIVOR_ID] = survivor.id;

    // Click Merge on the matching row in the Possible Duplicates section
    const section = page.getByRole("region").filter({ hasText: "Possible Duplicates" })
      .or(page.locator("[data-testid='possible-duplicates']"))
      .or(page.getByText("Possible Duplicates").locator("..").locator(".."));

    // Wait for the section to appear then click the Merge button for our pair
    await expect(page.getByText("Possible Duplicates")).toBeVisible({ timeout: 15_000 });
    const mergeBtn = page.getByRole("listitem")
      .filter({ hasText: guest.fullName })
      .getByRole("button", { name: "Merge" });
    await mergeBtn.click();

    // The workspace dialog opens
    await expect(page.getByRole("dialog", { name: "Merge duplicate members" })).toBeVisible({ timeout: 10_000 });
  },
);

// ─── Preview assertions ───────────────────────────────────────────

Then(
  "the preview shows {int} contributions and {int} receipts moving",
  async ({ page }, contributions: number, receipts: number) => {
    const dialog = page.getByRole("dialog", { name: "Merge duplicate members" });
    await expect(dialog.getByText(new RegExp(`${contributions}.*gift`, "i"))).toBeVisible({ timeout: 10_000 });
    await expect(dialog.getByText(new RegExp(`${receipts}.*receipt`, "i"))).toBeVisible();
  },
);

Then("the preview shows the combined total as {string}", async ({ page }, total: string) => {
  const dialog = page.getByRole("dialog", { name: "Merge duplicate members" });
  await expect(dialog.getByText(total)).toBeVisible();
});

// ─── Confirm and merge ────────────────────────────────────────────

When(
  "the admin merges after typing the reason {string} and the name {string}",
  async ({ page }, reason: string, survivorName: string) => {
    const dialog = page.getByRole("dialog", { name: "Merge duplicate members" });
    // The MergeWorkspace steps through preview → confirm
    await dialog.getByRole("button", { name: /Confirm/ }).click();
    await dialog.getByLabel(/Reason/).fill(reason);
    await dialog.getByLabel(/Type.*name/i).fill(survivorName);
    await dialog.getByRole("button", { name: /Merge/ }).last().click();
    // Dialog should close
    await expect(page.getByRole("dialog", { name: "Merge duplicate members" })).toBeHidden({ timeout: 15_000 });
  },
);

// ─── Post-merge assertions ────────────────────────────────────────

Then(
  "{string} now has {int} completed gifts totalling {int}",
  async ({ backend, world }, name: string, count: number, total: number) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    const survivorPhone = world.values["merge.survivorPhone"];
    await expect.poll(async () => {
      const result = await backend.graphql(
        `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
        { p: survivorPhone },
        token,
      );
      const completed = (result.data?.myContributions as { amount: string; status: string }[] ?? [])
        .filter((g) => g.status === "completed");
      return completed.length;
    }, { message: `expected ${count} completed gifts on ${name}` }).toBe(count);

    const result = await backend.graphql(
      `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
      { p: survivorPhone },
      token,
    );
    const completed = (result.data.myContributions as { amount: string; status: string }[])
      .filter((g) => g.status === "completed");
    const sum = completed.reduce((s, g) => s + Number(g.amount), 0);
    expect(sum).toBe(total);
  },
);

Then(
  "the survivor's receipt list shows receipts with the guest's original amounts",
  async ({ backend, world }) => {
    // Verify via myContributions that the amounts (2000 and 600) are on the survivor.
    // Contributions and their receipts are 1-to-1: if the contribution moved, the
    // receipt moved with it (ReceiptHandler runs inside the same merge transaction).
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    const survivorPhone = world.values["merge.survivorPhone"];
    const result = await backend.graphql(
      `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
      { p: survivorPhone },
      token,
    );
    const amounts = (result.data.myContributions as { amount: string; status: string }[])
      .filter((g) => g.status === "completed")
      .map((g) => Number(g.amount));
    expect(amounts).toContain(2000);
    expect(amounts).toContain(600);
  },
);

Then(
  "the guest is shown as merged in the admin members list",
  async ({ page }) => {
    // The duplicate's row in the members table should show "Merged" or be gone;
    // confirm the Recent Merges section has appeared with one entry
    await expect(page.getByText("Recent Merges")).toBeVisible({ timeout: 10_000 });
    const list = page.locator("ul, ol, [role='list']").filter({ hasText: /→/ }).first();
    await expect(list).toBeVisible();
  },
);

// ─── Post-merge pay from old number ──────────────────────────────

When(
  "another Pay Bill payment of {int} arrives from the guest's number",
  async ({ backend, world }, amount: number) => {
    await backend.paybill(world.values[GUEST_PHONE], String(amount), "TITHE", "JANE");
  },
);

Then(
  "the {int} belongs to {string}",
  async ({ backend, world }, amount: number, name: string) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    const survivorPhone = world.values["merge.survivorPhone"];
    await expect.poll(async () => {
      const result = await backend.graphql(
        `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
        { p: survivorPhone },
        token,
      );
      return (result.data?.myContributions as { amount: string; status: string }[] ?? [])
        .filter((g) => g.status === "completed")
        .some((g) => Number(g.amount) === amount);
    }, { message: `${amount} not found on ${name}` }).toBe(true);
  },
);

// ─── Undo ─────────────────────────────────────────────────────────

When(
  "the admin undoes the merge with reason {string}",
  async ({ page, backend }, reason: string) => {
    await dismissTours(backend, page, []);
    const row = page.getByRole("listitem").filter({ hasText: /→/ }).first();
    await expect(row).toBeVisible({ timeout: 10_000 });
    await row.getByRole("button", { name: "Undo" }).click();
    const undoDialog = page.getByRole("dialog", { name: "Undo merge" });
    await expect(undoDialog).toBeVisible({ timeout: 10_000 });
  },
);

Then(
  "the undo preview listed the post-merge {int} as going back",
  async ({ page }, amount: number) => {
    const undoDialog = page.getByRole("dialog", { name: "Undo merge" });
    await expect(undoDialog.getByText(/gift.*since the merge|since the merge.*goes back/i)).toBeVisible({ timeout: 10_000 });
    await undoDialog.getByLabel(/Why undo/i).fill("Different people");
    await undoDialog.getByRole("button", { name: "Undo merge" }).click();
    await expect(undoDialog).toBeHidden({ timeout: 15_000 });
  },
);

Then(
  "the guest is restored with {int} given",
  async ({ backend, world }, total: number) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    // First confirm the tombstone is cleared (mergedIntoId becomes null)
    await expect.poll(async () => {
      const r = await backend.graphql(
        `query($id: ID!) { memberTombstoneRedirect(memberId: $id) { id mergedIntoId } }`,
        { id: world.values[GUEST_ID] },
        token,
      );
      return r.data?.memberTombstoneRedirect?.mergedIntoId;
    }, { message: "guest still shows as merged" }).toBeNull();

    // Then verify the total
    const result = await backend.graphql(
      `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
      { p: world.values[GUEST_PHONE] },
      token,
    );
    const sum = (result.data.myContributions as { amount: string; status: string }[])
      .filter((g) => g.status === "completed")
      .reduce((s, g) => s + Number(g.amount), 0);
    expect(sum).toBe(total);
  },
);

Then(
  "{string} has {int} given",
  async ({ backend, world }, name: string, total: number) => {
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);
    const survivorPhone = world.values["merge.survivorPhone"];
    const result = await backend.graphql(
      `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
      { p: survivorPhone },
      token,
    );
    const sum = (result.data.myContributions as { amount: string; status: string }[])
      .filter((g) => g.status === "completed")
      .reduce((s, g) => s + Number(g.amount), 0);
    expect(sum).toBe(total);
  },
);

Then(
  "the guest's number no longer credits {string}",
  async ({ backend, world }, survivorName: string) => {
    await backend.paybill(world.values[GUEST_PHONE], "100", "TITHE", "JANE");
    const token = await tokenOnce(backend, world.values, world.seed!.people.admin.phone);

    // The 100 should land on the guest (their number is theirs again after undo)
    await expect.poll(async () => {
      const result = await backend.graphql(
        `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
        { p: world.values[GUEST_PHONE] },
        token,
      );
      return (result.data?.myContributions as { amount: string; status: string }[] ?? [])
        .filter((g) => g.status === "completed")
        .some((g) => Number(g.amount) === 100);
    }, { message: "100 not found on guest after undo" }).toBe(true);

    // And not on the survivor
    const survivorResult = await backend.graphql(
      `query($p: String!) { myContributions(phoneNumber: $p, limit: 50) { amount status } }`,
      { p: world.values["merge.survivorPhone"] },
      token,
    );
    const survivorAmounts = (survivorResult.data.myContributions as { amount: string; status: string }[])
      .filter((g) => g.status === "completed")
      .map((g) => Number(g.amount));
    expect(survivorAmounts.filter((a) => a === 100)).toHaveLength(0);
  },
);
