/**
 * Department reports, the leader's journey (DR-7, US-2…US-7 and US-10),
 * mocked: GraphQL goes to a stateful fake (helpers/department-reports-leader),
 * so only the Next dev server is needed. Locators follow the UI test contract
 * in DEPARTMENT_REPORTS/02_CONTRACTS.md, at desktop and at 390 px.
 *
 * The repo has no @axe-core/playwright, so the accessibility check here is a
 * focused one: every form control has an accessible name, the current step is
 * marked with aria-current, and nothing scrolls sideways at phone width.
 */

import { expect, test, type Page } from "@playwright/test";

import { injectSession } from "./helpers/auth";
import { installLeaderApi } from "./helpers/department-reports-leader";

const goToSection = (page: Page, title: string | RegExp) =>
  page.getByTestId("dept-report-stepper").getByRole("button", { name: title }).click();

async function unnamedControls(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const out: string[] = [];
    for (const el of Array.from(document.querySelectorAll("main input, main textarea, main select, main button"))) {
      const h = el as HTMLElement;
      if (h.offsetParent === null) continue; // hidden
      const labelled =
        h.getAttribute("aria-label") ||
        h.getAttribute("aria-labelledby") ||
        ((h as HTMLInputElement).labels?.length ?? 0) > 0 ||
        (h.tagName === "BUTTON" && (h.textContent ?? "").trim());
      if (!labelled) out.push(h.outerHTML.slice(0, 120));
    }
    return out;
  });
}

const noSidewaysScroll = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1);

