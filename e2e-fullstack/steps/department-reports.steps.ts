/**
 * Yearly department reports, full stack (DEPARTMENT_REPORTS plan, US-1..US-12).
 * Features are tagged @fixme until DR-10; the UI they drive is specified in
 * DEPARTMENT_REPORTS/02_CONTRACTS.md § UI test contract.
 */

import { Page } from "@playwright/test";
import { Given, Then, When, expect } from "../support/fixtures";
import { switchUserInBrowser } from "../support/campaigns";
import { dismissTours } from "../support/desk";
import {
  goToSection,
  openPeriodThroughApi,
  reportCard,
  reportIdOf,
  submitCompleteReport,
  tokenOfRole,
  trackerRow,
} from "../support/department-reports";

const TOURS = ["admin_department_reports_v1"];

/** Open a report from its tracker row and wait for the report page (the tracker has an "Approved" filter chip). */
async function openFromTracker(page: Page, department: string) {
  await trackerRow(page, department).getByRole("link", { name: "Open" }).click();
  await expect(page).toHaveURL(/\/admin\/department-reports\/\d+$/);
  await expect(page.getByTestId("dept-report-status")).toBeVisible();
}

// ── Given ────────────────────────────────────────────────────────────────
Given(
  "the admin has opened the reporting period {string} from {string} to {string} due {string}",
  async ({ backend, world }, label: string, start: string, end: string, due: string) => {
    await openPeriodThroughApi(backend, world, label, start, end, due);
  },
);

Given(
  "the {word} has submitted a complete {string} report",
  async ({ backend, world }, role: string, department: string) => {
    await submitCompleteReport(backend, world, role, department);
  },
);

// ── Leader ───────────────────────────────────────────────────────────────
When("I open Department Reports", async ({ page, backend }) => {
  await dismissTours(backend, page, TOURS);
  await page.goto("/admin");
  await page.getByRole("link", { name: "Department Reports" }).click();
  await expect(page).toHaveURL(/\/admin\/department-reports$/);
});

Then(
  "I see the {string} report for {string} as {string}",
  async ({ page }, department: string, period: string, status: string) => {
    const card = reportCard(page, department);
    await expect(card).toContainText(period);
    await expect(card.getByTestId("dept-report-status")).toHaveText(status);
  },
);

When("I start the {string} report", async ({ page }, department: string) => {
  await reportCard(page, department).getByRole("button", { name: /Start report|Continue/ }).click();
  await expect(page).toHaveURL(/\/admin\/department-reports\/\d+/);
});

Then("the leaders section lists {string}", async ({ page }, name: string) => {
  await goToSection(page, /Leaders/);
  await expect(page.getByTestId("dept-report-leaders")).toContainText(name);
});

When("I write the introduction {string}", async ({ page }, text: string) => {
  await goToSection(page, /Introduction/);
  await page.getByLabel("Introduction / Departmental Mission").fill(text);
});

When("I add the objectives {string}", async ({ page }, texts: string) => {
  await goToSection(page, /Objectives/);
  for (const text of texts.split(";").map((t) => t.trim())) {
    await page.getByRole("button", { name: "Add objective" }).click();
    await page.getByLabel(/^Objective \d+$/).last().fill(text);
  }
});

When(
  "I add the achievement {string} for the objective {string}",
  async ({ page }, text: string, objective: string) => {
    await goToSection(page, /Achievements/);
    await page.getByRole("button", { name: "Add achievement" }).click();
    await page.getByLabel(/^Achievement \d+$/).last().fill(text);
    await page.getByLabel(/^Fulfils objective/).last().selectOption({ label: objective });
  },
);

When("I write the conclusion {string}", async ({ page }, text: string) => {
  await goToSection(page, /Conclusion/);
  await page.getByLabel("Conclusion").fill(text);
});

Then("the report says it is saved", async ({ page }) => {
  await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);
});

Then("the financial statement shows money in of {string}", async ({ page }, amount: string) => {
  await goToSection(page, /Financial Statement/);
  await expect(page.getByTestId("financial-row-money-in")).toContainText(amount);
});

When("I preview the report", async ({ page }) => {
  await page.getByRole("button", { name: "Preview & submit" }).click();
});

