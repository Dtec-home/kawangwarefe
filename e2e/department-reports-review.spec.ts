/**
 * Department reports — staff experience (DR-8), mocked GraphQL.
 *
 * US-1  the admin opens a reporting period; other staff see it read-only.
 * US-8  the pastor follows every department on the tracker and filters it.
 * US-9  the pastor sends a report back with section comments, or approves it.
 * US-11 the report downloads as PDF and Word.
 * US-12 the AGM book downloads once a report is approved.
 * US-13 the admin reopens an approved report with a reason.
 * US-15 the treasurer sees the books today next to the submitted figures.
 *
 * Locators follow DEPARTMENT_REPORTS/02_CONTRACTS.md § UI test contract.
 * The report page itself is DR-7's; until it exists those tests skip.
 */

import { test, expect, type Page } from "@playwright/test";
import { approveUshers, fakeDepartmentReports } from "./helpers/department-reports-staff";

// The dev server compiles each route on first hit; give cold starts room.
test.describe.configure({ timeout: 90_000 });

const trackerRow = (page: Page, department: string) =>
  page.getByTestId("dept-report-tracker-row").filter({ hasText: department });

/** Open the report page; skip when DR-7's route is not there yet. */
async function openReport(page: Page, id: string) {
  const response = await page.goto(`/admin/department-reports/${id}`);
  test.skip(response?.status() === 404, "The report page (DR-7) is not built yet");
  await expect(page.getByRole("button", { name: "Download PDF" })).toBeVisible({ timeout: 20_000 });
}

test.describe("Reporting periods (US-1)", () => {
  test("the admin opens the first period", async ({ page }) => {
    const state = await fakeDepartmentReports(page, { persona: "admin", noPeriods: true });
    await page.goto("/admin/department-reports/periods");
    await expect(page.getByText("No reporting periods yet")).toBeVisible({ timeout: 20_000 });

    await page.getByRole("button", { name: "Open period" }).click();
    const dialog = page.getByRole("dialog", { name: "Open reporting period" });
    await dialog.getByLabel("Label").fill("2026-2027");
    await dialog.getByLabel("Start date").fill("2026-07-01");
    await dialog.getByLabel("End date").fill("2027-06-30");
    // A due date before the end is refused before anything is sent.
    await dialog.getByLabel("Due date").fill("2027-06-01");
    await dialog.getByRole("button", { name: "Open period" }).click();
    await expect(dialog.getByText("Reports can't be due before the period ends")).toBeVisible();
    expect(state.calls.some((c) => c.op === "OpenReportingPeriod")).toBe(false);

    await dialog.getByLabel("Due date").fill("2027-07-31");
    await dialog.getByRole("button", { name: "Open period" }).click();
    await expect(dialog).toBeHidden();
    const row = page.getByTestId("dept-report-period-row").filter({ hasText: "2026-2027" });
    await expect(row).toContainText("Open");
    await expect(row).toContainText("Due 31 Jul 2027");
    expect(state.calls.find((c) => c.op === "OpenReportingPeriod")?.variables).toEqual({
      input: { label: "2026-2027", startDate: "2026-07-01", endDate: "2027-06-30", dueDate: "2027-07-31" },
    });
  });

  test("a second open period is refused in plain words", async ({ page }) => {
    await fakeDepartmentReports(page, { persona: "admin" });
    await page.goto("/admin/department-reports/periods");
    await page.getByRole("button", { name: "Open period" }).click();
    const dialog = page.getByRole("dialog", { name: "Open reporting period" });
    await dialog.getByLabel("Label").fill("2026-2027");
    await dialog.getByLabel("Start date").fill("2026-07-01");
    await dialog.getByLabel("End date").fill("2027-06-30");
    await dialog.getByLabel("Due date").fill("2027-07-31");
    await dialog.getByRole("button", { name: "Open period" }).click();
    await expect(dialog.getByRole("alert")).toHaveText(/Another reporting period is still open/);
  });

  test("the admin closes a period after confirming", async ({ page }) => {
    await fakeDepartmentReports(page, { persona: "admin" });
    await page.goto("/admin/department-reports/periods");
    await page.getByRole("button", { name: "Close period 2025-2026" }).click();
    await page.getByRole("alertdialog").getByRole("button", { name: "Close period" }).click();
    await expect(page.getByTestId("dept-report-period-row").filter({ hasText: "2025-2026" })).toContainText("Closed");
  });

  test("a pastor sees the periods read-only and reaches the tracker", async ({ page }) => {
    await fakeDepartmentReports(page, { persona: "pastor" });
    await page.goto("/admin/department-reports/periods");
    await expect(page.getByTestId("dept-report-period-row")).toHaveCount(1, { timeout: 20_000 });
    await expect(page.getByRole("button", { name: "Open period" })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /Close period/ })).toHaveCount(0);
    await page.getByRole("link", { name: "Tracker for 2025-2026" }).click();
    await expect(page).toHaveURL(/\/admin\/department-reports\/period\/1$/, { timeout: 30_000 });
  });
});

