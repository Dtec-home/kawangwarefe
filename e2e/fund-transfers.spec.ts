/**
 * Fund transfers (FT-2) and "Move gift…" (RA-2), mocked GraphQL.
 *
 * US-16 a treasurer requests a transfer; the available balance is shown live
 *       and an amount above it is refused before sending.
 * US-17 another treasurer/admin approves or rejects (with a note); the
 *       requester can only cancel their own request.
 * US-19 a treasurer moves a gift put in the wrong department, with a preview.
 * Desktop and 390 px.
 */

import { test, expect, type Page } from "@playwright/test";
import { fakeFundTransfers, signInAs } from "./helpers/fund-transfers";

// The dev server compiles each route on first hit; give cold starts room.
test.describe.configure({ timeout: 90_000 });

const row = (page: Page, text: string | RegExp) => page.getByTestId("fund-transfer-row").filter({ hasText: text });

async function openTransfers(page: Page) {
  await page.goto("/admin/transfers");
  await expect(page.getByRole("heading", { name: "Fund transfers" })).toBeVisible({ timeout: 30_000 });
  // No sideways scrolling, on a phone too.
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
}

for (const viewport of [
  { name: "desktop", size: { width: 1280, height: 900 } },
  { name: "390px", size: { width: 390, height: 844 } },
]) {
  test.describe(`Fund transfers (${viewport.name})`, () => {
    test.use({ viewport: viewport.size });

    test("a treasurer requests, a second approver approves (US-16, US-17)", async ({ page }) => {
      const state = await fakeFundTransfers(page, { persona: "treasurer" });
      await openTransfers(page);
      await expect(page.getByText("No transfers")).toBeVisible();

      await page.getByRole("button", { name: "New transfer" }).click();
      const dialog = page.getByRole("dialog", { name: "Move money between funds" });
      await dialog.getByLabel("From department").selectOption({ label: "Youth" });
      await expect(dialog.getByTestId("ft-available")).toHaveText(/Available: KES 8,000\.00/);
      await dialog.getByLabel("To department").selectOption({ label: "Building Fund" });
      await dialog.getByLabel("To purpose").selectOption({ label: "Roof" });

      // More than the source holds: refused before anything is sent.
      await dialog.getByLabel("Amount").fill("9000");
      await dialog.getByLabel("Reason").fill("Youth surplus to the roof");
      await dialog.getByRole("button", { name: "Request transfer" }).click();
      await expect(dialog.getByRole("alert")).toHaveText("The source only holds KES 8,000.00 on that date.");
      expect(state.calls.some((c) => c.op === "RequestFundTransfer")).toBe(false);

      await dialog.getByLabel("Amount").fill("5000");
      await dialog.getByRole("button", { name: "Request transfer" }).click();
      await expect(dialog).toBeHidden();
      const requested = row(page, "Youth surplus to the roof");
      await expect(requested).toContainText("Building Fund / Roof");
      await expect(requested).toContainText("KES 5,000.00");
      await expect(requested).toContainText("Requested");
      await expect(requested).toContainText("Requested by Grace Treasurer");
      // Four eyes: my own request can only be cancelled.
      await expect(requested.getByRole("button", { name: "Approve" })).toHaveCount(0);
      await expect(requested.getByRole("button", { name: "Cancel" })).toBeVisible();
      expect(state.calls.find((c) => c.op === "RequestFundTransfer")?.variables).toMatchObject({
        input: { fromDepartmentId: "1", fromPurposeId: null, toDepartmentId: "2", toPurposeId: "8", amount: "5000" },
      });

      // The admin signs in and approves it.
      signInAs(state, "admin");
      await page.reload();
      await expect(row(page, "Youth surplus to the roof").getByRole("button", { name: "Approve" })).toBeVisible({ timeout: 30_000 });
      await row(page, "Youth surplus to the roof").getByRole("button", { name: "Approve" }).click();
      await expect(row(page, "Youth surplus to the roof")).toContainText("Approved by Peter Admin");
      await expect(row(page, "Youth surplus to the roof").getByRole("button")).toHaveCount(0);

      // The money has moved: Youth now holds 3,000.
      await page.getByRole("button", { name: "New transfer" }).click();
      await page.getByRole("dialog").getByLabel("From department").selectOption({ label: "Youth" });
      await expect(page.getByRole("dialog").getByTestId("ft-available")).toHaveText(/KES 3,000\.00/);
    });

    test("rejecting needs a note; filters narrow the list (US-17)", async ({ page }) => {
      const state = await fakeFundTransfers(page, { persona: "admin", requestedBy: "treasurer" });
      await openTransfers(page);
      const pending = row(page, "Youth surplus to the roof");
      await pending.getByRole("button", { name: "Reject" }).click();
      const dialog = page.getByRole("dialog", { name: "Reject transfer?" });
      await dialog.getByRole("button", { name: "Reject transfer" }).click();
      await expect(dialog.getByRole("alert")).toHaveText("Say why the transfer is rejected.");
      expect(state.calls.some((c) => c.op === "RejectFundTransfer")).toBe(false);
      await dialog.getByLabel("Note").fill("Not this year");
      await dialog.getByRole("button", { name: "Reject transfer" }).click();
      await expect(dialog).toBeHidden();
      await expect(pending).toContainText("Rejected by Peter Admin");
      await expect(pending).toContainText("Not this year");

      await page.getByRole("button", { name: "Approved", exact: true }).click();
      await expect(page.getByText("No transfers match these filters.")).toBeVisible();
      await page.getByRole("button", { name: "Rejected", exact: true }).click();
      await expect(page.getByTestId("fund-transfer-row")).toHaveCount(1);
      await page.getByLabel("Department").selectOption({ label: "Tithe" });
      await expect(page.getByTestId("fund-transfer-row")).toHaveCount(0);
    });

    test("the requester cancels their own request (US-17)", async ({ page }) => {
      await fakeFundTransfers(page, { persona: "treasurer", requestedBy: "treasurer" });
      await openTransfers(page);
      const mine = row(page, "Youth surplus to the roof");
      await mine.getByRole("button", { name: "Cancel" }).click();
      await expect(mine).toContainText("Cancelled by the requester");
      await expect(mine.getByRole("button")).toHaveCount(0);
    });

    test("a department leader may only move money out of their own department", async ({ page }) => {
      await fakeFundTransfers(page, { persona: "leader" });
      await openTransfers(page);
      await page.getByRole("button", { name: "New transfer" }).click();
      const from = page.getByRole("dialog").getByLabel("From department");
      await expect(from.locator("option")).toHaveText(["Choose a department", "Youth"]);
    });

    test("a treasurer moves a gift from the contributions list (US-19)", async ({ page }) => {
      const state = await fakeFundTransfers(page, { persona: "treasurer" });
      await page.goto("/admin/contributions");
      const move = page.getByRole("button", { name: "Move gift…" }).locator("visible=true");
      await expect(move).toHaveCount(1, { timeout: 30_000 });
      await move.click();

      const dialog = page.getByRole("dialog", { name: "Move gift" });
      await expect(dialog.getByLabel("Department (line 1)")).toHaveValue("3");
      await dialog.getByLabel("Department (line 1)").selectOption({ label: "Building Fund" });
      await dialog.getByLabel("Purpose (line 1)").selectOption({ label: "Roof" });
      await dialog.getByLabel("Amount (line 1)").fill("600");
      await expect(dialog.getByTestId("move-gift-total")).toContainText("short by KES 400.00");
      await dialog.getByRole("button", { name: "Add line" }).click();
      await dialog.getByLabel("Department (line 2)").selectOption({ label: "Youth" });
      await expect(dialog.getByTestId("move-gift-total")).toHaveText("KES 1,000.00 of KES 1,000.00");
      await expect(dialog.getByRole("button", { name: "Move gift" })).toBeDisabled();

      await dialog.getByRole("button", { name: "Preview" }).click();
      const preview = dialog.getByTestId("move-gift-preview");
      await expect(preview).toContainText("Tithe");
      await expect(preview).toContainText("Building Fund / Roof");
      await dialog.getByRole("button", { name: "Move gift" }).click();
      await expect(dialog.getByRole("alert")).toHaveText("Say why the gift is being moved.");
      await dialog.getByLabel("Reason").fill("Giver meant Building");
      await dialog.getByRole("button", { name: "Move gift" }).click();
      await expect(dialog).toBeHidden();
      await expect(page.getByText("Gift moved")).toBeVisible();
      expect(state.reallocationReasons).toEqual(["Giver meant Building"]);
      expect(state.calls.find((c) => c.op === "ReallocatePayment")?.variables).toMatchObject({
        targets: [
          { departmentId: "2", purposeId: "8", amount: "600.00" },
          { departmentId: "1", purposeId: null, amount: "400.00" },
        ],
      });
    });

    test("staff who are not treasurer or admin get no Move gift action", async ({ page }) => {
      await fakeFundTransfers(page, { persona: "pastor" });
      await page.goto("/admin/contributions");
      await expect(page.getByText("John Kamau").locator("visible=true").first()).toBeVisible({ timeout: 30_000 });
      await expect(page.getByRole("button", { name: "Move gift…" })).toHaveCount(0);
    });
  });
}