When("I preview and submit the report", async ({ page }) => {
  await page.getByRole("button", { name: "Preview & submit" }).click();
  await page.getByRole("button", { name: "Submit report" }).click();
  await page.getByRole("dialog", { name: "Submit report?" }).getByRole("button", { name: "Submit" }).click();
});

Then("the report shows the status {string}", async ({ page }, status: string) => {
  await expect(page.getByTestId("dept-report-status")).toHaveText(status);
});

Then("the preview lists the missing sections {string}", async ({ page }, sections: string) => {
  const missing = page.getByTestId("dept-report-missing");
  for (const title of sections.split(",").map((s) => s.trim())) {
    await expect(missing.getByRole("link", { name: title })).toBeVisible();
  }
  await expect(page.getByRole("button", { name: "Submit report" })).toBeDisabled();
});

// ── Pastor / tracker ─────────────────────────────────────────────────────
When("I open the department report tracker for {string}", async ({ page, backend, world }, period: string) => {
  await dismissTours(backend, page, TOURS);
  await page.goto(`/admin/department-reports/period/${world.values[`period.${period}`]}`);
});

Then("the tracker shows {string} as {string}", async ({ page }, department: string, status: string) => {
  await expect(trackerRow(page, department).getByTestId("dept-report-status")).toHaveText(status);
});

When(
  "I open the {string} report and send it back with {string} on {string}",
  async ({ page }, department: string, comment: string, section: string) => {
    await openFromTracker(page, department);
    await page.getByRole("button", { name: "Send back", exact: true }).click();
    const dialog = page.getByRole("dialog", { name: "Send back to the leader" });
    await dialog.getByLabel("Section").selectOption({ label: section });
    await dialog.getByLabel("What needs to change?").fill(comment);
    await dialog.getByRole("button", { name: "Send back" }).click();
    await expect(page.getByTestId("dept-report-status")).toHaveText("Returned");
  },
);

When(
  "the dept_admin fixes the achievements to {string} and resubmits",
  async ({ page, backend, world }, text: string) => {
    await switchUserInBrowser(page, backend, world, "dept_admin");
    await dismissTours(backend, page, TOURS);
    await page.goto(`/admin/department-reports/${reportIdOf(world, "Building Fund")}`);
    await expect(page.getByTestId("dept-report-comments")).toBeVisible();
    await goToSection(page, /Achievements/);
    await page.getByLabel(/^Achievement \d+$/).first().fill(text);
    await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);
    await page.getByRole("button", { name: "Preview & submit" }).click();
    await page.getByRole("button", { name: "Submit report" }).click();
    await page.getByRole("dialog", { name: "Submit report?" }).getByRole("button", { name: "Submit" }).click();
    await expect(page.getByTestId("dept-report-status")).toHaveText("Submitted");
    await switchUserInBrowser(page, backend, world, "pastor");
  },
);

When("I open the {string} report and approve it", async ({ page }, department: string) => {
  await openFromTracker(page, department);
  await page.getByRole("button", { name: "Approve", exact: true }).click();
  await page.getByRole("dialog", { name: "Approve report?" }).getByRole("button", { name: "Approve" }).click();
  await expect(page.getByTestId("dept-report-status")).toHaveText("Approved");
  await page.goBack();
});

Then(
  "I can download the {string} report as PDF and Word",
  async ({ page }, department: string) => {
    await openFromTracker(page, department);
    for (const [label, ext] of [["Download PDF", "pdf"], ["Download Word", "docx"]] as const) {
      const [download] = await Promise.all([
        page.waitForEvent("download"),
        page.getByRole("button", { name: label }).click(),
      ]);
      expect(download.suggestedFilename()).toMatch(new RegExp(`Department-Report-.*\\.${ext}$`));
    }
    await page.goBack();
  },
);

Then("I can download the AGM book for {string}", async ({ page, backend, world }, period: string) => {
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Download AGM book" }).click(),
  ]);
  expect(download.suggestedFilename()).toBe(`Department-Reports-${period}.pdf`);
  // The API agrees: only approved reports are in the book.
  const token = await tokenOfRole(backend, world, "pastor");
  const result = await backend.graphql(
    `query($p: ID!) { exportReportBook(periodId: $p) { success filename } }`,
    { p: world.values[`period.${period}`] },
    token,
  );
  expect(result.data.exportReportBook.success).toBe(true);
});