test.describe("Tracker (US-8, US-12)", () => {
  test("shows every department, filters by status and warns about missing leaders", async ({ page }) => {
    await fakeDepartmentReports(page, { persona: "pastor" });
    await page.goto("/admin/department-reports/period/1");
    await expect(page.getByRole("heading", { level: 1, name: "Department reports 2025-2026" })).toBeVisible({
      timeout: 20_000,
    });
    await expect(trackerRow(page, "Building Fund").getByTestId("dept-report-status")).toHaveText("Submitted");
    await expect(trackerRow(page, "Welfare").getByTestId("dept-report-status")).toHaveText("Not started");
    await expect(trackerRow(page, "Choir").getByTestId("dept-report-overdue")).toBeVisible();
    await expect(trackerRow(page, "Welfare")).toContainText("No leader assigned");
    // Leaderless departments without a report sit apart, collapsed, out of the counts.
    await expect(page.getByTestId("dept-report-unassigned")).toContainText("1 department has no leader");

    const main = page.getByRole("list", { name: "Departments" });
    await page.getByRole("group", { name: "Filter by status" }).getByRole("button", { name: /Overdue/ }).click();
    await expect(main.getByTestId("dept-report-tracker-row")).toHaveCount(1);
    await page.getByRole("group", { name: "Filter by status" }).getByRole("button", { name: /Submitted/ }).click();
    await expect(main.getByTestId("dept-report-tracker-row")).toHaveCount(1);
    await expect(trackerRow(page, "Building Fund").getByRole("link", { name: "Open" })).toHaveAttribute(
      "href",
      "/admin/department-reports/5",
    );
  });

  test("the AGM book waits for an approved report", async ({ page }) => {
    await fakeDepartmentReports(page, { persona: "pastor" });
    await page.goto("/admin/department-reports/period/1");
    const book = page.getByRole("button", { name: "Download AGM book" });
    await expect(book).toBeDisabled({ timeout: 20_000 });
    await expect(page.getByText("The AGM book holds approved reports only")).toBeVisible();
  });

  test("the AGM book downloads with the server's filename", async ({ page }) => {
    const state = await fakeDepartmentReports(page, { persona: "pastor" });
    approveUshers(state);
    await page.goto("/admin/department-reports/period/1");
    const book = page.getByRole("button", { name: "Download AGM book" });
    await expect(book).toBeEnabled({ timeout: 20_000 });
    const [download] = await Promise.all([page.waitForEvent("download"), book.click()]);
    expect(download.suggestedFilename()).toBe("Department-Reports-2025-2026.pdf");
  });

  test("fits a phone without horizontal scroll", async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await fakeDepartmentReports(page, { persona: "pastor" });
    await page.goto("/admin/department-reports/period/1");
    await expect(page.getByTestId("dept-report-tracker-row").first()).toBeVisible({ timeout: 20_000 });
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    expect(overflow).toBeLessThanOrEqual(1);
  });
});