test.describe("Department reports — leader (desktop)", () => {
  test.use({ viewport: { width: 1280, height: 900 } });

  test("writes, previews and submits the report (US-2…US-7)", async ({ page }) => {
    await injectSession(page);
    const api = await installLeaderApi(page, { carryForward: [{ id: "91", text: "Hold a youth camp" }] });

    // US-2: my reports
    await page.goto("/admin/department-reports", { waitUntil: "networkidle" });
    await expect(page.getByRole("link", { name: "Department Reports" }).first()).toBeVisible();
    const card = page.getByTestId("dept-report-card").filter({ hasText: "Building Fund" });
    await expect(card).toContainText("2026-2027");
    await expect(card.getByTestId("dept-report-status")).toHaveText("Not started");
    await expect(card).toContainText("Due in 12 days");

    // US-3: start → editor with the leaders prefilled
    await card.getByRole("button", { name: "Start report" }).click();
    await expect(page).toHaveURL(/\/admin\/department-reports\/5$/, { timeout: 60_000 });
    await expect(page.getByRole("heading", { level: 1, name: "Building Fund report" })).toBeVisible();
    await goToSection(page, "Leaders");
    await expect(page.getByTestId("dept-report-leaders")).toContainText("Dan Builder");

    // US-7: an incomplete report can't be submitted
    await page.getByRole("button", { name: "Preview & submit" }).click();
    const missing = page.getByTestId("dept-report-missing");
    for (const title of ["Introduction / Departmental Mission", "Objectives", "Achievements", "Conclusion"]) {
      await expect(missing.getByRole("link", { name: title })).toBeVisible();
    }
    await expect(page.getByRole("button", { name: "Submit report" })).toBeDisabled();
    await missing.getByRole("link", { name: "Introduction / Departmental Mission" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Introduction / Departmental Mission" })).toBeFocused();

    // US-4: hints; US-5: autosave
    await expect(page.getByText(/say why your department exists/)).toBeVisible();
    await page.getByLabel("Introduction / Departmental Mission").fill("We look after the church buildings.");
    await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);

    // US-3: carry forward, then more objectives
    await goToSection(page, "Objectives");
    await expect(page.getByText("Carry forward from 2025-2026")).toBeVisible();
    await page.getByRole("button", { name: "Carry forward: Hold a youth camp" }).click();
    await expect(page.getByLabel("Objective 1")).toHaveValue("Hold a youth camp");
    for (const text of ["Repair the roof", "Paint the hall"]) {
      await page.getByRole("button", { name: "Add objective" }).click();
      await page.getByLabel(/^Objective \d+$/).last().fill(text);
    }
    // Reorder with the keyboard
    await page.getByRole("button", { name: "Move objective number 3 up" }).focus();
    await page.keyboard.press("Enter");
    await expect(page.getByLabel("Objective 2")).toHaveValue("Paint the hall");

    await goToSection(page, "Achievements");
    await page.getByRole("button", { name: "Add achievement" }).click();
    await page.getByLabel(/^Achievement \d+$/).last().fill("Roof repaired in March");
    await page.getByLabel(/^Fulfils objective/).last().selectOption({ label: "Repair the roof" });

    await goToSection(page, "Conclusion");
    await page.getByLabel("Conclusion").fill("Thank you to every giver.");
    await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);

    // US-6: the money from the books, notes only
    await goToSection(page, "Financial Statement");
    await expect(page.getByTestId("financial-row-brought-forward")).toContainText("KES 1,000.00");
    await expect(page.getByTestId("financial-row-money-in")).toContainText("KES 4,500.00");
    await expect(page.getByTestId("financial-row-money-out")).toContainText("KES 1,200.00");
    await expect(page.getByTestId("financial-row-carried-forward")).toContainText("KES 4,300.00");
    await expect(page.getByText(/From the treasurer's books as of/)).toBeVisible();
    await expect(page.getByTestId("financial-pending")).toContainText("1 requisition");
    await page.getByLabel("Note for money in: Roof appeal").fill("Harambee in May");
    await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);

    expect(await unnamedControls(page)).toEqual([]);
    await expect(page.getByTestId("dept-report-stepper").locator('[aria-current="step"]')).toHaveText(/Financial Statement/);

    // US-7: preview & submit
    await page.getByRole("button", { name: "Preview & submit" }).click();
    const preview = page.getByTestId("dept-report-preview");
    await expect(preview.getByRole("heading", { name: "Building Fund Department Report" })).toBeVisible();
    await expect(preview.getByText("Fulfils: Repair the roof")).toBeVisible();
    await expect(preview.getByText("Harambee in May")).toBeVisible();
    await expect(page.getByTestId("dept-report-missing")).toHaveCount(0);
    await page.getByRole("button", { name: "Submit report" }).click();
    await page.getByRole("dialog", { name: "Submit report?" }).getByRole("button", { name: "Submit" }).click();
    await expect(page.getByTestId("dept-report-status")).toHaveText("Submitted");
    await expect(page.getByRole("textbox")).toHaveCount(0);

    // What reached the server
    const achievements = api.state.report!.items.filter((i) => i.kind === "achievement");
    const roof = api.state.report!.items.find((i) => i.text === "Repair the roof")!;
    expect(achievements).toEqual([expect.objectContaining({ text: "Roof repaired in March", fulfilsId: roof.id })]);
    expect(api.state.report!.items.filter((i) => i.kind === "objective").map((i) => i.text)).toEqual([
      "Hold a youth camp",
      "Paint the hall",
      "Repair the roof",
    ]);

    // Back on My reports: handed in
    await page.goto("/admin/department-reports", { waitUntil: "networkidle" });
    await expect(page.getByTestId("dept-report-card").getByTestId("dept-report-status")).toHaveText("Submitted");
  });

  test("sees the reviewer's comments, fixes the report and resubmits (US-10)", async ({ page }) => {
    await injectSession(page);
    await installLeaderApi(page, {
      report: {
        status: "returned",
        introduction: "We look after the church buildings.",
        conclusion: "Thank you to every giver.",
        leaders: [{ name: "Dan Builder", roleTitle: "Department leader", phone: "", memberId: null }],
        items: [
          { id: "11", kind: "objective", order: 0, text: "Repair the roof", fulfilsId: null, carriedFromId: null },
          { id: "21", kind: "achievement", order: 0, text: "Roof repaired in March", fulfilsId: "11", carriedFromId: null },
        ],
        comments: [
          { sectionKey: "achievements", body: "Please add the roof cost", author: "Pastor Paul", createdAt: new Date().toISOString(), resolved: false },
        ],
      },
    });

    await page.goto("/admin/department-reports/5", { waitUntil: "networkidle" });
    await expect(page.getByTestId("dept-report-status")).toHaveText("Returned");
    await expect(page.getByTestId("dept-report-comments")).toContainText("Please add the roof cost");
    // Opens on the commented section, with the comment pinned on top
    await expect(page.getByRole("heading", { level: 2, name: "Achievements" })).toBeVisible();
    await expect(page.getByRole("note")).toContainText("Please add the roof cost");

    await goToSection(page, /Achievements/);
    await page.getByLabel(/^Achievement \d+$/).first().fill("Roof repaired in March for KES 120,000");
    await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);
    await page.getByRole("button", { name: "Preview & submit" }).click();
    await page.getByRole("button", { name: "Submit report" }).click();
    await page.getByRole("dialog", { name: "Submit report?" }).getByRole("button", { name: "Submit" }).click();
    await expect(page.getByTestId("dept-report-status")).toHaveText("Submitted");
    await expect(page.getByTestId("dept-report-comments")).toHaveCount(0);
  });
});

test.describe("Department reports — leader on a phone (390 px)", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test("works section by section and picks up where it left off (US-5)", async ({ page }) => {
    await injectSession(page);
    const api = await installLeaderApi(page, {
      report: {
        leaders: [{ name: "Dan Builder", roleTitle: "Department leader", phone: "", memberId: null }],
      },
    });

    await page.goto("/admin/department-reports", { waitUntil: "networkidle" });
    const card = page.getByTestId("dept-report-card");
    await expect(card.getByTestId("dept-report-status")).toHaveText("Draft");
    expect(await noSidewaysScroll(page)).toBe(true);
    await card.getByRole("button", { name: "Continue" }).click();
    await expect(page).toHaveURL(/\/admin\/department-reports\/5$/, { timeout: 60_000 });

    // Phones get a section list behind a toggle, and a sticky "Next section" bar
    const stepper = page.getByTestId("dept-report-stepper");
    await expect(stepper).toBeHidden();
    await page.getByRole("button", { name: /Section 1 of 8/ }).click();
    await expect(stepper).toBeVisible();
    await stepper.getByRole("button", { name: "Introduction / Departmental Mission" }).click();
    await expect(stepper).toBeHidden();

    await page.getByLabel("Introduction / Departmental Mission").fill("We look after the church buildings.");
    await expect(page.getByTestId("autosave-status")).toHaveText(/Saved/);
    expect(await noSidewaysScroll(page)).toBe(true);

    await page.getByRole("button", { name: "Next section" }).click();
    await expect(page.getByRole("heading", { level: 2, name: "Leaders" })).toBeFocused();
    await expect(page.getByRole("button", { name: "Next section" })).toBeInViewport();
    await page.getByRole("button", { name: "Next section" }).click();
    await page.getByRole("button", { name: "Add objective" }).click();
    await page.getByLabel("Objective 1").fill("Repair the roof");
    await page.getByRole("button", { name: "Next section" }).click(); // leaving the section saves it
    await expect.poll(() => api.state.report!.items.map((i) => i.text)).toEqual(["Repair the roof"]);

    await page.getByRole("button", { name: /Section \d of 8/ }).click();
    await goToSection(page, "Financial Statement");
    await expect(page.getByTestId("financial-row-money-in")).toContainText("KES 4,500.00");
    expect(await noSidewaysScroll(page)).toBe(true);
    expect(await unnamedControls(page)).toEqual([]);

    // Pick up where I left off: reload and the work is still there
    await page.reload({ waitUntil: "networkidle" });
    await page.getByRole("button", { name: /Section \d of 8/ }).click();
    await page.getByTestId("dept-report-stepper").getByRole("button", { name: "Introduction / Departmental Mission" }).click();
    await expect(page.getByLabel("Introduction / Departmental Mission")).toHaveValue("We look after the church buildings.");
    await page.getByRole("button", { name: /Section \d of 8/ }).click();
    await page.getByTestId("dept-report-stepper").getByRole("button", { name: "Objectives" }).click();
    await expect(page.getByLabel("Objective 1")).toHaveValue("Repair the roof");

    // Preview at phone width: missing sections listed, no sideways scroll
    await page.getByRole("button", { name: "Preview & submit" }).click();
    await expect(page.getByTestId("dept-report-missing").getByRole("link", { name: "Achievements" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Submit report" })).toBeDisabled();
    expect(await noSidewaysScroll(page)).toBe(true);
  });
});