test.describe("Review on the report page (US-9, US-11, US-13, US-15)", () => {
  test("the pastor sends a report back with comments on two sections", async ({ page }) => {
    const state = await fakeDepartmentReports(page, { persona: "pastor" });
    await openReport(page, "5");
    await page.getByRole("button", { name: "Send back" }).click();
    const dialog = page.getByRole("dialog", { name: "Send back to the leader" });
    await expect(dialog.getByRole("button", { name: "Send back" })).toBeDisabled();
    await dialog.getByLabel("Section").selectOption({ label: "Achievements" });
    await dialog.getByLabel("What needs to change?").fill("Please add the roof cost");
    await dialog.getByRole("button", { name: "Add another comment" }).click();
    const second = dialog.getByRole("group", { name: "Comment 2" });
    await second.getByLabel("Section").selectOption({ label: "Financial Statement" });
    await second.getByLabel("What needs to change?").fill("Explain the March expense");
    await dialog.getByRole("button", { name: "Send back" }).click();
    await expect(dialog).toBeHidden();
    expect(state.calls.find((c) => c.op === "ReturnDepartmentReport")?.variables).toEqual({
      id: "5",
      comments: [
        { sectionKey: "achievements", body: "Please add the roof cost" },
        { sectionKey: "financial", body: "Explain the March expense" },
      ],
    });
  });

  test("the pastor approves, then downloads PDF and Word", async ({ page }) => {
    const state = await fakeDepartmentReports(page, { persona: "pastor" });
    await openReport(page, "5");
    await page.getByRole("button", { name: "Approve" }).click();
    await page.getByRole("dialog", { name: "Approve report?" }).getByRole("button", { name: "Approve" }).click();
    await expect(page.getByRole("dialog", { name: "Approve report?" })).toBeHidden();
    expect(state.reports.find((r) => r.id === "5")?.status).toBe("approved");

    for (const [label, ext] of [["Download PDF", "pdf"], ["Download Word", "docx"]] as const) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: label }).click(),
      ]);
      expect(download.suggestedFilename()).toBe(`Building-Fund-Department-Report-2025-2026.${ext}`);
    }
  });

  test("the admin reopens an approved report with a reason", async ({ page }) => {
    const state = await fakeDepartmentReports(page, { persona: "admin" });
    state.reports[0].status = "approved";
    await openReport(page, "5");
    await page.getByRole("button", { name: "Reopen" }).click();
    const dialog = page.getByRole("dialog", { name: "Reopen report?" });
    await dialog.getByRole("button", { name: "Reopen" }).click();
    await expect(dialog.getByRole("alert")).toHaveText("Give a reason for reopening the report.");
    await dialog.getByLabel("Reason for reopening").fill("The roof invoice was missed");
    await dialog.getByRole("button", { name: "Reopen" }).click();
    await expect(dialog).toBeHidden();
    expect(state.calls.find((c) => c.op === "ReopenDepartmentReport")?.variables).toEqual({
      id: "5",
      reason: "The roof invoice was missed",
    });
  });

  test("the treasurer sees a late entry against the submitted figures", async ({ page }) => {
    await fakeDepartmentReports(page, { persona: "treasurer", lateGift: true });
    await openReport(page, "5");
    await expect(page.getByRole("button", { name: "Approve" })).toHaveCount(0);
    const panel = page.getByTestId("dept-report-live-financial");
    await expect(panel).toContainText("A late entry changed the figures after submission");
    await expect(panel.getByTestId("live-financial-moneyIn")).toHaveAttribute("data-changed", "true");
    await panel.getByRole("button", { name: /Books today vs submitted/ }).click();
    await expect(panel.getByTestId("live-financial-moneyIn")).toBeHidden();
  });
});
